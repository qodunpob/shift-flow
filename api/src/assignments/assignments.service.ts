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
  UserRole,
} from '@/entities';
import { DataSource, Repository } from 'typeorm';
import {
  CreateAssignmentDto,
  DeclineAssignmentDto,
} from '@/assignments/assignments.dto';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { ShiftsHelpersService } from '@/shifts/shifts-helpers.service';
import { softDelete } from '@/utils/soft-delete';
import { isScheduleVisibleTo } from '@/schedules/schedule-visibility';
import { isEditable } from '@/schedules/schedule-lifecycle';
import { omit } from 'lodash';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(AssignmentEntity)
    private readonly assignments: Repository<AssignmentEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    private readonly dataSource: DataSource,
    private readonly shiftsHelpers: ShiftsHelpersService,
  ) {}

  async create(
    shiftId: string,
    { employeeId }: CreateAssignmentDto,
    user: AuthenticatedUser,
  ) {
    const shift = await this.shiftsHelpers.findEditable(shiftId, user);
    if (shift.schedule.createdBy !== user.id) {
      throw new ForbiddenException('You can only modify your own schedules.');
    }
    const employee = await this.users.findOneBy({ id: employeeId });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    if (!employee.roles.includes(UserRole.EMPLOYEE)) {
      throw new ForbiddenException('Assignee must have the EMPLOYEE role.');
    }
    const existingAssignment = await this.assignments.findOneBy({
      shiftId: shift.id,
      employeeId: employee.id,
    });
    if (existingAssignment) {
      throw new ConflictException('Assignment already exists');
    }

    return this.dataSource.transaction(async (entityManager) => {
      // Assigning an employee who already proposed to work this shift fulfils
      // that proposal: consume it and record the assignment as ACCEPTED.
      const proposal = await entityManager.findOneBy(AssignmentProposalEntity, {
        shiftId: shift.id,
        employeeId: employee.id,
      });
      if (proposal) {
        await softDelete(
          AssignmentProposalEntity,
          proposal,
          user.id,
        )(entityManager);
      }

      const assignment = entityManager.create(AssignmentEntity, {
        shiftId: shift.id,
        employeeId: employee.id,
        status: proposal ? AssignmentStatus.ACCEPTED : AssignmentStatus.PENDING,
        createdBy: user.id,
        updatedBy: user.id,
      });
      return this.toView(
        await entityManager.save(AssignmentEntity, assignment),
      );
    });
  }

  async remove(id: string, user: AuthenticatedUser) {
    const assignment = await this.findEditable(id, user);
    if (assignment.shift.schedule.createdBy !== user.id) {
      throw new ForbiddenException('You can only modify your own schedules.');
    }
    return this.dataSource.transaction(
      softDelete(AssignmentEntity, assignment, user.id),
    );
  }

  async accept(id: string, user: AuthenticatedUser) {
    const assignment = await this.findEditable(id, user);
    if (assignment.employeeId !== user.id) {
      throw new ForbiddenException('You can only accept your own assignments.');
    }

    Object.assign(assignment, {
      status: AssignmentStatus.ACCEPTED,
      updatedBy: user.id,
    });

    return this.toView(await this.assignments.save(assignment));
  }

  async decline(
    id: string,
    { declineReason }: DeclineAssignmentDto,
    user: AuthenticatedUser,
  ) {
    const assignment = await this.findEditable(id, user);
    if (assignment.employeeId !== user.id) {
      throw new ForbiddenException(
        'You can only decline your own assignments.',
      );
    }

    Object.assign(assignment, {
      status: AssignmentStatus.DECLINED,
      declineReason,
      updatedBy: user.id,
    });

    return this.toView(await this.assignments.save(assignment));
  }

  private async findVisible(id: string, user: AuthenticatedUser) {
    const assignment = await this.assignments.findOne({
      where: { id },
      relations: {
        shift: {
          schedule: true,
        },
      },
    });
    if (!assignment || !isScheduleVisibleTo(assignment.shift.schedule, user)) {
      throw new NotFoundException('Assignment not found.');
    }
    return assignment;
  }

  private async findEditable(id: string, user: AuthenticatedUser) {
    const assignment = await this.findVisible(id, user);
    if (!isEditable(assignment.shift.schedule.status)) {
      throw new ConflictException(
        `A schedule in status ${assignment.shift.schedule.status} cannot be edited.`,
      );
    }
    return assignment;
  }

  private toView(assignment: AssignmentEntity) {
    return omit(assignment, ['shift', 'employee']);
  }
}
