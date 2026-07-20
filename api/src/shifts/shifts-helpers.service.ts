import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ShiftEntity } from '@/entities';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { isEditable } from '@/schedules/schedule-lifecycle';
import { isScheduleVisibleTo } from '@/schedules/schedule-visibility';

@Injectable()
export class ShiftsHelpersService {
  constructor(
    @InjectRepository(ShiftEntity)
    private readonly shifts: Repository<ShiftEntity>,
  ) {}

  async findVisible(id: string, user: AuthenticatedUser) {
    const shift = await this.shifts.findOne({
      where: { id },
      relations: { schedule: true },
    });
    if (!shift || !isScheduleVisibleTo(shift.schedule, user)) {
      throw new NotFoundException('Shift not found.');
    }
    return shift;
  }

  async findEditable(id: string, user: AuthenticatedUser) {
    const shift = await this.findVisible(id, user);
    if (!isEditable(shift.schedule.status)) {
      throw new ConflictException(
        `A schedule in status ${shift.schedule.status} cannot be edited.`,
      );
    }
    return shift;
  }
}
