import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { Roles } from '@/auth/roles.decorator';
import { UserRole } from '@/entities';
import { ShiftsService } from '@/shift/shifts.service';
import { CreateShiftDto, UpdateShiftDto } from '@/shift/shifts.dto';
import type { AuthenticatedUser } from '@/auth/authenticated-request';
import { CurrentUser } from '@/auth/current-user.decorator';

@Controller('schedules/:scheduleId/shifts')
export class ScheduleShiftsController {
  constructor(private readonly shifts: ShiftsService) {}

  @Roles([UserRole.MANAGER])
  @Post()
  create(
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
    @Body() dto: CreateShiftDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.shifts.create(scheduleId, dto, user);
  }

  @Get()
  findAll(
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.shifts.findAll(scheduleId, user);
  }
}

@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shifts: ShiftsService) {}

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.shifts.findOne(id, user);
  }

  @Roles([UserRole.MANAGER])
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateShiftDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.shifts.update(id, dto, user);
  }

  @Roles([UserRole.MANAGER])
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.shifts.remove(id, user);
  }
}
