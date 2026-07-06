import { Account, AccountStatus } from '@/modules/accounts/entities/account.entity';

export class AccountDto {
  id: string;
  accountNumber: string;
  balance: string;
  currency: string;
  status: AccountStatus;
  createdAt: Date;

  private constructor(account: Account) {
    this.id = account.id;
    this.accountNumber = account.accountNumber;
    this.balance = account.balance;
    this.currency = account.currency;
    this.status = account.status;
    this.createdAt = account.createdAt;
  }

  static fromEntity(account: Account): AccountDto {
    return new AccountDto(account);
  }

  static fromEntities(accounts: Account[]): AccountDto[] {
    return accounts.map((account) => AccountDto.fromEntity(account));
  }
}
