import { Module } from '@nestjs/common';
import {
  ScheduleShiftsController,
  ShiftsController,
} from './shifts.controller';
import { ShiftsService } from './shifts.service';

@Module({
  controllers: [ScheduleShiftsController, ShiftsController],
  providers: [ShiftsService],
})
export class ShiftsModule {}
