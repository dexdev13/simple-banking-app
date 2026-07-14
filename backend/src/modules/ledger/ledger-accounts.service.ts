import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LedgerAccount,
  LedgerAccountType,
  LedgerOwnerType,
} from '@modules/ledger/entities/ledger-account.entity';
import { isUniqueViolation } from '@common/utils/postgres-error.util';

@Injectable()
export class LedgerAccountsService {
  constructor(
    @InjectRepository(LedgerAccount)
    private readonly ledgerAccountRepository: Repository<LedgerAccount>,
  ) {}

  async getSystemCashAccount(currency: string): Promise<LedgerAccount> {
    const code = `SYS-CASH-${currency}`;
    return this.findOrCreate(code, () => ({
      code,
      name: `System Cash (${currency})`,
      type: LedgerAccountType.ASSET,
      ownerType: LedgerOwnerType.SYSTEM,
      ownerId: null,
      currency,
    }));
  }

  async getOrCreateForCustomerAccount(
    customerAccountId: string,
    currency: string,
  ): Promise<LedgerAccount> {
    const code = `LIAB-${customerAccountId}`;
    return this.findOrCreate(code, () => ({
      code,
      name: `Customer Liability - ${customerAccountId}`,
      type: LedgerAccountType.LIABILITY,
      ownerType: LedgerOwnerType.USER,
      ownerId: customerAccountId,
      currency,
    }));
  }

  private async findOrCreate(
    code: string,
    buildData: () => Partial<LedgerAccount>,
  ): Promise<LedgerAccount> {
    const existing = await this.ledgerAccountRepository.findOne({ where: { code } });
    if (existing) return existing;

    try {
      return await this.ledgerAccountRepository.save(
        this.ledgerAccountRepository.create(buildData()),
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        return this.ledgerAccountRepository.findOneOrFail({ where: { code } });
      }
      throw error;
    }
  }
}
