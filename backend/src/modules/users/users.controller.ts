import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UsersService } from '@modules/users/users.service';
import { UserProfileDto } from '@modules/users/dto/user-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@CurrentUser('userId') userId: string): Promise<UserProfileDto> {
    const user = await this.usersService.findById(userId);
    return UserProfileDto.fromEntity(user);
  }
}
