import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '@modules/accounts/entities/account.entity';
import { Transaction } from '@modules/transactions/entities/transaction.entity';
import { AccountsModule } from '@modules/accounts/accounts.module';
import { TransactionsController } from '@modules/transactions/transactions.controller';
import { TransactionsService } from '@modules/transactions/transactions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Account]), AccountsModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
