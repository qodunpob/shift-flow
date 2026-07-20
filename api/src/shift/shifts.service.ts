import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { CreateShiftDto, UpdateShiftDto } from '@/shift/shifts.dto';
import { SchedulesService } from '@/schedules/schedules.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Assignment, Shift } from '@/entities';
import { DataSource, Repository } from 'typeorm';
import { startOfMinute } from 'date-fns';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(Shift)
    private readonly shifts: Repository<Shift>,
    @InjectRepository(Assignment)
    private readonly assignments: Repository<Assignment>,
    private dataSource: DataSource,
    private readonly schedulesService: SchedulesService,
  ) {}

  async create(
    scheduleId: string,
    dto: CreateShiftDto,
    user: AuthenticatedUser,
  ) {
    const schedule = await this.schedulesService.findEditable(scheduleId, user);
    const startsAt = startOfMinute(dto.startsAt);
    const endsAt = startOfMinute(dto.endsAt);

    await this.assertNoOverlap(startsAt, endsAt);

    const shift = this.shifts.create({
      ...dto,
      startsAt,
      endsAt,
      scheduleId: schedule.id,
      createdBy: user.id,
      updatedBy: user.id,
    });

    return await this.shifts.save(shift);
  }

  async findAll(scheduleId: string, user: AuthenticatedUser) {
    const schedule = await this.schedulesService.findVisible(scheduleId, user);

    return await this.shifts.find({
      where: { scheduleId: schedule.id },
    });
  }

  async findOne(scheduleId: string, id: string, user: AuthenticatedUser) {
    const schedule = await this.schedulesService.findVisible(scheduleId, user);

    return await this.shifts.findOneBy({
      id,
      scheduleId: schedule.id,
    });
  }

  async update(
    scheduleId: string,
    id: string,
    dto: UpdateShiftDto,
    user: AuthenticatedUser,
  ) {
    const schedule = await this.schedulesService.findEditable(scheduleId, user);
    const shift = await this.shifts.findOneBy({
      id,
      scheduleId: schedule.id,
    });
    if (!shift) {
      throw new NotFoundException('Shift not found.');
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

  async remove(scheduleId: string, id: string, user: AuthenticatedUser) {
    const schedule = await this.schedulesService.findEditable(scheduleId, user);
    const shift = await this.shifts.findOneBy({
      id,
      scheduleId: schedule.id,
    });
    if (!shift) {
      throw new NotFoundException('Shift not found.');
    }

    return this.dataSource.transaction(async (entityManager) => {
      Object.assign(shift, { updatedBy: user.id });
      await entityManager.save(Shift, shift);
      await entityManager.softDelete(Shift, id);
    });
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
