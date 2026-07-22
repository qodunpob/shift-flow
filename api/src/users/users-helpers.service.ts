import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '@/entities';

@Injectable()
export class UsersHelpersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  /**
   * Looks up a user by email address. The password column is `select: false`,
   * so it is explicitly added here for authentication.
   */
  findOneWithPassword(emailAddress: string) {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.emailAddress = :emailAddress', { emailAddress })
      .getOne();
  }
}
