import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from '@/entities';
import { SchedulesHelpersService } from '@/schedules/schedules-helpers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule])],
  providers: [SchedulesHelpersService],
  exports: [SchedulesHelpersService],
})
export class SchedulesHelpersModule {}
