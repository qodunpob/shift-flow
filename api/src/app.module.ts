import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configModule from '@/config/config.module';
import dbModule from '@/db.module';
import { SchedulesModule } from '@/schedules/schedules.module';
import { AuthModule } from '@/auth/auth.module';
import { UsersModule } from './users/users.module';
import { ShiftsModule } from './shift/shifts.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { AssignmentProposalsModule } from './assignment-proposals/assignment-proposals.module';

@Module({
  imports: [
    configModule,
    dbModule,
    AuthModule,
    SchedulesModule,
    UsersModule,
    ShiftsModule,
    AssignmentsModule,
    AssignmentProposalsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
