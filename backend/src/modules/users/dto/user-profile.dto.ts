import { User, UserRole, UserStatus } from '@modules/users/entities/user.entity';

export class UserProfileDto {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;

  private constructor(user: User) {
    this.id = user.id;
    this.fullName = user.fullName;
    this.email = user.email;
    this.role = user.role;
    this.status = user.status;
    this.createdAt = user.createdAt;
  }

  static fromEntity(user: User): UserProfileDto {
    return new UserProfileDto(user);
  }
}
