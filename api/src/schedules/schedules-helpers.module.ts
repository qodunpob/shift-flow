import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleEntity } from '@/entities';
import { SchedulesHelpersService } from '@/schedules/schedules-helpers.service';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduleEntity])],
  providers: [SchedulesHelpersService],
  exports: [SchedulesHelpersService],
})
export class SchedulesHelpersModule {}
