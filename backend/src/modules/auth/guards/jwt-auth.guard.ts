import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUserPayload } from '@common/interfaces/auth.interface';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // canActivate mặc định đủ dùng ở giai đoạn này.
  // Sẽ override khi thêm @Public(): đọc Reflector metadata, bỏ qua guard nếu route đánh dấu public,
  // ngược lại mới gọi super.canActivate(context).

  handleRequest<TUser = CurrentUserPayload>(
    err: Error | null,
    user: TUser | false,
    info: { name?: string } | undefined,
  ): TUser {
    if (info?.name === 'TokenExpiredError') {
      throw new UnauthorizedException('Access token đã hết hạn');
    }
    if (err || !user) {
      throw new UnauthorizedException('Access token không hợp lệ');
    }
    return user;
  }
}
