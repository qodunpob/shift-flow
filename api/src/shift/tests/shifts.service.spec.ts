import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { startOfMinute } from 'date-fns';
import { ShiftsService } from '../shifts.service';
import { CreateShiftDto, UpdateShiftDto } from '../shifts.dto';
import { Assignment, Schedule, Shift, UserRole } from '@/entities';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { SchedulesService } from '@/schedules/schedules.service';

describe('shifts/ShiftsService', () => {
  let service: ShiftsService;
  let queryBuilder: {
    where: jest.Mock;
    andWhere: jest.Mock;
    getExists: jest.Mock;
  };
  let shifts: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOneBy: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let assignments: { countBy: jest.Mock };
  let entityManager: { save: jest.Mock; softDelete: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let schedulesService: { findVisible: jest.Mock; findEditable: jest.Mock };

  const manager: AuthenticatedUser = {
    id: 'manager-1',
    roles: [UserRole.MANAGER],
  };
  const scheduleId = 'schedule-1';
  // The parent schedule the service resolves before touching shifts. Only its
  // id matters here; visibility/editability rules are the SchedulesService's
  // job and are mocked so these tests stay focused on shift behaviour.
  const schedule = { id: scheduleId } as Schedule;

  beforeEach(async () => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getExists: jest.fn().mockResolvedValue(false),
    };
    shifts = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      create: jest.fn((entity) => entity),
      save: jest.fn((entity) => Promise.resolve({ id: 'shift-1', ...entity })),
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn(() => queryBuilder),
    };
    assignments = { countBy: jest.fn().mockResolvedValue(0) };
    entityManager = {
      save: jest.fn().mockResolvedValue(undefined),
      softDelete: jest.fn().mockResolvedValue(undefined),
    };
    dataSource = {
      transaction: jest.fn((cb) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
        cb(entityManager as unknown as EntityManager),
      ),
    };
    schedulesService = {
      findVisible: jest.fn().mockResolvedValue(schedule),
      findEditable: jest.fn().mockResolvedValue(schedule),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftsService,
        { provide: getRepositoryToken(Shift), useValue: shifts },
        { provide: getRepositoryToken(Assignment), useValue: assignments },
        { provide: DataSource, useValue: dataSource },
        { provide: SchedulesService, useValue: schedulesService },
      ],
    }).compile();

    service = module.get(ShiftsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const dto: CreateShiftDto = {
      startsAt: new Date('2026-01-01T09:00:30.500Z'),
      endsAt: new Date('2026-01-01T17:00:45.900Z'),
      requiredHeadcount: 3,
    };

    it('should only create a shift on a schedule that is still editable', async () => {
      await service.create(scheduleId, dto, manager);

      expect(schedulesService.findEditable).toHaveBeenCalledWith(
        scheduleId,
        manager,
      );
    });

    it('should not create a shift when the schedule cannot be edited', async () => {
      schedulesService.findEditable.mockRejectedValue(
        new ConflictException('locked'),
      );

      await expect(
        service.create(scheduleId, dto, manager),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(shifts.save).not.toHaveBeenCalled();
    });

    it('should create the shift, normalising its bounds to whole minutes', async () => {
      const result = await service.create(scheduleId, dto, manager);

      expect(shifts.save).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        scheduleId,
        startsAt: startOfMinute(dto.startsAt),
        endsAt: startOfMinute(dto.endsAt),
        createdBy: manager.id,
        updatedBy: manager.id,
      });
    });

    it('should check for overlaps using the minute-normalised bounds', async () => {
      await service.create(scheduleId, dto, manager);

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'shift.startsAt <= :endsAt',
        { endsAt: startOfMinute(dto.endsAt) },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'shift.endsAt >= :startsAt',
        { startsAt: startOfMinute(dto.startsAt) },
      );
      // A brand-new shift has no id, so nothing is excluded from the check.
      expect(queryBuilder.andWhere).not.toHaveBeenCalledWith(
        'shift.id != :excludeId',
        expect.anything(),
      );
    });

    it('should not create a shift that overlaps an existing one', async () => {
      queryBuilder.getExists.mockResolvedValue(true);

      await expect(
        service.create(scheduleId, dto, manager),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(shifts.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return the shifts of a schedule the user may see', async () => {
      const found = [{ id: 'shift-1' }] as Shift[];
      shifts.find.mockResolvedValue(found);

      const result = await service.findAll(scheduleId, manager);

      expect(schedulesService.findVisible).toHaveBeenCalledWith(
        scheduleId,
        manager,
      );
      expect(shifts.find).toHaveBeenCalledWith({ where: { scheduleId } });
      expect(result).toBe(found);
    });
  });

  describe('findOne', () => {
    it('should return a shift scoped to a schedule the user may see', async () => {
      const found = { id: 'shift-1' } as Shift;
      shifts.findOneBy.mockResolvedValue(found);

      const result = await service.findOne(scheduleId, 'shift-1', manager);

      expect(schedulesService.findVisible).toHaveBeenCalledWith(
        scheduleId,
        manager,
      );
      expect(shifts.findOneBy).toHaveBeenCalledWith({
        id: 'shift-1',
        scheduleId,
      });
      expect(result).toBe(found);
    });
  });

  describe('update', () => {
    const existing = {
      id: 'shift-1',
      scheduleId,
      startsAt: startOfMinute(new Date('2026-01-01T09:00:00.000Z')),
      endsAt: startOfMinute(new Date('2026-01-01T17:00:00.000Z')),
      requiredHeadcount: 3,
    } as Shift;

    it('should only update a shift on a schedule that is still editable', async () => {
      schedulesService.findEditable.mockRejectedValue(
        new ConflictException('locked'),
      );

      await expect(
        service.update(scheduleId, existing.id, {}, manager),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(shifts.findOneBy).not.toHaveBeenCalled();
      expect(shifts.save).not.toHaveBeenCalled();
    });

    it('should not update a shift that does not exist', async () => {
      shifts.findOneBy.mockResolvedValue(null);

      await expect(
        service.update(scheduleId, 'missing', {}, manager),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(queryBuilder.getExists).not.toHaveBeenCalled();
      expect(shifts.save).not.toHaveBeenCalled();
    });

    it('should not treat the shift being updated as overlapping itself', async () => {
      shifts.findOneBy.mockResolvedValue({ ...existing });

      await service.update(
        scheduleId,
        existing.id,
        { startsAt: new Date('2026-01-01T10:00:00.000Z') },
        manager,
      );

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'shift.id != :excludeId',
        { excludeId: existing.id },
      );
    });

    it('should keep the current bounds when the update leaves them unchanged', async () => {
      shifts.findOneBy.mockResolvedValue({ ...existing });

      await service.update(scheduleId, existing.id, {}, manager);

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'shift.startsAt <= :endsAt',
        { endsAt: existing.endsAt },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'shift.endsAt >= :startsAt',
        { startsAt: existing.startsAt },
      );
    });

    it('should not update a shift so that it overlaps another one', async () => {
      shifts.findOneBy.mockResolvedValue({ ...existing });
      queryBuilder.getExists.mockResolvedValue(true);

      await expect(
        service.update(
          scheduleId,
          existing.id,
          { endsAt: new Date('2026-01-01T20:00:00.000Z') },
          manager,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(shifts.save).not.toHaveBeenCalled();
    });

    it('should not reduce the headcount below the number already assigned', async () => {
      shifts.findOneBy.mockResolvedValue({ ...existing });
      assignments.countBy.mockResolvedValue(3);

      await expect(
        service.update(
          scheduleId,
          existing.id,
          { requiredHeadcount: 2 },
          manager,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(assignments.countBy).toHaveBeenCalledWith({ shiftId: existing.id });
      expect(shifts.save).not.toHaveBeenCalled();
    });

    it('should allow a headcount that still covers the assigned employees', async () => {
      shifts.findOneBy.mockResolvedValue({ ...existing });
      assignments.countBy.mockResolvedValue(2);

      await service.update(
        scheduleId,
        existing.id,
        { requiredHeadcount: 2 },
        manager,
      );

      expect(shifts.save).toHaveBeenCalledTimes(1);
    });

    it('should apply the changes and record who updated the shift', async () => {
      shifts.findOneBy.mockResolvedValue({ ...existing });

      const result = await service.update(
        scheduleId,
        existing.id,
        { requiredHeadcount: 5 },
        manager,
      );

      expect(shifts.save).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        requiredHeadcount: 5,
        updatedBy: manager.id,
      });
    });
  });

  describe('remove', () => {
    const existing = { id: 'shift-1', scheduleId } as Shift;

    it('should only delete a shift on a schedule that is still editable', async () => {
      schedulesService.findEditable.mockRejectedValue(
        new ConflictException('locked'),
      );

      await expect(
        service.remove(scheduleId, existing.id, manager),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(shifts.findOneBy).not.toHaveBeenCalled();
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should not delete a shift that does not exist', async () => {
      shifts.findOneBy.mockResolvedValue(null);

      await expect(
        service.remove(scheduleId, 'missing', manager),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(entityManager.softDelete).not.toHaveBeenCalled();
    });

    it('should soft-delete the shift and record who removed it', async () => {
      shifts.findOneBy.mockResolvedValue({ ...existing });

      await service.remove(scheduleId, existing.id, manager);

      expect(entityManager.save).toHaveBeenCalledWith(
        Shift,
        expect.objectContaining({ id: existing.id, updatedBy: manager.id }),
      );
      expect(entityManager.softDelete).toHaveBeenCalledWith(Shift, existing.id);
    });
  });
});
