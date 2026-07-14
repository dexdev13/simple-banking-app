import {
  LedgerTransaction,
  LedgerTransactionStatus,
} from '@modules/ledger/entities/ledger-transaction.entity';

export class LedgerTransactionDto {
  id: string;
  referenceId: string;
  status: LedgerTransactionStatus;
  description: string;
  currency: string;
  postedAt: Date | null;
  createdAt: Date;

  private constructor(transaction: LedgerTransaction) {
    this.id = transaction.id;
    this.referenceId = transaction.referenceId;
    this.status = transaction.status;
    this.description = transaction.description;
    this.currency = transaction.currency;
    this.postedAt = transaction.postedAt;
    this.createdAt = transaction.createdAt;
  }

  static fromEntity(transaction: LedgerTransaction): LedgerTransactionDto {
    return new LedgerTransactionDto(transaction);
  }
}
