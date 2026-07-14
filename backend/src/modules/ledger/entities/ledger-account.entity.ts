import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { CoreEntity } from '@common/entities/core.entity';
import { LedgerEntry } from '@modules/ledger/entities/ledger-entry.entity';

export enum LedgerAccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  EXPENSE = 'expense',
  REVENUE = 'revenue',
}

export enum LedgerAccountStatus {
  ACTIVE = 'active',
  FROZEN = 'frozen',
  CLOSED = 'closed',
  SUSPENDED = 'suspended',
}

export enum LedgerOwnerType {
  USER = 'user',
  MERCHANT = 'merchant',
  SYSTEM = 'system',
}

@Entity('ledger_accounts')
@Index('uq_ledger_accounts_code', ['code'], { unique: true })
@Index('idx_ledger_accounts_type', ['type'])
@Index('idx_ledger_accounts_status', ['status'])
@Index('idx_ledger_accounts_owner', ['ownerType', 'ownerId'])
export class LedgerAccount extends CoreEntity {
  @Column({ type: 'varchar', length: 64 })
  code!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'enum', enum: LedgerAccountType })
  type!: LedgerAccountType;

  @Column({ type: 'enum', enum: LedgerAccountStatus, default: LedgerAccountStatus.ACTIVE })
  status!: LedgerAccountStatus;

  @Column({ type: 'varchar', length: 3 })
  currency!: string;

  @Column({ name: 'owner_type', type: 'enum', enum: LedgerOwnerType, nullable: true })
  ownerType!: LedgerOwnerType | null;

  @Column({ name: 'owner_id', type: 'varchar', length: 64, nullable: true })
  ownerId!: string | null;

  @Column({ name: 'parent_id', type: 'varchar', length: 24, nullable: true })
  parentId!: string | null;

  @ManyToOne(() => LedgerAccount, (account) => account.children, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'parent_id' })
  parent!: LedgerAccount | null;

  @OneToMany(() => LedgerAccount, (account) => account.parent)
  children!: LedgerAccount[];

  // Cached field for fast reads only. khi ghi bắt buộc dùng toán tử INCREMENT/DECREMENT SQL
  // Source of truth is always LedgerEntry.
  @Column({ name: 'cached_balance', type: 'numeric', precision: 18, scale: 4, default: '0.0000' })
  cachedBalance!: string;

  @OneToMany(() => LedgerEntry, (entry) => entry.account)
  entries!: LedgerEntry[];
}
