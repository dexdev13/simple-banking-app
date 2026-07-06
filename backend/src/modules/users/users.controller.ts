import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '@/modules/auth/strategies/jwt.strategy';
import { UsersService } from '@/modules/users/users.service';
import { UserProfileDto } from '@/modules/users/dto/user-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@CurrentUser() currentUser: CurrentUserPayload): Promise<UserProfileDto> {
    const user = await this.usersService.findById(currentUser.userId);
    return UserProfileDto.fromEntity(user);
  }
}
