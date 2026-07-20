import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from '@/entities';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { SchedulesTransitionService } from '@/schedules/schedules-transition.service';
import { SchedulesHelpersService } from '@/schedules/schedules-helpers.service';
import { SchedulesHelpersModule } from '@/schedules/schedules-helpers.module';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule]), SchedulesHelpersModule],
  controllers: [SchedulesController],
  providers: [
    SchedulesService,
    SchedulesTransitionService,
    SchedulesHelpersService,
  ],
})
export class SchedulesModule {}
