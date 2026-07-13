import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AccountsService } from '@modules/accounts/accounts.service';
import { AccountDto } from '@modules/accounts/dto/account.dto';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('me')
  async myAccounts(@CurrentUser('userId') userId: string): Promise<AccountDto[]> {
    const accounts = await this.accountsService.findAllByUserId(userId);
    return AccountDto.fromEntities(accounts);
  }

  @Get(':id')
  async getOne(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ): Promise<AccountDto> {
    const account = await this.accountsService.findOwnedById(id, userId);
    return AccountDto.fromEntity(account);
  }
}
