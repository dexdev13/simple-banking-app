import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Account, AccountStatus } from '@modules/accounts/entities/account.entity';
import { AccountsService } from '@modules/accounts/accounts.service';
import { LedgerAccount } from '@modules/ledger/entities/ledger-account.entity';
import {
  LedgerTransaction,
  LedgerTransactionStatus,
} from '@modules/ledger/entities/ledger-transaction.entity';
import { LedgerEntry, EntrySide } from '@modules/ledger/entities/ledger-entry.entity';
import { LedgerAccountsService } from '@modules/ledger/ledger-accounts.service';
import { CreateLedgerTransferDto } from '@modules/ledger/dto/create-ledger-transfer.dto';
import { CreateLedgerDepositDto } from '@modules/ledger/dto/create-ledger-deposit.dto';
import { CreateLedgerWithdrawDto } from '@modules/ledger/dto/create-ledger-withdraw.dto';
import { LedgerTransactionDto } from '@modules/ledger/dto/ledger-transaction.dto';
import { ReconciliationDto } from '@modules/ledger/dto/reconciliation.dto';
import { isUniqueViolation } from '@common/utils/postgres-error.util';

interface PostDoubleEntryParams {
  referenceId: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: string;
  currency: string;
  description: string;
  guardDebitSufficientFunds: boolean;
}

@Injectable()
export class LedgerTransactionsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(LedgerTransaction)
    private readonly ledgerTransactionRepository: Repository<LedgerTransaction>,
    @InjectRepository(LedgerEntry)
    private readonly ledgerEntryRepository: Repository<LedgerEntry>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly accountsService: AccountsService,
    private readonly ledgerAccountsService: LedgerAccountsService,
  ) {}

  async postTransfer(
    dto: CreateLedgerTransferDto,
    userId: string,
    referenceId: string,
  ): Promise<LedgerTransactionDto> {
    const cached = await this.findCachedByReferenceId(referenceId);
    if (cached) return cached;

    const fromCustomerAccount = await this.accountsService.findOwnedById(dto.fromAccountId, userId);
    const toCustomerAccount = await this.accountRepository.findOne({
      where: { accountNumber: dto.toAccountNumber },
    });

    if (!toCustomerAccount) {
      throw new NotFoundException('Không tìm thấy tài khoản nhận');
    }
    if (fromCustomerAccount.id === toCustomerAccount.id) {
      throw new BadRequestException('Không thể chuyển khoản cho chính tài khoản này');
    }
    this.assertAllActive(fromCustomerAccount, toCustomerAccount);

    const fromLedgerAccount = await this.ledgerAccountsService.getOrCreateForCustomerAccount(
      fromCustomerAccount.id,
      fromCustomerAccount.currency,
    );
    const toLedgerAccount = await this.ledgerAccountsService.getOrCreateForCustomerAccount(
      toCustomerAccount.id,
      toCustomerAccount.currency,
    );

    return this.postAndHandleRace(referenceId, () =>
      this.postDoubleEntry({
        referenceId,
        debitAccountId: fromLedgerAccount.id,
        creditAccountId: toLedgerAccount.id,
        amount: dto.amount,
        currency: fromCustomerAccount.currency,
        description: dto.description ?? 'Transfer',
        guardDebitSufficientFunds: true,
      }),
    );
  }

  async postDeposit(
    dto: CreateLedgerDepositDto,
    userId: string,
    referenceId: string,
  ): Promise<LedgerTransactionDto> {
    const cached = await this.findCachedByReferenceId(referenceId);
    if (cached) return cached;

    const customerAccount = await this.accountsService.findOwnedById(dto.accountId, userId);
    this.assertAllActive(customerAccount);

    const systemCash = await this.ledgerAccountsService.getSystemCashAccount(
      customerAccount.currency,
    );
    const customerLedgerAccount = await this.ledgerAccountsService.getOrCreateForCustomerAccount(
      customerAccount.id,
      customerAccount.currency,
    );

    return this.postAndHandleRace(referenceId, () =>
      this.postDoubleEntry({
        referenceId,
        debitAccountId: systemCash.id,
        creditAccountId: customerLedgerAccount.id,
        amount: dto.amount,
        currency: customerAccount.currency,
        description: dto.description ?? 'Deposit',
        guardDebitSufficientFunds: false,
      }),
    );
  }

  async postWithdraw(
    dto: CreateLedgerWithdrawDto,
    userId: string,
    referenceId: string,
  ): Promise<LedgerTransactionDto> {
    const cached = await this.findCachedByReferenceId(referenceId);
    if (cached) return cached;

    const customerAccount = await this.accountsService.findOwnedById(dto.accountId, userId);
    this.assertAllActive(customerAccount);

    const systemCash = await this.ledgerAccountsService.getSystemCashAccount(
      customerAccount.currency,
    );
    const customerLedgerAccount = await this.ledgerAccountsService.getOrCreateForCustomerAccount(
      customerAccount.id,
      customerAccount.currency,
    );

    return this.postAndHandleRace(referenceId, () =>
      this.postDoubleEntry({
        referenceId,
        debitAccountId: customerLedgerAccount.id,
        creditAccountId: systemCash.id,
        amount: dto.amount,
        currency: customerAccount.currency,
        description: dto.description ?? 'Withdraw',
        guardDebitSufficientFunds: true,
      }),
    );
  }

  async reconcileCustomerAccount(
    customerAccountId: string,
    userId: string,
  ): Promise<ReconciliationDto> {
    const customerAccount = await this.accountsService.findOwnedById(customerAccountId, userId);
    const ledgerAccount = await this.ledgerAccountsService.getOrCreateForCustomerAccount(
      customerAccount.id,
      customerAccount.currency,
    );

    const raw = await this.ledgerEntryRepository
      .createQueryBuilder('entry')
      .select(
        `COALESCE(SUM(CASE WHEN entry.side = :credit THEN entry.amount ELSE -entry.amount END), 0)`,
        'sum',
      )
      .where('entry.accountId = :accountId', { accountId: ledgerAccount.id })
      .setParameter('credit', EntrySide.CREDIT)
      .getRawOne<{ sum: string }>();

    const computedBalance = raw?.sum ?? '0';
    const cachedBalance = ledgerAccount.cachedBalance;

    return new ReconciliationDto({
      ledgerAccountId: ledgerAccount.id,
      cachedBalance,
      computedBalance,
      matches: Number(cachedBalance) === Number(computedBalance),
    });
  }

  private async postDoubleEntry(params: PostDoubleEntryParams): Promise<LedgerTransaction> {
    return this.dataSource.transaction(async (manager) => {
      // Lock theo thứ tự id tăng dần chống deadlock
      const [firstId, secondId] = [params.debitAccountId, params.creditAccountId].sort();
      await manager
        .createQueryBuilder(LedgerAccount, 'account')
        .setLock('pessimistic_write')
        .where('account.id = :id', { id: firstId })
        .getOne();
      await manager
        .createQueryBuilder(LedgerAccount, 'account')
        .setLock('pessimistic_write')
        .where('account.id = :id', { id: secondId })
        .getOne();

      const debitQuery = manager
        .createQueryBuilder()
        .update(LedgerAccount)
        .set({ cachedBalance: () => 'cached_balance - :amount' })
        .where('id = :debitId', { debitId: params.debitAccountId })
        .setParameter('amount', params.amount);

      if (params.guardDebitSufficientFunds) {
        debitQuery.andWhere('cached_balance >= :amount');
      }

      const debitResult = await debitQuery.execute();
      if (params.guardDebitSufficientFunds && debitResult.affected === 0) {
        throw new BadRequestException('Số dư không đủ để thực hiện giao dịch');
      }

      await manager
        .createQueryBuilder()
        .update(LedgerAccount)
        .set({ cachedBalance: () => 'cached_balance + :amount' })
        .where('id = :creditId', { creditId: params.creditAccountId })
        .setParameter('amount', params.amount)
        .execute();

      const transaction = await manager.save(
        manager.create(LedgerTransaction, {
          referenceId: params.referenceId,
          status: LedgerTransactionStatus.POSTED,
          description: params.description,
          currency: params.currency,
          postedAt: new Date(),
        }),
      );

      await manager.save([
        manager.create(LedgerEntry, {
          transactionId: transaction.id,
          accountId: params.debitAccountId,
          lineNo: 1,
          side: EntrySide.DEBIT,
          amount: params.amount,
        }),
        manager.create(LedgerEntry, {
          transactionId: transaction.id,
          accountId: params.creditAccountId,
          lineNo: 2,
          side: EntrySide.CREDIT,
          amount: params.amount,
        }),
      ]);

      return transaction;
    });
  }

  private async findCachedByReferenceId(referenceId: string): Promise<LedgerTransactionDto | null> {
    const existing = await this.ledgerTransactionRepository.findOne({ where: { referenceId } });
    return existing ? LedgerTransactionDto.fromEntity(existing) : null;
  }

  private async postAndHandleRace(
    referenceId: string,
    post: () => Promise<LedgerTransaction>,
  ): Promise<LedgerTransactionDto> {
    try {
      const transaction = await post();
      return LedgerTransactionDto.fromEntity(transaction);
    } catch (error) {
      if (isUniqueViolation(error)) {
        const raced = await this.ledgerTransactionRepository.findOneOrFail({
          where: { referenceId },
        });
        return LedgerTransactionDto.fromEntity(raced);
      }
      throw error;
    }
  }

  private assertAllActive(...accounts: Account[]): void {
    const hasInactive = accounts.some((account) => account.status !== AccountStatus.ACTIVE);
    if (hasInactive) {
      throw new BadRequestException('Tài khoản nguồn hoặc đích đang bị khoá');
    }
  }
}
