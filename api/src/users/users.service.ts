import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/entities';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  /**
   * Looks up a user by email address. The password column is `select: false`,
   * so it is explicitly added here for authentication.
   */
  findOne(emailAddress: string) {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.emailAddress = :emailAddress', { emailAddress })
      .getOne();
  }
}
