import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { startOfMinute } from 'date-fns';
import { ShiftsService } from '../shifts.service';
import { CreateShiftDto } from '../shifts.dto';
import { Assignment, Schedule, Shift, UserRole } from '@/entities';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { ShiftsHelpersService } from '@/shift/shifts-helpers.service';
import { SchedulesHelpersService } from '@/schedules/schedules-helpers.service';
import { omit } from 'lodash';

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
  let schedulesHelpers: { findVisible: jest.Mock; findEditable: jest.Mock };
  let helpers: { findVisible: jest.Mock; findEditable: jest.Mock };

  const manager: AuthenticatedUser = {
    id: 'manager-1',
    roles: [UserRole.MANAGER],
  };
  const scheduleId = 'schedule-1';
  const schedule = { id: scheduleId, createdBy: manager.id } as Schedule;

  beforeEach(async () => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getExists: jest.fn().mockResolvedValue(false),
    };
    shifts = {
      create: jest.fn((entity: Shift) => ({
        ...entity,
        scheduleId: entity.schedule.id,
      })),
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
    schedulesHelpers = {
      findVisible: jest.fn().mockResolvedValue(schedule),
      findEditable: jest.fn().mockResolvedValue(schedule),
    };
    helpers = {
      findVisible: jest.fn(),
      findEditable: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftsService,
        { provide: getRepositoryToken(Shift), useValue: shifts },
        { provide: getRepositoryToken(Assignment), useValue: assignments },
        { provide: DataSource, useValue: dataSource },
        { provide: SchedulesHelpersService, useValue: schedulesHelpers },
        { provide: ShiftsHelpersService, useValue: helpers },
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

    it('should not create a shift when the schedule cannot be edited', async () => {
      schedulesHelpers.findEditable.mockRejectedValue(
        new ConflictException('locked'),
      );

      await expect(
        service.create(scheduleId, dto, manager),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(shifts.save).not.toHaveBeenCalled();
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
      queryBuilder.getExists.mockResolvedValueOnce(true);

      await expect(
        service.create(scheduleId, dto, manager),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(shifts.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return the shifts of a schedule the user may see', async () => {
      const found = [{ id: 'shift-1' }] as Shift[];
      shifts.find.mockResolvedValueOnce(found);

      const result = await service.findAll(scheduleId, manager);

      expect(schedulesHelpers.findVisible).toHaveBeenCalledWith(
        scheduleId,
        manager,
      );
      expect(shifts.find).toHaveBeenCalledWith({ where: { scheduleId } });
      expect(result).toStrictEqual(found);
    });

    it('should not return the shifts if a schedule is not visible', async () => {
      schedulesHelpers.findVisible.mockRejectedValueOnce(
        new NotFoundException(),
      );

      await expect(service.findAll(scheduleId, manager)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(shifts.find).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return the visible shift', async () => {
      const found = { id: 'shift-1', scheduleId } as Shift;
      helpers.findVisible.mockResolvedValueOnce(found);

      const result = await service.findOne('shift-1', manager);
      expect(result).toStrictEqual(found);
    });

    it('should not return a shift that is not visible', async () => {
      helpers.findVisible.mockRejectedValueOnce(new NotFoundException());

      await expect(service.findOne('missing', manager)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const existing = {
      id: 'shift-1',
      scheduleId,
      schedule,
      startsAt: startOfMinute(new Date('2026-01-01T09:00:00.000Z')),
      endsAt: startOfMinute(new Date('2026-01-01T17:00:00.000Z')),
      requiredHeadcount: 3,
    } as Shift;

    it('should apply the changes', async () => {
      helpers.findEditable.mockResolvedValueOnce({ ...existing });

      const result = await service.update(
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

    it('should return only the data of the shift itself, stripped of related entities', async () => {
      helpers.findEditable.mockResolvedValueOnce({ ...existing });

      const result = await service.update(existing.id, {}, manager);
      expect(result).toEqual({
        ...omit(existing, ['schedule']),
        updatedBy: manager.id,
      });
    });

    it('should not update a shift that is not editable', async () => {
      helpers.findEditable.mockRejectedValueOnce(new NotFoundException());

      await expect(
        service.update('missing', {}, manager),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(shifts.save).not.toHaveBeenCalled();
    });

    it('should not update a shift when its schedule does not belong to the user', async () => {
      helpers.findEditable.mockResolvedValueOnce({
        ...existing,
        schedule: {
          ...existing.schedule,
          createdBy: 'someone-else',
        },
      });

      await expect(
        service.update(existing.id, {}, manager),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(shifts.save).not.toHaveBeenCalled();
    });

    it('should not treat the shift being updated as overlapping itself', async () => {
      helpers.findEditable.mockResolvedValueOnce({ ...existing });

      await service.update(
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
      helpers.findEditable.mockResolvedValueOnce({ ...existing });

      await service.update(existing.id, {}, manager);

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
      helpers.findEditable.mockResolvedValueOnce({ ...existing });
      queryBuilder.getExists.mockResolvedValueOnce(true);

      await expect(
        service.update(
          existing.id,
          { endsAt: new Date('2026-01-01T20:00:00.000Z') },
          manager,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(shifts.save).not.toHaveBeenCalled();
    });

    it('should not reduce the headcount below the number already assigned', async () => {
      helpers.findEditable.mockResolvedValueOnce({ ...existing });
      assignments.countBy.mockResolvedValueOnce(3);

      await expect(
        service.update(existing.id, { requiredHeadcount: 2 }, manager),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(assignments.countBy).toHaveBeenCalledWith({
        shiftId: existing.id,
      });
      expect(shifts.save).not.toHaveBeenCalled();
    });

    it('should allow a headcount that still covers the assigned employees', async () => {
      helpers.findEditable.mockResolvedValueOnce({ ...existing });
      assignments.countBy.mockResolvedValueOnce(2);

      await service.update(existing.id, { requiredHeadcount: 2 }, manager);

      expect(shifts.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    const existing = { id: 'shift-1', scheduleId, schedule } as Shift;

    it('should soft-delete the shift', async () => {
      helpers.findEditable.mockResolvedValueOnce({ ...existing });

      await service.remove(existing.id, manager);

      expect(entityManager.save).toHaveBeenCalledWith(
        Shift,
        expect.objectContaining({ id: existing.id, updatedBy: manager.id }),
      );
      expect(entityManager.softDelete).toHaveBeenCalledWith(Shift, existing.id);
    });

    it('should not delete a shift that is not editable', async () => {
      helpers.findEditable.mockRejectedValueOnce(new NotFoundException());

      await expect(service.remove('missing', manager)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(entityManager.softDelete).not.toHaveBeenCalled();
    });

    it('should not delete a shift when its schedule does not belong to the user', async () => {
      helpers.findEditable.mockResolvedValueOnce({
        ...existing,
        schedule: {
          ...existing.schedule,
          createdBy: 'someone-else',
        },
      });

      await expect(service.remove(existing.id, manager)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(entityManager.softDelete).not.toHaveBeenCalled();
    });
  });
});
