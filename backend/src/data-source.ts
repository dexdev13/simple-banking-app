import 'tsconfig-paths/register';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '@/modules/users/entities/user.entity';
import { Account } from '@/modules/accounts/entities/account.entity';
import { Transaction } from '@/modules/transactions/entities/transaction.entity';
import { RefreshToken } from '@modules/auth/entities/refresh-token.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User, Account, Transaction, RefreshToken],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
