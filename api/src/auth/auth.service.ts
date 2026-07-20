import { Injectable } from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { verifyPassword } from '@/utils/password';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findOne(username);
    if (user && (await verifyPassword(password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  login(user: AuthenticatedUser) {
    const payload = { roles: user.roles, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
