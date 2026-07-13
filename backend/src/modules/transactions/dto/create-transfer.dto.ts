import { IsOptional, IsString, MaxLength } from 'class-validator';
import { IsDecimalAmount } from '@common/validators/is-decimal-amount.validator';

export class CreateTransferDto {
  @IsString()
  fromAccountId!: string;

  @IsString()
  toAccountNumber!: string;

  @IsDecimalAmount()
  amount!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
