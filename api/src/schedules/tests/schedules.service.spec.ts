import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { SchedulesService } from '../schedules.service';
import {
  ScheduleEntity,
  ScheduleStatus,
  ShiftEntity,
  UserRole,
} from '@/entities';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { CreateScheduleDto } from '@/schedules/schedules.dto';
import { endOfDayWithTz, startOfDayWithTz } from '@/utils/timezone';
import { SchedulesHelpersService } from '@/schedules/schedules-helpers.service';
import {
  ScheduleStats,
  ScheduleStatsService,
} from '@/schedules/schedule-stats.service';

describe('schedules/SchedulesService', () => {
  let service: SchedulesService;
  let queryBuilder: {
    where: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    skip: jest.Mock;
    take: jest.Mock;
    getExists: jest.Mock;
    getManyAndCount: jest.Mock;
  };
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    findOneBy: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let shiftsQueryBuilder: {
    where: jest.Mock;
    andWhere: jest.Mock;
    getExists: jest.Mock;
  };
  let shiftsRepository: {
    createQueryBuilder: jest.Mock;
  };
  let entityManager: { save: jest.Mock; softDelete: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let helpers: {
    findVisible: jest.Mock;
    findEditable: jest.Mock;
  };
  let stats: {
    statsFor: jest.Mock;
    withStats: jest.Mock;
  };

  const zeroStats: ScheduleStats = {
    totalRequiredHeadcount: 0,
    totalFilledCount: 0,
    totalAcceptedCount: 0,
  };

  const manager: AuthenticatedUser = {
    id: 'manager-1',
    roles: [UserRole.MANAGER],
  };

  beforeEach(async () => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getExists: jest.fn().mockResolvedValue(false),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    repository = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      create: jest.fn((entity) => entity),
      save: jest.fn((entity) =>
        Promise.resolve({ id: 'schedule-1', ...entity }),
      ),
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn(() => queryBuilder),
    };
    shiftsQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getExists: jest.fn().mockResolvedValue(false),
    };
    shiftsRepository = {
      createQueryBuilder: jest.fn(() => shiftsQueryBuilder),
    };
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
    helpers = {
      findVisible: jest.fn(),
      findEditable: jest.fn(),
    };
    stats = {
      statsFor: jest.fn().mockResolvedValue(new Map<string, ScheduleStats>()),
      withStats: jest.fn((schedule: ScheduleEntity) => ({
        ...schedule,
        ...zeroStats,
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        { provide: getRepositoryToken(ScheduleEntity), useValue: repository },
        {
          provide: getRepositoryToken(ShiftEntity),
          useValue: shiftsRepository,
        },
        { provide: DataSource, useValue: dataSource },
        { provide: SchedulesHelpersService, useValue: helpers },
        { provide: ScheduleStatsService, useValue: stats },
      ],
    }).compile();

    service = module.get(SchedulesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const dto: CreateScheduleDto = {
      label: 'Week 1',
      startsAt: new Date('2026-01-01T10:00:00.000Z'),
      endsAt: new Date('2026-01-07T10:00:00.000Z'),
      timeZone: 'Asia/Tokyo',
    };

    it('should create the schedule when it does not overlap an existing one', async () => {
      queryBuilder.getExists.mockResolvedValueOnce(false);

      const result = await service.create(dto, manager);

      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        createdBy: manager.id,
        updatedBy: manager.id,
      });
    });

    it('should persist the given time zone', async () => {
      const result = await service.create(dto, manager);

      expect(result).toMatchObject({ timeZone: dto.timeZone });
    });

    it('should treat schedules as whole days, ignoring the time of day when checking for overlaps', async () => {
      // dto carries a 10:00 time; a schedule occupies the entire calendar day,
      // so the overlap check must widen it to [start of day, end of day].
      await service.create(dto, manager);

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'schedule.startsAt <= :endsAt',
        { endsAt: endOfDayWithTz(dto.endsAt, dto.timeZone) },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'schedule.endsAt >= :startsAt',
        { startsAt: startOfDayWithTz(dto.startsAt, dto.timeZone) },
      );
      // A brand-new schedule has no id, so nothing is excluded from the check.
      expect(queryBuilder.andWhere).not.toHaveBeenCalledWith(
        'schedule.id != :excludeId',
        expect.anything(),
      );
    });

    it('should compute the UTC day boundary relative to the given time zone', async () => {
      const jstDto: CreateScheduleDto = {
        startsAt: new Date('2026-07-25T05:02:25.714Z'),
        endsAt: new Date('2026-07-25T05:02:25.714Z'),
        timeZone: 'Asia/Tokyo',
      };

      await service.create(jstDto, manager);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'schedule.endsAt >= :startsAt',
        { startsAt: new Date('2026-07-24T15:00:00.000Z') },
      );
    });

    it('should not create a schedule that overlaps an existing one', async () => {
      queryBuilder.getExists.mockResolvedValueOnce(true);

      await expect(service.create(dto, manager)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const existing = {
      id: 'schedule-1',
      createdBy: manager.id,
      status: ScheduleStatus.DRAFT,
      startsAt: new Date('2026-01-01T00:00:00.000Z'),
      endsAt: new Date('2026-01-07T23:59:59.999Z'),
      timeZone: 'Asia/Tokyo',
    } as ScheduleEntity;

    it('should not update a schedule that is not editable', async () => {
      helpers.findEditable.mockRejectedValueOnce(new NotFoundException());

      await expect(
        service.update('missing', {}, manager),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it("should forbid updating someone else's visible schedule", async () => {
      helpers.findEditable.mockResolvedValueOnce({
        ...existing,
        status: ScheduleStatus.IN_REVIEW,
        createdBy: 'another-user',
      });
      await expect(
        service.update(existing.id, { label: 'Hijacked' }, manager),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(queryBuilder.getExists).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should not treat the schedule being updated as overlapping itself', async () => {
      helpers.findEditable.mockResolvedValueOnce({ ...existing });

      await service.update(
        existing.id,
        {
          startsAt: new Date('2026-01-02T00:00:00.000Z'),
          timeZone: 'UTC',
        },
        manager,
      );

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'schedule.id != :excludeId',
        { excludeId: existing.id },
      );
    });

    it('should keep the current dates when the update leaves them unchanged', async () => {
      helpers.findEditable.mockResolvedValueOnce({ ...existing });

      await service.update(existing.id, { label: 'Renamed' }, manager);

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'schedule.startsAt <= :endsAt',
        { endsAt: existing.endsAt },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'schedule.endsAt >= :startsAt',
        { startsAt: existing.startsAt },
      );
    });

    it("should fall back to the schedule's own time zone when updating dates without one", async () => {
      helpers.findEditable.mockResolvedValueOnce({ ...existing });

      const newStartsAt = new Date('2026-01-02T00:00:00.000Z');
      const result = await service.update(
        existing.id,
        { startsAt: newStartsAt },
        manager,
      );

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'schedule.endsAt >= :startsAt',
        { startsAt: startOfDayWithTz(newStartsAt, existing.timeZone) },
      );
      expect(result).toMatchObject({ timeZone: existing.timeZone });
    });

    it('should update the time zone when a new one is given', async () => {
      helpers.findEditable.mockResolvedValueOnce({ ...existing });

      const newStartsAt = new Date('2026-01-02T00:00:00.000Z');
      const result = await service.update(
        existing.id,
        { startsAt: newStartsAt, timeZone: 'America/New_York' },
        manager,
      );

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'schedule.endsAt >= :startsAt',
        { startsAt: startOfDayWithTz(newStartsAt, 'America/New_York') },
      );
      expect(result).toMatchObject({ timeZone: 'America/New_York' });
    });

    it('should leave the time zone unchanged when neither dates nor time zone are updated', async () => {
      helpers.findEditable.mockResolvedValueOnce({ ...existing });

      const result = await service.update(
        existing.id,
        { label: 'Renamed' },
        manager,
      );

      expect(result).toMatchObject({ timeZone: existing.timeZone });
    });

    it('should ignore a supplied time zone when no dates are being updated', async () => {
      helpers.findEditable.mockResolvedValueOnce({ ...existing });

      const result = await service.update(
        existing.id,
        { timeZone: 'America/New_York' },
        manager,
      );

      expect(result).toMatchObject({
        timeZone: existing.timeZone,
        startsAt: existing.startsAt,
        endsAt: existing.endsAt,
      });
    });

    it('should not update a schedule so that it overlaps another one', async () => {
      helpers.findEditable.mockResolvedValueOnce({ ...existing });
      queryBuilder.getExists.mockResolvedValueOnce(true);

      await expect(
        service.update(
          existing.id,
          {
            endsAt: new Date('2026-01-20T00:00:00.000Z'),
            timeZone: 'UTC',
          },
          manager,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should update the schedule when the new dates do not overlap another one', async () => {
      helpers.findEditable.mockResolvedValueOnce({ ...existing });
      queryBuilder.getExists.mockResolvedValueOnce(false);

      const result = await service.update(
        existing.id,
        {
          endsAt: new Date('2026-01-10T00:00:00.000Z'),
          timeZone: 'UTC',
        },
        manager,
      );

      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({ updatedBy: manager.id });
    });

    it('should not shrink a schedule so that it no longer contains one of its shifts', async () => {
      helpers.findEditable.mockResolvedValueOnce({ ...existing });
      shiftsQueryBuilder.getExists.mockResolvedValueOnce(true);

      await expect(
        service.update(
          existing.id,
          {
            endsAt: new Date('2026-01-03T23:59:59.999Z'),
            timeZone: 'UTC',
          },
          manager,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should check shift containment scoped to the schedule being updated', async () => {
      helpers.findEditable.mockResolvedValueOnce({ ...existing });

      const newEndsAt = new Date('2026-01-10T00:00:00.000Z');
      await service.update(
        existing.id,
        { endsAt: newEndsAt, timeZone: 'UTC' },
        manager,
      );

      expect(shiftsQueryBuilder.where).toHaveBeenCalledWith(
        'shift.scheduleId = :scheduleId',
        { scheduleId: existing.id },
      );
      expect(shiftsQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(shift.startsAt < :startsAt OR shift.endsAt > :endsAt)',
        {
          startsAt: existing.startsAt,
          endsAt: endOfDayWithTz(newEndsAt, 'UTC'),
        },
      );
    });

    it('should update the schedule when its shifts still fit within the new boundaries', async () => {
      helpers.findEditable.mockResolvedValueOnce({ ...existing });
      shiftsQueryBuilder.getExists.mockResolvedValueOnce(false);

      const result = await service.update(
        existing.id,
        {
          endsAt: new Date('2026-01-10T00:00:00.000Z'),
          timeZone: 'UTC',
        },
        manager,
      );

      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({ updatedBy: manager.id });
    });
  });

  describe('remove', () => {
    const existing = {
      id: 'schedule-1',
      createdBy: manager.id,
      status: ScheduleStatus.DRAFT,
      startsAt: new Date('2026-01-01T00:00:00.000Z'),
      endsAt: new Date('2026-01-07T23:59:59.999Z'),
    } as ScheduleEntity;

    it('should not delete a schedule that is not editable', async () => {
      helpers.findEditable.mockRejectedValueOnce(new NotFoundException());

      await expect(service.remove('missing', manager)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(entityManager.softDelete).not.toHaveBeenCalled();
    });

    it("should forbid deleting someone else's visible schedule", async () => {
      helpers.findEditable.mockResolvedValueOnce({
        ...existing,
        status: ScheduleStatus.IN_REVIEW,
        createdBy: 'another-user',
      });

      await expect(service.remove(existing.id, manager)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(entityManager.softDelete).not.toHaveBeenCalled();
    });

    it('should soft-delete the schedule and record who removed it when the owner deletes it', async () => {
      helpers.findEditable.mockResolvedValueOnce({ ...existing });

      await service.remove(existing.id, manager);

      expect(entityManager.save).toHaveBeenCalledWith(
        ScheduleEntity,
        expect.objectContaining({ id: existing.id, updatedBy: manager.id }),
      );
      expect(entityManager.softDelete).toHaveBeenCalledWith(
        ScheduleEntity,
        existing.id,
      );
    });
  });

  describe('findAll', () => {
    const pagination = { page: 1, limit: 20 };

    it('should hide draft schedules from non-managers', async () => {
      await service.findAll(pagination, { id: 'user-1', roles: [] });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'schedule.status != :visibilityDraft',
        { visibilityDraft: ScheduleStatus.DRAFT },
      );
    });

    it('should show managers published schedules together with their own drafts', async () => {
      await service.findAll(pagination, manager);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(schedule.status != :visibilityDraft OR schedule.createdBy = :visibilityUserId)',
        { visibilityDraft: ScheduleStatus.DRAFT, visibilityUserId: manager.id },
      );
    });

    it('should filter by status when a status is given', async () => {
      await service.findAll(
        {
          ...pagination,
          status: ScheduleStatus.APPROVED,
        },
        manager,
      );

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'schedule.status = :status',
        { status: ScheduleStatus.APPROVED },
      );
    });

    it('should not filter by status when none is given', async () => {
      await service.findAll(pagination, manager);

      expect(queryBuilder.andWhere).not.toHaveBeenCalledWith(
        'schedule.status = :status',
        expect.anything(),
      );
    });

    it("should return only the current user's schedules when mine is true", async () => {
      await service.findAll({ ...pagination, mine: true }, manager);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'schedule.createdBy = :ownerId',
        { ownerId: manager.id },
      );
    });

    it('should not restrict by ownership when mine is not set', async () => {
      await service.findAll(pagination, manager);

      expect(queryBuilder.andWhere).not.toHaveBeenCalledWith(
        'schedule.createdBy = :ownerId',
        expect.anything(),
      );
    });

    it('should return the schedules ordered by their start date', async () => {
      const schedules = [{ id: 'schedule-1' }] as ScheduleEntity[];
      queryBuilder.getManyAndCount.mockResolvedValueOnce([schedules, 1]);

      const result = await service.findAll(pagination, manager);

      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'schedule.startsAt',
        'DESC',
      );
      expect(result.items).toStrictEqual([{ id: 'schedule-1', ...zeroStats }]);
    });

    it('should enrich each returned schedule with its headcount totals', async () => {
      const schedules = [
        { id: 'schedule-1' },
        { id: 'schedule-2' },
      ] as ScheduleEntity[];
      queryBuilder.getManyAndCount.mockResolvedValueOnce([schedules, 2]);

      const totals = new Map<string, ScheduleStats>([
        [
          'schedule-1',
          {
            totalRequiredHeadcount: 5,
            totalFilledCount: 3,
            totalAcceptedCount: 2,
          },
        ],
      ]);
      stats.statsFor.mockResolvedValueOnce(totals);
      stats.withStats.mockImplementation((schedule: ScheduleEntity) => ({
        ...schedule,
        ...(totals.get(schedule.id) ?? zeroStats),
      }));

      const result = await service.findAll(pagination, manager);

      // Totals are resolved in a single batched call for the whole page.
      expect(stats.statsFor).toHaveBeenCalledWith(['schedule-1', 'schedule-2']);
      expect(result.items).toStrictEqual([
        {
          id: 'schedule-1',
          totalRequiredHeadcount: 5,
          totalFilledCount: 3,
          totalAcceptedCount: 2,
        },
        // A schedule with no shifts falls back to zeroed totals.
        { id: 'schedule-2', ...zeroStats },
      ]);
    });

    it('should return the requested page together with pagination metadata', async () => {
      const schedules = [{ id: 'schedule-3' }] as ScheduleEntity[];
      queryBuilder.getManyAndCount.mockResolvedValueOnce([schedules, 42]);

      const result = await service.findAll({ page: 2, limit: 20 }, manager);

      // page 2 of size 20 skips the first 20 rows.
      expect(queryBuilder.skip).toHaveBeenCalledWith(20);
      expect(queryBuilder.take).toHaveBeenCalledWith(20);
      expect(result).toEqual({
        items: [{ id: 'schedule-3', ...zeroStats }],
        meta: { total: 42, page: 2, limit: 20, totalPages: 3 },
      });
    });
  });

  describe('findOne', () => {
    it('should return a visible schedule enriched with its headcount totals', async () => {
      helpers.findVisible.mockReturnValueOnce({ id: 'schedule-1' });
      const totals = new Map<string, ScheduleStats>([
        [
          'schedule-1',
          {
            totalRequiredHeadcount: 8,
            totalFilledCount: 6,
            totalAcceptedCount: 4,
          },
        ],
      ]);
      stats.statsFor.mockResolvedValueOnce(totals);
      stats.withStats.mockImplementation((schedule: ScheduleEntity) => ({
        ...schedule,
        ...(totals.get(schedule.id) ?? zeroStats),
      }));

      const result = await service.findOne('schedule-1', manager);

      expect(stats.statsFor).toHaveBeenCalledWith(['schedule-1']);
      expect(result).toEqual({
        id: 'schedule-1',
        totalRequiredHeadcount: 8,
        totalFilledCount: 6,
        totalAcceptedCount: 4,
      });
    });

    it('should not return a non-visible schedule', async () => {
      helpers.findVisible.mockRejectedValueOnce(new NotFoundException());
      await expect(service.findOne('schedule-1', manager)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
