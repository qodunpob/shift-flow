import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { CreateShiftDto, UpdateShiftDto } from '@/shifts/shifts.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AssignmentEntity, ShiftEntity } from '@/entities';
import { DataSource, Repository } from 'typeorm';
import { startOfMinute } from 'date-fns';
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
    const startsAt = startOfMinute(dto.startsAt);
    const endsAt = startOfMinute(dto.endsAt);

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
      ? startOfMinute(dto.startsAt)
      : shift.startsAt;
    const endsAt = dto.endsAt ? startOfMinute(dto.endsAt) : shift.endsAt;

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
