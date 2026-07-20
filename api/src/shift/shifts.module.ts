import { Module } from '@nestjs/common';
import {
  ScheduleShiftsController,
  ShiftsController,
} from './shifts.controller';
import { ShiftsService } from './shifts.service';
import { ShiftsBoardService } from './shifts-board.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment, Shift } from '@/entities';
import { ShiftsHelpersService } from '@/shift/shifts-helpers.service';
import { SchedulesHelpersModule } from '@/schedules/schedules-helpers.module';
import { ShiftsHelpersModule } from '@/shift/shifts-helpers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shift]),
    TypeOrmModule.forFeature([Assignment]),
    SchedulesHelpersModule,
    ShiftsHelpersModule,
  ],
  controllers: [ScheduleShiftsController, ShiftsController],
  providers: [ShiftsService, ShiftsBoardService, ShiftsHelpersService],
})
export class ShiftsModule {}
