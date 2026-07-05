import { Entity, Column, OneToMany, Index, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Exclude } from 'class-transformer';
import { SoftDeletableEntity } from '@/common/entities/soft-deletable.entity';
import { Account } from '@/modules/accounts/entities/account.entity';

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  LOCKED = 'locked',
}

@Entity('users')
@Index('uq_users_email_active', ['email'], { unique: true, where: '"deleted_at" IS NULL' })
@Index('idx_users_role_status', ['role', 'status'])
export class User extends SoftDeletableEntity {
  @Column({ name: 'full_name', type: 'varchar', length: 150 })
  fullName!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Exclude()
  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role!: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @OneToMany(() => Account, (account) => account.user)
  accounts!: Account[];

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail(): void {
    this.email = this.email.trim().toLowerCase();
  }
}
