import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  VersionColumn,
  Index,
  Check,
} from 'typeorm';
import { SoftDeletableEntity } from '@/common/entities/soft-deletable.entity';
import { User } from '@/modules/users/entities/user.entity';
import { Transaction } from '@/modules/transactions/entities/transaction.entity';

export enum AccountStatus {
  ACTIVE = 'active',
  LOCKED = 'locked',
}

@Entity('accounts')
@Index('uq_accounts_account_number_active', ['accountNumber'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Index('idx_accounts_user_id_status', ['userId', 'status'])
@Check('chk_accounts_balance_non_negative', '"balance" >= 0')
@Check('chk_accounts_currency_uppercase', 'currency = upper(currency)')
export class Account extends SoftDeletableEntity {
  @Column({ name: 'user_id', type: 'varchar', length: 24 })
  userId!: string;

  @ManyToOne(() => User, (user) => user.accounts, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'account_number', type: 'varchar', length: 32 })
  accountNumber!: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: '0.00' })
  balance!: string;

  @Column({ type: 'varchar', length: 3, default: 'VND' })
  currency!: string;

  @Column({ type: 'enum', enum: AccountStatus, default: AccountStatus.ACTIVE })
  status!: AccountStatus;

  @VersionColumn()
  version!: number; // Optimistic Locking

  @OneToMany(() => Transaction, (tx) => tx.fromAccount)
  outgoingTransactions!: Transaction[];

  @OneToMany(() => Transaction, (tx) => tx.toAccount)
  incomingTransactions!: Transaction[];
}
