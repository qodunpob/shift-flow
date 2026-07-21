import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AssignmentEntity,
  AssignmentProposalEntity,
  AssignmentStatus,
  UserEntity,
} from '@/entities';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ShiftsHelpersService } from '@/shifts/shifts-helpers.service';
import {
  CreateAssignmentProposalDto,
  UpdateAssignmentProposalDto,
} from '@/assignment-proposals/assignment-proposal.dto';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { isScheduleVisibleTo } from '@/schedules/schedule-visibility';
import { isEditable } from '@/schedules/schedule-lifecycle';
import { softDelete } from '@/utils/soft-delete';

@Injectable()
export class AssignmentProposalsService {
  constructor(
    @InjectRepository(AssignmentProposalEntity)
    private readonly assignmentProposals: Repository<AssignmentProposalEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(AssignmentEntity)
    private readonly assignments: Repository<AssignmentEntity>,
    private readonly dataSource: DataSource,
    private readonly shiftsHelpers: ShiftsHelpersService,
  ) {}

  async create(
    shiftId: string,
    { message }: CreateAssignmentProposalDto,
    user: AuthenticatedUser,
  ) {
    const shift = await this.shiftsHelpers.findEditable(shiftId, user);
    const existingAssignment = await this.assignments.findOneBy({
      shiftId: shift.id,
      employeeId: user.id,
    });
    if (existingAssignment) {
      throw new ConflictException('Assignment already exists');
    }
    const existingProposal = await this.assignmentProposals.findOneBy({
      shiftId: shift.id,
      employeeId: user.id,
    });
    if (existingProposal) {
      throw new ConflictException('Proposal already exists.');
    }

    const proposal = this.assignmentProposals.create({
      message,
      shift,
      employeeId: user.id,
      createdBy: user.id,
      updatedBy: user.id,
    });

    return await this.assignmentProposals.save(proposal);
  }

  async update(
    id: string,
    { message }: UpdateAssignmentProposalDto,
    user: AuthenticatedUser,
  ) {
    const proposal = await this.findEditable(id, user);
    if (proposal.employeeId !== user.id) {
      throw new ForbiddenException('You can only modify your own proposals.');
    }
    Object.assign(proposal, { message, updatedBy: user.id });
    return await this.assignmentProposals.save(proposal);
  }

  async remove(id: string, user: AuthenticatedUser) {
    const proposal = await this.findEditable(id, user);
    if (proposal.employeeId !== user.id) {
      throw new ForbiddenException('You can only delete your own proposals.');
    }
    return this.dataSource.transaction(
      softDelete(AssignmentProposalEntity, proposal, user.id),
    );
  }

  async accept(id: string, user: AuthenticatedUser) {
    const proposal = await this.findEditable(id, user);
    if (proposal.shift.schedule.createdBy !== user.id) {
      throw new ForbiddenException('You can only modify your own schedules.');
    }
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      const assignment = entityManager.create(AssignmentEntity, {
        shiftId: proposal.shiftId,
        employeeId: proposal.employeeId,
        status: AssignmentStatus.ACCEPTED,
        createdBy: user.id,
        updatedBy: user.id,
      });
      await entityManager.save(AssignmentEntity, assignment);
      await softDelete(
        AssignmentProposalEntity,
        proposal,
        user.id,
      )(entityManager);
    });
  }

  async decline(id: string, user: AuthenticatedUser) {
    const proposal = await this.findEditable(id, user);
    if (proposal.shift.schedule.createdBy !== user.id) {
      throw new ForbiddenException('You can only modify your own schedules.');
    }
    return this.dataSource.transaction(
      softDelete(AssignmentProposalEntity, proposal, user.id),
    );
  }

  private async findVisible(id: string, user: AuthenticatedUser) {
    const proposal = await this.assignmentProposals.findOne({
      where: { id },
      relations: {
        shift: {
          schedule: true,
        },
      },
    });
    if (!proposal || !isScheduleVisibleTo(proposal.shift.schedule, user)) {
      throw new NotFoundException('Assignment proposal not found.');
    }
    return proposal;
  }

  private async findEditable(id: string, user: AuthenticatedUser) {
    const proposal = await this.findVisible(id, user);
    if (!isEditable(proposal.shift.schedule.status)) {
      throw new ConflictException(
        `A schedule in status ${proposal.shift.schedule.status} cannot be edited.`,
      );
    }
    return proposal;
  }
}
