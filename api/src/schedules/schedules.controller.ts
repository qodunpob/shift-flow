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
} from '@nestjs/common';
import { CurrentUser } from '@/auth/current-user.decorator';
import { Schedule, UserRole } from '@/entities';
import type { AuthenticatedUser } from '@/auth/authenticated-request';
import { SchedulesService } from './schedules.service';
import { Roles } from '@/auth/roles.decorator';
import {
  CreateScheduleDto,
  UpdateScheduleDto,
} from '@/schedules/schedules.dto';

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
  findAll(@CurrentUser() user: AuthenticatedUser): Promise<Schedule[]> {
    return this.schedules.findAll(user);
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
}
