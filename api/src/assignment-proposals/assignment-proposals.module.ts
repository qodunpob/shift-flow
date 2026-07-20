import { Module } from '@nestjs/common';
import { ShiftAssignmentProposalsController } from './assignment-proposals.controller';
import { AssignmentProposalsService } from './assignment-proposals.service';

@Module({
  controllers: [ShiftAssignmentProposalsController],
  providers: [AssignmentProposalsService],
})
export class AssignmentProposalsModule {}
