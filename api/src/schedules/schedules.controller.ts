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
import { SchedulesTransitionService } from '@/schedules/schedules-transition.service';

@Controller('schedules')
export class SchedulesController {
  constructor(
    private readonly schedules: SchedulesService,
    private readonly transitions: SchedulesTransitionService,
  ) {}

  @Roles([UserRole.MANAGER])
  @Post()
  create(
    @Body() dto: CreateScheduleDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Schedule> {
    return this.schedules.create(dto, user);
  }

  @Get()
  findAll(
    @Query() query: FindSchedulesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Paginated<Schedule>> {
    return this.schedules.findAll(query, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Schedule> {
    return this.schedules.findOne(id);
  }

  @Roles([UserRole.MANAGER])
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateScheduleDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Schedule> {
    return this.schedules.update(id, dto, user);
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
    return this.transitions.publish(id, user);
  }

  @Roles([UserRole.MANAGER])
  @Post(':id/submit-for-approval')
  @HttpCode(HttpStatus.OK)
  submitForApproval(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Schedule> {
    return this.transitions.submitForApproval(id, user);
  }

  @Roles([UserRole.MANAGER])
  @Post(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  unpublish(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Schedule> {
    return this.transitions.unpublish(id, user);
  }

  @Roles([UserRole.MANAGER])
  @Post(':id/withdraw')
  @HttpCode(HttpStatus.OK)
  withdraw(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Schedule> {
    return this.transitions.withdraw(id, user);
  }

  @Roles([UserRole.APPROVER])
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Schedule> {
    return this.transitions.approve(id, user);
  }

  @Roles([UserRole.APPROVER])
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RejectScheduleDto,
  ): Promise<Schedule> {
    return this.transitions.reject(id, user, dto);
  }
}
