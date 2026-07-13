import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  UseGuards,
  Get,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { TransactionsService } from '@modules/transactions/transactions.service';
import { CreateTransferDto } from '@modules/transactions/dto/create-transfer.dto';
import { TransactionDto } from '@modules/transactions/dto/transaction.dto';
import { GetTransactionsQueryDto } from '@modules/transactions/dto/get-transactions-query.dto';
import { PaginatedResponseDto } from '@common/dto/paginated-response.dto';

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

  @Get()
  async getHistory(
    @Query() query: GetTransactionsQueryDto,
    @CurrentUser('userId') userId: string,
  ): Promise<PaginatedResponseDto<TransactionDto>> {
    return this.transactionsService.findHistory(userId, query);
  }
}
