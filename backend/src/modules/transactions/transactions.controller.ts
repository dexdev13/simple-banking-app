import { BadRequestException, Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { TransactionsService } from '@modules/transactions/transactions.service';
import { CreateTransferDto } from '@modules/transactions/dto/create-transfer.dto';
import { TransactionDto } from '@modules/transactions/dto/transaction.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('transfer')
  async transfer(
    @Body() dto: CreateTransferDto,
    @CurrentUser('userId') userId: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<TransactionDto> {
    if (!idempotencyKey) {
      throw new BadRequestException('Thiếu header Idempotency-Key');
    }
    return this.transactionsService.transfer(dto, userId, idempotencyKey);
  }
}
