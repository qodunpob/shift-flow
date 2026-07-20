import { Module } from '@nestjs/common';
import {
  AssignmentProposalsController,
  ShiftAssignmentProposalsController,
} from './assignment-proposals.controller';
import { AssignmentProposalsService } from './assignment-proposals.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AssignmentEntity,
  AssignmentProposalEntity,
  UserEntity,
} from '@/entities';
import { ShiftsHelpersModule } from '@/shifts/shifts-helpers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssignmentProposalEntity]),
    TypeOrmModule.forFeature([AssignmentEntity]),
    TypeOrmModule.forFeature([UserEntity]),
    ShiftsHelpersModule,
  ],
  controllers: [
    ShiftAssignmentProposalsController,
    AssignmentProposalsController,
  ],
  providers: [AssignmentProposalsService],
})
export class AssignmentProposalsModule {}
