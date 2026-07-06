import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @Length(8, 72, {
    message: 'Password must be between 8 and 72 characters',
  })
  password!: string;
}
