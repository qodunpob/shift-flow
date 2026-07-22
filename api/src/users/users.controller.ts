import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { FindUsersQueryDto } from '@/users/users.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/auth/current-user.decorator';
import type { AuthenticatedUser } from '@/auth/authenticated-request';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  findAll(@Query() query: FindUsersQueryDto) {
    return this.users.findAll(query);
  }

  @Get('me')
  findMe(@CurrentUser() user: AuthenticatedUser) {
    return this.users.findOne(user.id);
  }
}
