import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { ScheduleEntity, ShiftEntity } from '@/entities';
import {
  CreateScheduleDto,
  FindSchedulesQueryDto,
  UpdateScheduleDto,
} from '@/schedules/schedules.dto';
import { endOfDayWithTz, startOfDayWithTz } from '@/utils/timezone';
import { paginate, Paginated } from '@/common/pagination/paginate';
import { applyScheduleVisibility } from '@/schedules/schedule-visibility';
import { SchedulesHelpersService } from '@/schedules/schedules-helpers.service';
import {
  ScheduleStatsService,
  ScheduleView,
} from '@/schedules/schedule-stats.service';
import { softDelete } from '@/utils/soft-delete';
import { UnavailableDatesDto } from '@/schedules/schedules-response.dto';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(ScheduleEntity)
    private readonly schedules: Repository<ScheduleEntity>,
    @InjectRepository(ShiftEntity)
    private readonly shifts: Repository<ShiftEntity>,
    private readonly dataSource: DataSource,
    private readonly helpers: SchedulesHelpersService,
    private readonly stats: ScheduleStatsService,
  ) {}

  async create(
    dto: CreateScheduleDto,
    user: AuthenticatedUser,
  ): Promise<ScheduleEntity> {
    const { timeZone, ...rest } = dto;
    const startsAt = startOfDayWithTz(dto.startsAt, timeZone);
    const endsAt = endOfDayWithTz(dto.endsAt, timeZone);

    await this.assertNoOverlap(startsAt, endsAt);

    const schedule = this.schedules.create({
      ...rest,
      startsAt,
      endsAt,
      createdBy: user.id,
      updatedBy: user.id,
    });

    return this.schedules.save(schedule);
  }

  async findAll(
    filter: FindSchedulesQueryDto,
    user: AuthenticatedUser,
  ): Promise<Paginated<ScheduleView>> {
    const query = this.schedules
      .createQueryBuilder('schedule')
      .orderBy('schedule.startsAt', 'ASC');

    applyScheduleVisibility(query, user);

    if (filter.status) {
      query.andWhere('schedule.status = :status', { status: filter.status });
    }

    if (filter.mine) {
      query.andWhere('schedule.createdBy = :ownerId', { ownerId: user.id });
    }

    const page = await paginate(query, filter);
    const stats = await this.stats.statsFor(page.items.map((s) => s.id));

    return {
      ...page,
      items: page.items.map((schedule) =>
        this.stats.withStats(schedule, stats),
      ),
    };
  }

  async findOne(id: string, user: AuthenticatedUser): Promise<ScheduleView> {
    const schedule = await this.helpers.findVisible(id, user);
    const stats = await this.stats.statsFor([schedule.id]);
    return this.stats.withStats(schedule, stats);
  }

  async update(
    id: string,
    dto: UpdateScheduleDto,
    user: AuthenticatedUser,
  ): Promise<ScheduleEntity> {
    const schedule = await this.helpers.findEditable(id, user);
    if (schedule.createdBy !== user.id) {
      throw new ForbiddenException('You can only modify your own schedules.');
    }

    // dto.timeZone is guaranteed defined here whenever dto.startsAt/endsAt is,
    // enforced by RequireTimeZone on UpdateScheduleDto.
    const { timeZone, ...rest } = dto;
    const startsAt = dto.startsAt
      ? startOfDayWithTz(dto.startsAt, timeZone!)
      : schedule.startsAt;
    const endsAt = dto.endsAt
      ? endOfDayWithTz(dto.endsAt, timeZone!)
      : schedule.endsAt;

    await this.assertNoOverlap(startsAt, endsAt, id);
    await this.assertContainsExistingShifts(id, startsAt, endsAt);

    Object.assign(schedule, {
      ...rest,
      startsAt,
      endsAt,
      updatedBy: user.id,
    });

    return this.schedules.save(schedule);
  }

  async remove(id: string, user: AuthenticatedUser): Promise<void> {
    const schedule = await this.helpers.findEditable(id, user);
    if (schedule.createdBy !== user.id) {
      throw new ForbiddenException('You can only delete your own schedules.');
    }
    return this.dataSource.transaction(
      softDelete(ScheduleEntity, schedule, user.id),
    );
  }

  async findUnavailableDates(): Promise<UnavailableDatesDto[]> {
    return this.schedules.find({ select: { startsAt: true, endsAt: true } });
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

  /**
   * Ensures every non-deleted shift belonging to this schedule still falls
   * within the schedule's new [startsAt, endsAt] boundaries.
   */
  private async assertContainsExistingShifts(
    scheduleId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<void> {
    const query = this.shifts
      .createQueryBuilder('shift')
      .where('shift.scheduleId = :scheduleId', { scheduleId })
      .andWhere('(shift.startsAt < :startsAt OR shift.endsAt > :endsAt)', {
        startsAt,
        endsAt,
      });

    if (await query.getExists()) {
      throw new ConflictException(
        'The new schedule boundaries no longer contain all of its shifts.',
      );
    }
  }
}
