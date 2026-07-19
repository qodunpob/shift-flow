import { Module } from '@nestjs/common';
import { AssignmentProposalsController } from './assignment-proposals.controller';
import { AssignmentProposalsService } from './assignment-proposals.service';

@Module({
  controllers: [AssignmentProposalsController],
  providers: [AssignmentProposalsService]
})
export class AssignmentProposalsModule {}
