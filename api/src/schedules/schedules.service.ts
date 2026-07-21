import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { ScheduleEntity } from '@/entities';
import {
  CreateScheduleDto,
  FindSchedulesQueryDto,
  UpdateScheduleDto,
} from '@/schedules/schedules.dto';
import { endOfDay, startOfDay } from 'date-fns';
import { paginate, Paginated } from '@/common/pagination/paginate';
import { applyScheduleVisibility } from '@/schedules/schedule-visibility';
import { SchedulesHelpersService } from '@/schedules/schedules-helpers.service';
import {
  ScheduleStatsService,
  ScheduleView,
} from '@/schedules/schedule-stats.service';
import { softDelete } from '@/utils/soft-delete';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(ScheduleEntity)
    private readonly schedules: Repository<ScheduleEntity>,
    private readonly dataSource: DataSource,
    private readonly helpers: SchedulesHelpersService,
    private readonly stats: ScheduleStatsService,
  ) {}

  async create(
    dto: CreateScheduleDto,
    user: AuthenticatedUser,
  ): Promise<ScheduleEntity> {
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
    const schedule = await this.helpers.findEditable(id, user);
    if (schedule.createdBy !== user.id) {
      throw new ForbiddenException('You can only delete your own schedules.');
    }
    return this.dataSource.transaction(
      softDelete(ScheduleEntity, schedule, user.id),
    );
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
