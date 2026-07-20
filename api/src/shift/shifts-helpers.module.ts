import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shift } from '@/entities';
import { ShiftsHelpersService } from '@/shift/shifts-helpers.service';
import { SchedulesHelpersModule } from '@/schedules/schedules-helpers.module';

@Module({
  imports: [TypeOrmModule.forFeature([Shift]), SchedulesHelpersModule],
  providers: [ShiftsHelpersService],
  exports: [ShiftsHelpersService],
})
export class ShiftsHelpersModule {}
