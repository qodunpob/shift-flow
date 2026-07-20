import { Module } from '@nestjs/common';
import { ShiftsController } from './shifts.controller';
import { ShiftsService } from './shifts.service';
import { SchedulesModule } from '@/schedules/schedules.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment, Shift } from '@/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shift]),
    TypeOrmModule.forFeature([Assignment]),
    SchedulesModule,
  ],
  controllers: [ShiftsController],
  providers: [ShiftsService],
})
export class ShiftsModule {}
