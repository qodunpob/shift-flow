import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ScheduleEntity } from '@/entities';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { isScheduleVisibleTo } from '@/schedules/schedule-visibility';
import { isEditable } from '@/schedules/schedule-lifecycle';

@Injectable()
export class SchedulesHelpersService {
  constructor(
    @InjectRepository(ScheduleEntity)
    private readonly schedules: Repository<ScheduleEntity>,
  ) {}

  async findVisible(
    id: string,
    user: AuthenticatedUser,
  ): Promise<ScheduleEntity> {
    const schedule = await this.schedules.findOneBy({ id });
    if (!schedule || !isScheduleVisibleTo(schedule, user)) {
      throw new NotFoundException('Schedule not found.');
    }

    return schedule;
  }

  async findEditable(
    id: string,
    user: AuthenticatedUser,
  ): Promise<ScheduleEntity> {
    const schedule = await this.findVisible(id, user);
    if (!isEditable(schedule.status)) {
      throw new ConflictException(
        `A schedule in status ${schedule.status} cannot be edited.`,
      );
    }

    return schedule;
  }
}
