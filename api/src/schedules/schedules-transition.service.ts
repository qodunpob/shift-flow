import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AssignmentStatus, Schedule, Shift, UserRole } from '@/entities';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import {
  getTransition,
  ScheduleAction,
  ScheduleActor,
} from '@/schedules/schedule-lifecycle';
import { RejectScheduleDto } from '@/schedules/schedules.dto';

@Injectable()
export class SchedulesTransitionService {
  constructor(
    @InjectRepository(Schedule)
    private readonly schedules: Repository<Schedule>,
    @InjectRepository(Shift)
    private readonly shifts: Repository<Shift>,
  ) {}

  publish(id: string, user: AuthenticatedUser): Promise<Schedule> {
    return this.applyTransition(id, user, ScheduleAction.Publish);
  }

  submitForApproval(id: string, user: AuthenticatedUser): Promise<Schedule> {
    return this.applyTransition(id, user, ScheduleAction.SubmitForApproval, {
      guard: (schedule) => this.assertNoUnfilledShifts(schedule),
    });
  }

  unpublish(id: string, user: AuthenticatedUser): Promise<Schedule> {
    return this.applyTransition(id, user, ScheduleAction.Unpublish);
  }

  approve(id: string, user: AuthenticatedUser): Promise<Schedule> {
    return this.applyTransition(id, user, ScheduleAction.Approve);
  }

  reject(
    id: string,
    dto: RejectScheduleDto,
    user: AuthenticatedUser,
  ): Promise<Schedule> {
    return this.applyTransition(id, user, ScheduleAction.Reject, {
      mutate: (schedule) => {
        schedule.rejectionReason = dto.rejectionReason;
      },
    });
  }

  withdraw(id: string, user: AuthenticatedUser): Promise<Schedule> {
    return this.applyTransition(id, user, ScheduleAction.Withdraw);
  }

  /**
   * Loads a schedule, validates the requested lifecycle action against the
   * state machine, enforces the actor allowed to perform it, runs any
   * action-specific precondition `guard`, applies the new status, and
   * persists. `mutate` sets any action-specific fields (e.g. the rejection
   * reason) before saving.
   */
  private async applyTransition(
    id: string,
    user: AuthenticatedUser,
    action: ScheduleAction,
    options: {
      guard?: (schedule: Schedule) => Promise<void>;
      mutate?: (schedule: Schedule) => void;
    } = {},
  ): Promise<Schedule> {
    const schedule = await this.schedules.findOneBy({ id });
    if (!schedule) {
      throw new NotFoundException('Schedule not found.');
    }

    const transition = getTransition(schedule.status, action);
    if (!transition) {
      throw new ConflictException(
        `Cannot ${action} a schedule in status ${schedule.status}.`,
      );
    }

    this.assertActor(transition.actor, user, schedule);

    await options.guard?.(schedule);

    schedule.status = transition.to;
    schedule.updatedBy = user.id;
    // Clear any stale rejection reason; `mutate` re-sets it for a reject.
    schedule.rejectionReason = null;
    options.mutate?.(schedule);

    return this.schedules.save(schedule);
  }

  /**
   * Blocks submission while any shift is understaffed. A slot counts as
   * filled by any assignment that has not been declined (matching the board's
   * `filledCount`), so a shift is unfilled when its non-declined assignment
   * count is below its `requiredHeadcount`.
   */
  private async assertNoUnfilledShifts(schedule: Schedule): Promise<void> {
    const hasUnfilledShift = await this.shifts
      .createQueryBuilder('shift')
      .leftJoin(
        'shift.assignments',
        'assignment',
        'assignment.status != :declined',
        { declined: AssignmentStatus.DECLINED },
      )
      .where('shift.scheduleId = :scheduleId', { scheduleId: schedule.id })
      .groupBy('shift.id')
      .having('COUNT(assignment.id) < shift.requiredHeadcount')
      .getExists();

    if (hasUnfilledShift) {
      throw new ConflictException(
        'Cannot submit for approval while the schedule has unfilled shifts.',
      );
    }
  }

  /** Enforces that `user` is allowed to act as `actor` on `schedule`. */
  private assertActor(
    actor: ScheduleActor,
    user: AuthenticatedUser,
    schedule: Schedule,
  ): void {
    if (actor === ScheduleActor.OwnerManager) {
      const isOwnerManager =
        user.roles.includes(UserRole.MANAGER) && schedule.createdBy === user.id;
      if (!isOwnerManager) {
        throw new ForbiddenException(
          'Only the owning manager can perform this action.',
        );
      }
      return;
    }

    if (actor === ScheduleActor.Approver) {
      if (!user.roles.includes(UserRole.APPROVER)) {
        throw new ForbiddenException(
          'Only an approver can perform this action.',
        );
      }
    }
  }
}
