import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { FindUsersQueryDto } from '@/users/users.dto';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/auth/current-user.decorator';
import type { AuthenticatedUser } from '@/auth/authenticated-request';
import { UserResponseDto } from '@/users/users-response.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOkResponse({ type: [UserResponseDto] })
  findAll(@Query() query: FindUsersQueryDto): Promise<UserResponseDto[]> {
    return this.users.findAll(query);
  }

  @Get('me')
  @ApiOkResponse({ type: UserResponseDto })
  findMe(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserResponseDto | null> {
    return this.users.findOne(user.id);
  }
}
