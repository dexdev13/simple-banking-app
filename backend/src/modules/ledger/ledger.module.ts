import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '@modules/accounts/entities/account.entity';
import { AccountsModule } from '@modules/accounts/accounts.module';
import { LedgerAccount } from '@modules/ledger/entities/ledger-account.entity';
import { LedgerTransaction } from '@modules/ledger/entities/ledger-transaction.entity';
import { LedgerEntry } from '@modules/ledger/entities/ledger-entry.entity';
import { LedgerAccountsService } from '@modules/ledger/ledger-accounts.service';
import { LedgerTransactionsService } from '@modules/ledger/ledger-transactions.service';
import { LedgerController } from '@modules/ledger/ledger.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([LedgerAccount, LedgerTransaction, LedgerEntry, Account]),
    AccountsModule,
  ],
  controllers: [LedgerController],
  providers: [LedgerAccountsService, LedgerTransactionsService],
})
export class LedgerModule {}
