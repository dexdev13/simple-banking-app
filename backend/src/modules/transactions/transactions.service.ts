import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Account, AccountStatus } from '@modules/accounts/entities/account.entity';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '@modules/transactions/entities/transaction.entity';
import { AccountsService } from '@modules/accounts/accounts.service';
import { CreateTransferDto } from '@modules/transactions/dto/create-transfer.dto';
import { TransactionDto } from '@modules/transactions/dto/transaction.dto';
import { isUniqueViolation } from '@common/utils/postgres-error.util';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Transaction) private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Account) private readonly accountRepository: Repository<Account>,
    private readonly accountsService: AccountsService,
  ) {}

  async transfer(
    dto: CreateTransferDto,
    userId: string,
    idempotencyKey: string,
  ): Promise<TransactionDto> {
    const existing = await this.transactionRepository.findOne({ where: { idempotencyKey } });
    if (existing) {
      return TransactionDto.fromEntity(existing);
    }

    const fromAccount = await this.accountsService.findOwnedById(dto.fromAccountId, userId);
    const toAccount = await this.accountRepository.findOne({
      where: { accountNumber: dto.toAccountNumber },
    });

    if (!toAccount) {
      throw new NotFoundException('Không tìm thấy tài khoản nhận');
    }
    if (fromAccount.id === toAccount.id) {
      throw new BadRequestException('Không thể chuyển khoản cho chính tài khoản này');
    }
    if (fromAccount.status !== AccountStatus.ACTIVE || toAccount.status !== AccountStatus.ACTIVE) {
      throw new BadRequestException('Tài khoản nguồn hoặc đích đang bị khoá');
    }

    try {
      const transaction = await this.dataSource.transaction(async (manager) => {
        // Lock theo thứ tự id tăng dần (không phải theo vai trò from/to) để chống deadlock
        const [firstId, secondId] = [fromAccount.id, toAccount.id].sort();

        await manager
          .createQueryBuilder(Account, 'account')
          .setLock('pessimistic_write')
          .where('account.id = :id', { id: firstId })
          .getOne();

        await manager
          .createQueryBuilder(Account, 'account')
          .setLock('pessimistic_write')
          .where('account.id = :id', { id: secondId })
          .getOne();

        const debitResult = await manager
          .createQueryBuilder()
          .update(Account)
          .set({ balance: () => 'balance - :amount' }) // atomic update
          .where('id = :fromId', { fromId: fromAccount.id })
          .andWhere('balance >= :amount')
          .setParameter('amount', dto.amount)
          .execute();

        if (debitResult.affected === 0) {
          throw new BadRequestException('Số dư không đủ để thực hiện giao dịch');
        }

        await manager
          .createQueryBuilder()
          .update(Account)
          .set({ balance: () => 'balance + :amount' })
          .where('id = :toId', { toId: toAccount.id })
          .setParameter('amount', dto.amount)
          .execute();

        return manager.save(
          manager.create(Transaction, {
            fromAccountId: fromAccount.id,
            toAccountId: toAccount.id,
            amount: dto.amount,
            type: TransactionType.TRANSFER,
            status: TransactionStatus.SUCCESS,
            description: dto.description ?? null,
            idempotencyKey,
          }),
        );
      });

      return TransactionDto.fromEntity(transaction);
    } catch (error) {
      if (isUniqueViolation(error)) {
        const raced = await this.transactionRepository.findOneOrFail({ where: { idempotencyKey } });
        return TransactionDto.fromEntity(raced);
      }
      throw error;
    }
  }
}
