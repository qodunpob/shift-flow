import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Assignment, AssignmentStatus, User } from '@/entities';
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
    @InjectRepository(Assignment)
    private readonly assignments: Repository<Assignment>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
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

    const assignment = this.assignments.create({
      shiftId: shift.id,
      employeeId: employee.id,
      createdBy: user.id,
      updatedBy: user.id,
    });
    return this.cleanResult(await this.assignments.save(assignment));
  }

  async remove(id: string, user: AuthenticatedUser) {
    const assignment = await this.findEditable(id, user);
    if (assignment.shift.schedule.createdBy !== user.id) {
      throw new ForbiddenException('You can only modify your own schedules.');
    }
    return this.dataSource.transaction(
      softDelete(Assignment, assignment, user.id),
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

    return this.cleanResult(await this.assignments.save(assignment));
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

    return this.cleanResult(await this.assignments.save(assignment));
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
      throw new NotFoundException('Assignment not found');
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

  private cleanResult(assignment: Assignment) {
    return omit(assignment, ['shift', 'employee']);
  }
}
