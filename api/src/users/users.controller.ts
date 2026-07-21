import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { FindUsersQueryDto } from '@/users/users.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  findAll(@Query() query: FindUsersQueryDto) {
    return this.users.findAll(query);
  }
}
