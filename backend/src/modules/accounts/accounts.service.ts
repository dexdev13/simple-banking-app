import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '@/modules/accounts/entities/account.entity';

@Injectable()
export class AccountsService {
  constructor(@InjectRepository(Account) private readonly accountRepository: Repository<Account>) {}

  async findAllByUserId(userId: string): Promise<Account[]> {
    return this.accountRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOwnedById(accountId: string, userId: string): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { id: accountId } });
    if (!account || account.userId !== userId) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }
    return account;
  }
}
