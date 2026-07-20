import { Module } from '@nestjs/common';
import {
  AssignmentProposalsController,
  ShiftAssignmentProposalsController,
} from './assignment-proposals.controller';
import { AssignmentProposalsService } from './assignment-proposals.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment, AssignmentProposal, User } from '@/entities';
import { ShiftsHelpersModule } from '@/shifts/shifts-helpers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssignmentProposal]),
    TypeOrmModule.forFeature([Assignment]),
    TypeOrmModule.forFeature([User]),
    ShiftsHelpersModule,
  ],
  controllers: [
    ShiftAssignmentProposalsController,
    AssignmentProposalsController,
  ],
  providers: [AssignmentProposalsService],
})
export class AssignmentProposalsModule {}
