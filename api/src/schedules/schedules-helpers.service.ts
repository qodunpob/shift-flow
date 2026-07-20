import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Schedule } from '@/entities';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { isScheduleVisibleTo } from '@/schedules/schedule-visibility';
import { isEditable } from '@/schedules/schedule-lifecycle';

@Injectable()
export class SchedulesHelpersService {
  constructor(
    @InjectRepository(Schedule)
    private readonly schedules: Repository<Schedule>,
  ) {}

  async findVisible(id: string, user: AuthenticatedUser): Promise<Schedule> {
    const schedule = await this.schedules.findOneBy({ id });
    if (!schedule || !isScheduleVisibleTo(schedule, user)) {
      throw new NotFoundException('Schedule not found.');
    }

    return schedule;
  }

  async findEditable(id: string, user: AuthenticatedUser): Promise<Schedule> {
    const schedule = await this.findVisible(id, user);
    if (!isEditable(schedule.status)) {
      throw new ConflictException(
        `A schedule in status ${schedule.status} cannot be edited.`,
      );
    }

    return schedule;
  }
}
