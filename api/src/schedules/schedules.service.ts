import { Injectable, NotFoundException } from '@nestjs/common';
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
    const schedule = this.schedules.create({
      ...dto,
      startsAt: startOfDay(dto.startsAt),
      endsAt: endOfDay(dto.endsAt),
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

    Object.assign(schedule, {
      ...dto,
      ...(dto.startsAt ? { startsAt: startOfDay(dto.startsAt) } : {}),
      ...(dto.endsAt ? { endsAt: endOfDay(dto.endsAt) } : {}),
      updatedBy: user.id,
    });

    return this.schedules.save(schedule);
  }

  async remove(id: string, user: AuthenticatedUser): Promise<void> {
    const schedule = await this.schedules.findOneBy({ id });
    if (!schedule) {
      throw new NotFoundException('Schedule not found.');
    }

    return this.dataSource.transaction(async (entityManager) => {
      Object.assign(schedule, { updatedBy: user.id });
      await entityManager.save(Schedule, schedule);
      await entityManager.softDelete(Schedule, id);
    });
  }
}
