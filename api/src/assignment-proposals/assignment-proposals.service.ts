import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Assignment, AssignmentProposal, User } from '@/entities';
import { DataSource, Repository } from 'typeorm';
import { ShiftsHelpersService } from '@/shift/shifts-helpers.service';

@Injectable()
export class AssignmentProposalsService {
  constructor(
    @InjectRepository(AssignmentProposal)
    private readonly assignmentProposals: Repository<AssignmentProposal>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Assignment)
    private readonly assignments: Repository<Assignment>,
    private readonly dataSource: DataSource,
    private readonly shiftsHelpers: ShiftsHelpersService,
  ) {}
}
