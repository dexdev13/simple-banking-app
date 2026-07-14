import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { LedgerTransactionsService } from '@modules/ledger/ledger-transactions.service';
import { CreateLedgerTransferDto } from '@modules/ledger/dto/create-ledger-transfer.dto';
import { CreateLedgerDepositDto } from '@modules/ledger/dto/create-ledger-deposit.dto';
import { CreateLedgerWithdrawDto } from '@modules/ledger/dto/create-ledger-withdraw.dto';

@Controller('ledger')
@UseGuards(JwtAuthGuard)
export class LedgerController {
  constructor(private readonly ledgerTransactionsService: LedgerTransactionsService) {}

  @Post('transfer')
  transfer(
    @Body() dto: CreateLedgerTransferDto,
    @CurrentUser('userId') userId: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    this.assertIdempotencyKey(idempotencyKey);
    return this.ledgerTransactionsService.postTransfer(dto, userId, idempotencyKey);
  }

  @Post('deposit')
  deposit(
    @Body() dto: CreateLedgerDepositDto,
    @CurrentUser('userId') userId: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    this.assertIdempotencyKey(idempotencyKey);
    return this.ledgerTransactionsService.postDeposit(dto, userId, idempotencyKey);
  }

  @Post('withdraw')
  withdraw(
    @Body() dto: CreateLedgerWithdrawDto,
    @CurrentUser('userId') userId: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    this.assertIdempotencyKey(idempotencyKey);
    return this.ledgerTransactionsService.postWithdraw(dto, userId, idempotencyKey);
  }

  @Get('accounts/:accountId/reconciliation')
  reconcile(@Param('accountId') accountId: string, @CurrentUser('userId') userId: string) {
    return this.ledgerTransactionsService.reconcileCustomerAccount(accountId, userId);
  }

  private assertIdempotencyKey(key?: string): asserts key is string {
    if (!key) {
      throw new BadRequestException('Thiếu header Idempotency-Key');
    }
  }
}
