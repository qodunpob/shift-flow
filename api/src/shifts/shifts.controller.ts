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
import { ShiftsService } from '@/shifts/shifts.service';
import { ShiftsBoardService } from '@/shifts/shifts-board.service';
import { CreateShiftDto, UpdateShiftDto } from '@/shifts/shifts.dto';
import type { AuthenticatedUser } from '@/auth/authenticated-request';
import { CurrentUser } from '@/auth/current-user.decorator';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ShiftBoardViewDto } from '@/shifts/shift-response.dto';

@ApiTags('shifts')
@ApiBearerAuth()
@Controller('schedules/:scheduleId/shifts')
export class ScheduleShiftsController {
  constructor(
    private readonly shifts: ShiftsService,
    private readonly board: ShiftsBoardService,
  ) {}

  @Roles([UserRole.MANAGER])
  @Post()
  async create(
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
    @Body() dto: CreateShiftDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const shift = await this.shifts.create(scheduleId, dto, user);
    return this.board.getShift(shift.id, user);
  }

  @Get()
  @ApiOkResponse({ type: ShiftBoardViewDto })
  findAll(
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.board.getScheduleBoard(scheduleId, user);
  }
}

@ApiTags('shifts')
@ApiBearerAuth()
@Controller('shifts/:id')
export class ShiftsController {
  constructor(
    private readonly shifts: ShiftsService,
    private readonly board: ShiftsBoardService,
  ) {}

  @Get()
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.board.getShift(id, user);
  }

  @Roles([UserRole.MANAGER])
  @Put()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShiftDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.shifts.update(id, dto, user);
    return this.board.getShift(id, user);
  }

  @Roles([UserRole.MANAGER])
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.shifts.remove(id, user);
  }
}
