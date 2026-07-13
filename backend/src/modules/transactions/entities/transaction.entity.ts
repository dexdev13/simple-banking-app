import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import { CoreEntity } from '@common/entities/core.entity';
import { Account } from '@modules/accounts/entities/account.entity';

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  TRANSFER = 'transfer',
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('transactions')
@Index('idx_transactions_from_account_created', ['fromAccountId', 'createdAt'])
@Index('idx_transactions_to_account_created', ['toAccountId', 'createdAt'])
@Index('idx_transactions_status_created', ['status', 'createdAt'])
@Index('uq_transactions_idempotency_key_active', ['idempotencyKey'], {
  unique: true,
  where: '"idempotency_key" IS NOT NULL',
})
@Check('chk_transactions_amount_positive', '"amount" > 0')
@Check(
  'chk_transactions_type_consistency',
  `
    (type = 'deposit'  AND from_account_id IS NULL     AND to_account_id IS NOT NULL) OR
    (type = 'withdraw' AND from_account_id IS NOT NULL AND to_account_id IS NULL) OR
    (type = 'transfer' AND from_account_id IS NOT NULL AND to_account_id IS NOT NULL)
  `,
)
export class Transaction extends CoreEntity {
  @Column({ name: 'from_account_id', type: 'varchar', length: 24, nullable: true })
  fromAccountId!: string | null;

  @ManyToOne(() => Account, (account) => account.outgoingTransactions, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'from_account_id' })
  fromAccount!: Account | null;

  @Column({ name: 'to_account_id', type: 'varchar', length: 24, nullable: true })
  toAccountId!: string | null;

  @ManyToOne(() => Account, (account) => account.incomingTransactions, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'to_account_id' })
  toAccount!: Account | null;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount!: string;

  @Column({ type: 'enum', enum: TransactionType })
  type!: TransactionType;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status!: TransactionStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 64, nullable: true })
  idempotencyKey!: string | null;
}
