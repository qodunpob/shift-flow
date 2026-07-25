import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { CreateShiftDto, UpdateShiftDto } from '@/shifts/shifts.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AssignmentEntity, ScheduleEntity, ShiftEntity } from '@/entities';
import { DataSource, Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { SchedulesHelpersService } from '@/schedules/schedules-helpers.service';
import { ShiftsHelpersService } from '@/shifts/shifts-helpers.service';
import { softDelete } from '@/utils/soft-delete';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(ShiftEntity)
    private readonly shifts: Repository<ShiftEntity>,
    @InjectRepository(AssignmentEntity)
    private readonly assignments: Repository<AssignmentEntity>,
    private readonly dataSource: DataSource,
    private readonly schedulesHelpers: SchedulesHelpersService,
    private readonly helpers: ShiftsHelpersService,
  ) {}

  async create(
    scheduleId: string,
    dto: CreateShiftDto,
    user: AuthenticatedUser,
  ) {
    const schedule = await this.schedulesHelpers.findEditable(scheduleId, user);
    if (schedule.createdBy !== user.id) {
      throw new ForbiddenException('You can only modify your own schedules.');
    }
    const startsAt = DateTime.fromJSDate(dto.startsAt)
      .startOf('minute')
      .toUTC()
      .toJSDate();
    const endsAt = DateTime.fromJSDate(dto.endsAt)
      .startOf('minute')
      .toUTC()
      .toJSDate();

    this.assertWithinSchedule(startsAt, endsAt, schedule);
    await this.assertNoOverlap(startsAt, endsAt);

    const shift = this.shifts.create({
      ...dto,
      startsAt,
      endsAt,
      schedule,
      createdBy: user.id,
      updatedBy: user.id,
    });

    return this.shifts.save(shift);
  }

  async update(id: string, dto: UpdateShiftDto, user: AuthenticatedUser) {
    const shift = await this.helpers.findEditable(id, user);
    if (shift.schedule.createdBy !== user.id) {
      throw new ForbiddenException('You can only modify your own schedules.');
    }

    const startsAt = dto.startsAt
      ? DateTime.fromJSDate(dto.startsAt).startOf('minute').toUTC().toJSDate()
      : shift.startsAt;
    const endsAt = dto.endsAt
      ? DateTime.fromJSDate(dto.endsAt).startOf('minute').toUTC().toJSDate()
      : shift.endsAt;

    this.assertWithinSchedule(startsAt, endsAt, shift.schedule);
    await this.assertNoOverlap(startsAt, endsAt, id);

    if (dto.requiredHeadcount) {
      const assignments = await this.assignments.countBy({ shiftId: id });

      if (assignments > dto.requiredHeadcount) {
        throw new ConflictException(
          `Cannot reduce the required number of employees below the number of currently assigned employees: ${assignments}.`,
        );
      }
    }

    Object.assign(shift, {
      ...dto,
      startsAt,
      endsAt,
      updatedBy: user.id,
    });

    return this.shifts.save(shift);
  }

  async remove(id: string, user: AuthenticatedUser) {
    const shift = await this.helpers.findEditable(id, user);
    if (shift.schedule.createdBy !== user.id) {
      throw new ForbiddenException('You can only modify your own schedules.');
    }
    return this.dataSource.transaction(softDelete(ShiftEntity, shift, user.id));
  }

  /**
   * Ensures the shift's [startsAt, endsAt] range falls within its parent
   * schedule's own boundaries.
   */
  private assertWithinSchedule(
    startsAt: Date,
    endsAt: Date,
    schedule: ScheduleEntity,
  ): void {
    if (startsAt < schedule.startsAt || endsAt > schedule.endsAt) {
      throw new ConflictException(
        'Shift must fall within its schedule boundaries.',
      );
    }
  }

  /**
   * Ensures the [startsAt, endsAt] range does not overlap any existing (non
   * soft-deleted) shift. Two ranges overlap when each starts on or before
   * the other ends. On update, pass `excludeId` so the shift being changed
   * is not compared against itself.
   */
  private async assertNoOverlap(
    startsAt: Date,
    endsAt: Date,
    excludeId?: string,
  ): Promise<void> {
    const query = this.shifts
      .createQueryBuilder('shift')
      .where('shift.startsAt <= :endsAt', { endsAt })
      .andWhere('shift.endsAt >= :startsAt', { startsAt });

    if (excludeId) {
      query.andWhere('shift.id != :excludeId', { excludeId });
    }

    if (await query.getExists()) {
      throw new ConflictException('Shift overlaps with an existing shift.');
    }
  }
}
