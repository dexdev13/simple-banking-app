import 'tsconfig-paths/register';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '@modules/users/entities/user.entity';
import { Account } from '@modules/accounts/entities/account.entity';
import { Transaction } from '@modules/transactions/entities/transaction.entity';
import { RefreshToken } from '@modules/auth/entities/refresh-token.entity';
import { LedgerAccount } from '@modules/ledger/entities/ledger-account.entity';
import { LedgerTransaction } from '@modules/ledger/entities/ledger-transaction.entity';
import { LedgerEntry } from '@modules/ledger/entities/ledger-entry.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [
    User,
    Account,
    Transaction,
    RefreshToken,
    LedgerAccount,
    LedgerTransaction,
    LedgerEntry,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
