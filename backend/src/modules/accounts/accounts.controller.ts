import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '@/modules/auth/strategies/jwt.strategy';
import { AccountsService } from '@/modules/accounts/accounts.service';
import { AccountDto } from '@/modules/accounts/dto/account.dto';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('me')
  async myAccounts(@CurrentUser() currentUser: CurrentUserPayload): Promise<AccountDto[]> {
    const accounts = await this.accountsService.findAllByUserId(currentUser.userId);
    return AccountDto.fromEntities(accounts);
  }

  @Get(':id')
  async getOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<AccountDto> {
    const account = await this.accountsService.findOwnedById(id, currentUser.userId);
    return AccountDto.fromEntity(account);
  }
}
