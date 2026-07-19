import { Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { Roles } from '@/auth/roles.decorator';
import { UserRole } from '@/entities';

@Controller('schedules/:scheduleId/shifts')
export class ScheduleShiftsController {
  @Roles([UserRole.MANAGER])
  @Post()
  create() {
    return null;
  }

  @Get()
  findAll() {
    return null;
  }
}

@Controller('shifts')
export class ShiftsController {
  @Get(':id')
  findOne() {
    return null;
  }

  @Roles([UserRole.MANAGER])
  @Put()
  update() {
    return null;
  }

  @Roles([UserRole.MANAGER])
  @Delete()
  remove() {
    return null;
  }
}
