import { registerAs } from '@nestjs/config';
import type { StringValue } from 'ms';

export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET,
  accessExpiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as StringValue,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '30d') as StringValue,
}));
