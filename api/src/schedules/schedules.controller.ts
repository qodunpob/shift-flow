import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '@/auth/current-user.decorator';
import { Schedule, UserRole } from '@/entities';
import type { AuthenticatedUser } from '@/auth/authenticated-request';
import { SchedulesService } from './schedules.service';
import { Roles } from '@/auth/roles.decorator';
import {
  CreateScheduleDto,
  FindSchedulesQueryDto,
  RejectScheduleDto,
  UpdateScheduleDto,
} from '@/schedules/schedules.dto';
import { Paginated } from '@/common/pagination/paginate';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedules: SchedulesService) {}

  @Roles([UserRole.MANAGER])
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateScheduleDto,
  ): Promise<Schedule> {
    return this.schedules.create(user, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FindSchedulesQueryDto,
  ): Promise<Paginated<Schedule>> {
    return this.schedules.findAll(user, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Schedule> {
    return this.schedules.findOne(id);
  }

  @Roles([UserRole.MANAGER])
  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateScheduleDto,
  ): Promise<Schedule> {
    return this.schedules.update(id, user, dto);
  }

  @Roles([UserRole.MANAGER])
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.schedules.remove(id, user);
  }

  @Roles([UserRole.MANAGER])
  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  publish(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Schedule> {
    return this.schedules.publish(id, user);
  }

  @Roles([UserRole.MANAGER])
  @Post(':id/submit-for-approval')
  @HttpCode(HttpStatus.OK)
  submitForApproval(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Schedule> {
    return this.schedules.submitForApproval(id, user);
  }

  @Roles([UserRole.MANAGER])
  @Post(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  unpublish(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Schedule> {
    return this.schedules.unpublish(id, user);
  }

  @Roles([UserRole.MANAGER])
  @Post(':id/withdraw')
  @HttpCode(HttpStatus.OK)
  withdraw(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Schedule> {
    return this.schedules.withdraw(id, user);
  }

  @Roles([UserRole.APPROVER])
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Schedule> {
    return this.schedules.approve(id, user);
  }

  @Roles([UserRole.APPROVER])
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RejectScheduleDto,
  ): Promise<Schedule> {
    return this.schedules.reject(id, user, dto);
  }
}
