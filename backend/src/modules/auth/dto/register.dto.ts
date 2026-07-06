import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value,
  )
  @IsString({ message: 'Full name must be a string' })
  @Length(2, 150, { message: 'Full name must be between 2 and 150 characters' })
  @Matches(/\S/, { message: 'Full name cannot be empty or only whitespace' })
  fullName!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @Length(8, 72, { message: 'Password must be between 8 and 72 characters' }) // bcrypt chỉ hash tối đa 72 bytes
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number',
  })
  password!: string;
}
