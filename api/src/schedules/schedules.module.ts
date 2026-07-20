import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule, Shift } from '@/entities';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { SchedulesTransitionService } from '@/schedules/schedules-transition.service';
import { SchedulesHelpersService } from '@/schedules/schedules-helpers.service';
import { SchedulesHelpersModule } from '@/schedules/schedules-helpers.module';
import { ScheduleStatsService } from '@/schedules/schedule-stats.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Schedule, Shift]),
    SchedulesHelpersModule,
  ],
  controllers: [SchedulesController],
  providers: [
    SchedulesService,
    SchedulesTransitionService,
    SchedulesHelpersService,
    ScheduleStatsService,
  ],
})
export class SchedulesModule {}
