import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUserPayload } from '@common/interfaces/auth.interface';

// Decorator to get current user from request, with optional field selection
export const CurrentUser = createParamDecorator(
  (field: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: CurrentUserPayload }>();
    const user = request.user;

    if (!user) return null;

    return field ? user[field] : user;
  },
);
