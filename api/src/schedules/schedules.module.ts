import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleEntity, ShiftEntity } from '@/entities';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { SchedulesTransitionService } from '@/schedules/schedules-transition.service';
import { SchedulesHelpersService } from '@/schedules/schedules-helpers.service';
import { SchedulesHelpersModule } from '@/schedules/schedules-helpers.module';
import { ScheduleStatsService } from '@/schedules/schedule-stats.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScheduleEntity, ShiftEntity]),
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
