import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { CoreEntity } from '@common/entities/core.entity';
import { LedgerEntry } from '@modules/ledger/entities/ledger-entry.entity';

export enum LedgerTransactionStatus {
  PENDING = 'pending',
  POSTED = 'posted',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

@Entity('ledger_transactions')
@Index('uq_ledger_transactions_reference_id', ['referenceId'], { unique: true })
@Index('idx_ledger_transactions_status_created', ['status', 'createdAt'])
@Index('uq_ledger_transactions_reversal_of', ['reversalOfTransactionId'], {
  unique: true,
  where: '"reversal_of_transaction_id" IS NOT NULL',
})
export class LedgerTransaction extends CoreEntity {
  // Idempotency key from client / webhook / internal caller
  @Column({ name: 'reference_id', type: 'varchar', length: 128 })
  referenceId!: string;

  @Column({ type: 'enum', enum: LedgerTransactionStatus, default: LedgerTransactionStatus.PENDING })
  status!: LedgerTransactionStatus;

  @Column({ type: 'varchar', length: 500 })
  description!: string;

  @Column({ type: 'varchar', length: 3 })
  currency!: string;

  // Optional business metadata (JSONB in PostgreSQL)
  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  // Useful for reconciliation / audit
  @Column({ name: 'occurred_at', type: 'timestamptz', nullable: true })
  occurredAt!: Date | null;

  @Column({ name: 'posted_at', type: 'timestamptz', nullable: true })
  postedAt!: Date | null;

  @Column({ name: 'reversal_of_transaction_id', type: 'varchar', length: 24, nullable: true })
  reversalOfTransactionId!: string | null;

  @ManyToOne(() => LedgerTransaction, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reversal_of_transaction_id' })
  reversalOfTransaction!: LedgerTransaction | null;

  @OneToMany(() => LedgerEntry, (entry) => entry.transaction)
  entries!: LedgerEntry[];
}
