import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import type { ConfigType } from '@nestjs/config';
import { compare, hash } from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { User, UserRole, UserStatus } from '@modules/users/entities/user.entity';
import { Account, AccountStatus } from '@modules/accounts/entities/account.entity';
import { RefreshToken } from '@modules/auth/entities/refresh-token.entity';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { LoginDto } from '@modules/auth/dto/login.dto';
import { JwtPayload } from '@common/interfaces/auth.interface';
import ms from 'ms';
import jwtConfig from '@config/jwt.config';
import { isUniqueViolation } from '@common/utils/postgres-error.util';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY) private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: User; account: Account }> {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const passwordHash = await hash(dto.password, 10);

    try {
      return await this.dataSource.transaction(async (manager) => {
        const user = await manager.save(
          manager.create(User, {
            fullName: dto.fullName,
            email: dto.email,
            passwordHash,
            role: UserRole.CUSTOMER,
            status: UserStatus.ACTIVE,
          }),
        );

        const account = await manager.save(
          manager.create(Account, {
            userId: user.id,
            accountNumber: this.generateAccountNumber(),
            balance: '0.00',
            currency: 'VND',
            status: AccountStatus.ACTIVE,
          }),
        );

        return { user, account };
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Email đã được sử dụng');
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<{ user: User; tokens: TokenPair }> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: dto.email })
      .getOne();

    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (user.status === UserStatus.LOCKED) {
      throw new UnauthorizedException('Tài khoản đã bị khoá');
    }

    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  async refresh(rawRefreshToken: string): Promise<TokenPair> {
    const tokenHash = this.hashRefreshToken(rawRefreshToken);
    const stored = await this.refreshTokenRepository.findOne({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    stored.revokedAt = new Date();
    await this.refreshTokenRepository.save(stored);

    const user = await this.userRepository.findOneOrFail({ where: { id: stored.userId } });
    return this.issueTokens(user);
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashRefreshToken(rawRefreshToken);
    await this.refreshTokenRepository.update({ tokenHash }, { revokedAt: new Date() });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.refreshTokenRepository.update({ userId }, { revokedAt: new Date() });
  }

  // --- Helpers Methods ---
  private async issueTokens(user: User): Promise<TokenPair> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    // secret/expiresIn access token đã set default trong JwtModule.registerAsync (auth.module.ts)
    const accessToken = await this.jwtService.signAsync(payload);

    const refreshToken = randomBytes(64).toString('hex');
    const expiresInMs = ms(this.jwtConfiguration.refreshExpiresIn);

    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        userId: user.id,
        tokenHash: this.hashRefreshToken(refreshToken),
        expiresAt: new Date(Date.now() + expiresInMs),
      }),
    );

    return { accessToken, refreshToken };
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private generateAccountNumber(): string {
    return `VN${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
}
