import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShiftEntity } from '@/entities';
import { ShiftsHelpersService } from '@/shifts/shifts-helpers.service';
import { SchedulesHelpersModule } from '@/schedules/schedules-helpers.module';

@Module({
  imports: [TypeOrmModule.forFeature([ShiftEntity]), SchedulesHelpersModule],
  providers: [ShiftsHelpersService],
  exports: [ShiftsHelpersService],
})
export class ShiftsHelpersModule {}
