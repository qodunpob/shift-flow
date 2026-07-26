import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AssignmentEntity,
  AssignmentProposalEntity,
  AssignmentStatus,
  ShiftEntity,
  UserEntity,
  UserRole,
} from '@/entities';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { SchedulesHelpersService } from '@/schedules/schedules-helpers.service';
import { isScheduleVisibleTo } from '@/schedules/schedule-visibility';
import { omit } from 'lodash';

/** A user reduced to the fields safe to expose alongside a shift. */
export interface EmployeeRef {
  id: string;
  firstName: string;
  lastName: string;
}

export interface AssignmentView {
  id: string;
  employeeId: string;
  employee: EmployeeRef;
  status: AssignmentStatus;
  declineReason: string | null;
}

export interface ProposalView {
  id: string;
  employeeId: string;
  employee: EmployeeRef;
  message: string | null;
  createdAt: Date;
}

/**
 * A shift enriched with the roster and proposals a given viewer may see, plus
 * derived headcount figures. This is the read model behind the schedule board;
 * the write paths live in ShiftsService and are unaffected by it.
 */
export type ShiftBoardView = Omit<
  ShiftEntity,
  'schedule' | 'assignments' | 'proposals'
> & {
  filledCount: number;
  spotsRemaining: number;
  assignments: AssignmentView[];
  proposals: ProposalView[];
};

@Injectable()
export class ShiftsBoardService {
  constructor(
    @InjectRepository(ShiftEntity)
    private readonly shifts: Repository<ShiftEntity>,
    private readonly schedulesHelpers: SchedulesHelpersService,
  ) {}

  /** Every shift of a schedule the user may see, enriched for that user. */
  async getScheduleBoard(
    scheduleId: string,
    user: AuthenticatedUser,
  ): Promise<ShiftBoardView[]> {
    const schedule = await this.schedulesHelpers.findVisible(scheduleId, user);

    const shifts = await this.shifts.find({
      where: { scheduleId: schedule.id },
      relations: {
        assignments: { employee: true },
        proposals: { employee: true },
      },
      order: { startsAt: 'ASC' },
    });

    return shifts.map((shift) => this.toBoardView(shift, user));
  }

  /** A single shift, enriched for the user, or 404 if the schedule is hidden. */
  async getShift(id: string, user: AuthenticatedUser): Promise<ShiftBoardView> {
    const shift = await this.shifts.findOne({
      where: { id },
      relations: {
        schedule: true,
        assignments: { employee: true },
        proposals: { employee: true },
      },
    });
    if (!shift || !isScheduleVisibleTo(shift.schedule, user)) {
      throw new NotFoundException('Shift not found.');
    }

    return this.toBoardView(shift, user);
  }

  /**
   * Shapes a loaded shift for one viewer. Everyone who can see the schedule
   * sees the full roster; proposals are private, so managers see all of them
   * while other users see only their own. Headcount figures are derived from
   * the full assignment set so the numbers stay honest regardless of role.
   */
  private toBoardView(
    shift: ShiftEntity,
    user: AuthenticatedUser,
  ): ShiftBoardView {
    const isManager = user.roles.includes(UserRole.MANAGER);

    const assignments = shift.assignments ?? [];
    const proposals = shift.proposals ?? [];

    // A slot is occupied by any assignment that has not been declined.
    const filledCount = assignments.filter(
      (assignment) => assignment.status !== AssignmentStatus.DECLINED,
    ).length;

    return {
      ...omit(shift, ['schedule', 'assignments', 'proposals']),
      filledCount,
      spotsRemaining: Math.max(0, shift.requiredHeadcount - filledCount),
      assignments: assignments.map((assignment) =>
        this.toAssignmentView(assignment),
      ),
      proposals: proposals
        .filter((proposal) => isManager || proposal.employeeId === user.id)
        .map((proposal) => this.toProposalView(proposal)),
    };
  }

  private toAssignmentView(assignment: AssignmentEntity): AssignmentView {
    return {
      id: assignment.id,
      employeeId: assignment.employeeId,
      employee: this.toEmployeeRef(assignment.employee),
      status: assignment.status,
      declineReason: assignment.declineReason,
    };
  }

  private toProposalView(proposal: AssignmentProposalEntity): ProposalView {
    return {
      id: proposal.id,
      employeeId: proposal.employeeId,
      employee: this.toEmployeeRef(proposal.employee),
      message: proposal.message,
      createdAt: proposal.createdAt,
    };
  }

  private toEmployeeRef(employee: UserEntity): EmployeeRef {
    return {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
    };
  }
}
