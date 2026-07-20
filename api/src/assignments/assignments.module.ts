import { Module } from '@nestjs/common';
import {
  AssignmentsController,
  ShiftAssignmentsController,
} from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentEntity, UserEntity } from '@/entities';
import { ShiftsHelpersModule } from '@/shifts/shifts-helpers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssignmentEntity]),
    TypeOrmModule.forFeature([UserEntity]),
    ShiftsHelpersModule,
  ],
  controllers: [ShiftAssignmentsController, AssignmentsController],
  providers: [AssignmentsService],
})
export class AssignmentsModule {}
