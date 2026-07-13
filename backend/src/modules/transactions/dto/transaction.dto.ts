import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '@modules/transactions/entities/transaction.entity';

export class TransactionDto {
  id: string;
  fromAccountId: string | null;
  toAccountId: string | null;
  amount: string;
  type: TransactionType;
  status: TransactionStatus;
  description: string | null;
  createdAt: Date;

  private constructor(transaction: Transaction) {
    this.id = transaction.id;
    this.fromAccountId = transaction.fromAccountId;
    this.toAccountId = transaction.toAccountId;
    this.amount = transaction.amount;
    this.type = transaction.type;
    this.status = transaction.status;
    this.description = transaction.description;
    this.createdAt = transaction.createdAt;
  }

  // static factory method
  static fromEntity(transaction: Transaction): TransactionDto {
    return new TransactionDto(transaction);
  }
}
