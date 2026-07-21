import { Module } from '@nestjs/common';
import {
  ScheduleShiftsController,
  ShiftsController,
} from './shifts.controller';
import { ShiftsService } from './shifts.service';
import { ShiftsBoardService } from './shifts-board.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentEntity, ShiftEntity } from '@/entities';
import { ShiftsHelpersService } from '@/shifts/shifts-helpers.service';
import { SchedulesHelpersModule } from '@/schedules/schedules-helpers.module';
import { ShiftsHelpersModule } from '@/shifts/shifts-helpers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShiftEntity]),
    TypeOrmModule.forFeature([AssignmentEntity]),
    SchedulesHelpersModule,
    ShiftsHelpersModule,
  ],
  controllers: [ScheduleShiftsController, ShiftsController],
  providers: [ShiftsService, ShiftsBoardService, ShiftsHelpersService],
})
export class ShiftsModule {}
