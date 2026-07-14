import { IsOptional, IsString, MaxLength } from 'class-validator';
import { IsDecimalAmount } from '@common/validators/is-decimal-amount.validator';

export class CreateLedgerDepositDto {
  @IsString()
  accountId!: string;

  @IsDecimalAmount()
  amount!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
