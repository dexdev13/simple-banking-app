import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import { ImmutableEntity } from '@common/entities/immutable.entity';
import { LedgerAccount } from '@modules/ledger/entities/ledger-account.entity';
import { LedgerTransaction } from '@modules/ledger/entities/ledger-transaction.entity';

export enum EntrySide {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

@Entity('ledger_entries')
@Index('uq_ledger_entries_transaction_line', ['transactionId', 'lineNo'], { unique: true })
@Index('idx_ledger_entries_account_created', ['accountId', 'createdAt'])
@Index('idx_ledger_entries_transaction', ['transactionId'])
@Check('chk_ledger_entries_amount_positive', '"amount" > 0')
export class LedgerEntry extends ImmutableEntity {
  @Column({ name: 'transaction_id', type: 'varchar', length: 24 })
  transactionId!: string;

  @ManyToOne(() => LedgerTransaction, (transaction) => transaction.entries, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'transaction_id' })
  transaction!: LedgerTransaction;

  @Column({ name: 'account_id', type: 'varchar', length: 24 })
  accountId!: string;

  @ManyToOne(() => LedgerAccount, (account) => account.entries, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'account_id' })
  account!: LedgerAccount;

  @Column({ name: 'line_no', type: 'smallint' })
  lineNo!: number;

  @Column({ type: 'enum', enum: EntrySide })
  side!: EntrySide;

  @Column({ type: 'numeric', precision: 18, scale: 4 })
  amount!: string;

  @Column({ name: 'balance_after', type: 'numeric', precision: 18, scale: 4, nullable: true })
  balanceAfter!: string | null;
}
