import { Module } from '@nestjs/common';
import {
  AssignmentsController,
  ShiftAssignmentsController,
} from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment, User } from '@/entities';
import { ShiftsHelpersModule } from '@/shifts/shifts-helpers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Assignment]),
    TypeOrmModule.forFeature([User]),
    ShiftsHelpersModule,
  ],
  controllers: [ShiftAssignmentsController, AssignmentsController],
  providers: [AssignmentsService],
})
export class AssignmentsModule {}
