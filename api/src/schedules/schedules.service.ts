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
  UpdateScheduleDto,
} from '@/schedules/schedules.dto';
import { endOfDay, startOfDay } from 'date-fns';

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

  async findAll(user: AuthenticatedUser): Promise<Schedule[]> {
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

    return query.getMany();
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

    return this.dataSource.transaction(async (entityManager) => {
      Object.assign(schedule, { updatedBy: user.id });
      await entityManager.save(Schedule, schedule);
      await entityManager.softDelete(Schedule, id);
    });
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
