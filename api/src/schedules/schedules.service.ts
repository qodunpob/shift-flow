import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { Schedule, ScheduleStatus, UserRole } from '@/entities';
import {
  CreateScheduleDto,
  RejectScheduleDto,
  UpdateScheduleDto,
} from '@/schedules/schedules.dto';
import { endOfDay, startOfDay } from 'date-fns';
import { PaginationQueryDto } from '@/common/pagination/pagination-query.dto';
import { paginate, Paginated } from '@/common/pagination/paginate';
import {
  getTransition,
  isDeletable,
  isEditable,
  ScheduleAction,
  ScheduleActor,
} from '@/schedules/schedule-lifecycle';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private readonly schedules: Repository<Schedule>,
    private dataSource: DataSource,
  ) {}

  async create(
    user: AuthenticatedUser,
    dto: CreateScheduleDto,
  ): Promise<Schedule> {
    const startsAt = startOfDay(dto.startsAt);
    const endsAt = endOfDay(dto.endsAt);

    await this.assertNoOverlap(startsAt, endsAt);

    const schedule = this.schedules.create({
      ...dto,
      startsAt,
      endsAt,
      createdBy: user.id,
      updatedBy: user.id,
    });

    return this.schedules.save(schedule);
  }

  async findAll(
    user: AuthenticatedUser,
    pagination: PaginationQueryDto,
  ): Promise<Paginated<Schedule>> {
    const query = this.schedules
      .createQueryBuilder('schedule')
      .orderBy('schedule.startsAt', 'ASC');

    if (user.roles.includes(UserRole.MANAGER)) {
      query.where(
        'schedule.status != :draftStatus OR schedule.createdBy = :userId',
        { draftStatus: ScheduleStatus.DRAFT, userId: user.id },
      );
    } else {
      query.where('schedule.status != :draftStatus', {
        draftStatus: ScheduleStatus.DRAFT,
      });
    }

    return paginate(query, pagination);
  }

  async findOne(id: string): Promise<Schedule> {
    const schedule = await this.schedules.findOneBy({ id });
    if (!schedule) {
      throw new NotFoundException('Schedule not found.');
    }

    return schedule;
  }

  async update(
    id: string,
    user: AuthenticatedUser,
    dto: UpdateScheduleDto,
  ): Promise<Schedule> {
    const schedule = await this.schedules.findOneBy({ id });
    if (!schedule) {
      throw new NotFoundException('Schedule not found.');
    }
    if (schedule.createdBy !== user.id) {
      throw new ForbiddenException('You can only modify your own schedules.');
    }
    if (!isEditable(schedule.status)) {
      throw new ConflictException(
        `A schedule in status ${schedule.status} cannot be edited.`,
      );
    }

    const startsAt = dto.startsAt
      ? startOfDay(dto.startsAt)
      : schedule.startsAt;
    const endsAt = dto.endsAt ? endOfDay(dto.endsAt) : schedule.endsAt;

    await this.assertNoOverlap(startsAt, endsAt, id);

    Object.assign(schedule, {
      ...dto,
      startsAt,
      endsAt,
      updatedBy: user.id,
    });

    return this.schedules.save(schedule);
  }

  async remove(id: string, user: AuthenticatedUser): Promise<void> {
    const schedule = await this.schedules.findOneBy({ id });
    if (!schedule) {
      throw new NotFoundException('Schedule not found.');
    }
    if (schedule.createdBy !== user.id) {
      throw new ForbiddenException('You can only delete your own schedules.');
    }
    if (!isDeletable(schedule.status)) {
      throw new ConflictException(
        `A schedule in status ${schedule.status} cannot be deleted.`,
      );
    }

    return this.dataSource.transaction(async (entityManager) => {
      Object.assign(schedule, { updatedBy: user.id });
      await entityManager.save(Schedule, schedule);
      await entityManager.softDelete(Schedule, id);
    });
  }

  publish(id: string, user: AuthenticatedUser): Promise<Schedule> {
    return this.applyTransition(id, user, ScheduleAction.Publish);
  }

  submitForApproval(id: string, user: AuthenticatedUser): Promise<Schedule> {
    return this.applyTransition(id, user, ScheduleAction.SubmitForApproval);
  }

  unpublish(id: string, user: AuthenticatedUser): Promise<Schedule> {
    return this.applyTransition(id, user, ScheduleAction.Unpublish);
  }

  approve(id: string, user: AuthenticatedUser): Promise<Schedule> {
    return this.applyTransition(id, user, ScheduleAction.Approve);
  }

  reject(
    id: string,
    user: AuthenticatedUser,
    dto: RejectScheduleDto,
  ): Promise<Schedule> {
    return this.applyTransition(id, user, ScheduleAction.Reject, (schedule) => {
      schedule.rejectionReason = dto.rejectionReason;
    });
  }

  withdraw(id: string, user: AuthenticatedUser): Promise<Schedule> {
    return this.applyTransition(id, user, ScheduleAction.Withdraw);
  }

  /**
   * Loads a schedule, validates the requested lifecycle action against the
   * state machine, enforces the actor allowed to perform it, applies the new
   * status, and persists. `mutate` sets any action-specific fields (e.g. the
   * rejection reason) before saving.
   */
  private async applyTransition(
    id: string,
    user: AuthenticatedUser,
    action: ScheduleAction,
    mutate?: (schedule: Schedule) => void,
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

    schedule.status = transition.to;
    schedule.updatedBy = user.id;
    // Clear any stale rejection reason; `mutate` re-sets it for a reject.
    schedule.rejectionReason = null;
    mutate?.(schedule);

    return this.schedules.save(schedule);
  }

  /** Enforces that `user` is allowed to act as `actor` on `schedule`. */
  private assertActor(
    actor: ScheduleActor,
    user: AuthenticatedUser,
    schedule: Schedule,
  ): void {
    if (actor === ScheduleActor.OwnerManager) {
      const isOwnerManager =
        user.roles.includes(UserRole.MANAGER) &&
        schedule.createdBy === user.id;
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

  /**
   * Ensures the [startsAt, endsAt] range does not overlap any existing (non
   * soft-deleted) schedule. Two ranges overlap when each starts on or before
   * the other ends. On update, pass `excludeId` so the schedule being changed
   * is not compared against itself.
   */
  private async assertNoOverlap(
    startsAt: Date,
    endsAt: Date,
    excludeId?: string,
  ): Promise<void> {
    const query = this.schedules
      .createQueryBuilder('schedule')
      .where('schedule.startsAt <= :endsAt', { endsAt })
      .andWhere('schedule.endsAt >= :startsAt', { startsAt });

    if (excludeId) {
      query.andWhere('schedule.id != :excludeId', { excludeId });
    }

    if (await query.getExists()) {
      throw new ConflictException(
        'Schedule overlaps with an existing schedule.',
      );
    }
  }
}
