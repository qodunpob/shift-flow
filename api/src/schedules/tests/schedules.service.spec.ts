import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { endOfDay, startOfDay } from 'date-fns';
import { SchedulesService } from '../schedules.service';
import { Schedule, ScheduleStatus, UserRole } from '@/entities';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { CreateScheduleDto } from '@/schedules/schedules.dto';
import { SchedulesHelpersService } from '@/schedules/schedules-helpers.service';

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
  let entityManager: { save: jest.Mock; softDelete: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let helpers: {
    findVisible: jest.Mock;
    findEditable: jest.Mock;
  };

  const user: AuthenticatedUser = { id: 'user-1', roles: [] };
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        { provide: getRepositoryToken(Schedule), useValue: repository },
        { provide: DataSource, useValue: dataSource },
        { provide: SchedulesHelpersService, useValue: helpers },
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

    it('should treat schedules as whole days, ignoring the time of day when checking for overlaps', async () => {
      // dto carries a 10:00 time; a schedule occupies the entire calendar day,
      // so the overlap check must widen it to [start of day, end of day].
      await service.create(dto, manager);

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'schedule.startsAt <= :endsAt',
        { endsAt: endOfDay(dto.endsAt) },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'schedule.endsAt >= :startsAt',
        { startsAt: startOfDay(dto.startsAt) },
      );
      // A brand-new schedule has no id, so nothing is excluded from the check.
      expect(queryBuilder.andWhere).not.toHaveBeenCalledWith(
        'schedule.id != :excludeId',
        expect.anything(),
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
      startsAt: startOfDay(new Date('2026-01-01T00:00:00.000Z')),
      endsAt: endOfDay(new Date('2026-01-07T00:00:00.000Z')),
    } as Schedule;

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

    it('should not update a schedule so that it overlaps another one', async () => {
      helpers.findEditable.mockResolvedValueOnce({ ...existing });
      queryBuilder.getExists.mockResolvedValueOnce(true);

      await expect(
        service.update(
          existing.id,
          {
            endsAt: new Date('2026-01-20T00:00:00.000Z'),
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
      startsAt: startOfDay(new Date('2026-01-01T00:00:00.000Z')),
      endsAt: endOfDay(new Date('2026-01-07T00:00:00.000Z')),
    } as Schedule;

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
        Schedule,
        expect.objectContaining({ id: existing.id, updatedBy: manager.id }),
      );
      expect(entityManager.softDelete).toHaveBeenCalledWith(
        Schedule,
        existing.id,
      );
    });
  });

  describe('findAll', () => {
    const pagination = { page: 1, limit: 20 };

    it('should hide draft schedules from non-managers', async () => {
      await service.findAll(pagination, user);

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
      const schedules = [{ id: 'schedule-1' }] as Schedule[];
      queryBuilder.getManyAndCount.mockResolvedValueOnce([schedules, 1]);

      const result = await service.findAll(pagination, manager);

      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'schedule.startsAt',
        'ASC',
      );
      expect(result.items).toStrictEqual(schedules);
    });

    it('should return the requested page together with pagination metadata', async () => {
      const schedules = [{ id: 'schedule-3' }] as Schedule[];
      queryBuilder.getManyAndCount.mockResolvedValueOnce([schedules, 42]);

      const result = await service.findAll({ page: 2, limit: 20 }, manager);

      // page 2 of size 20 skips the first 20 rows.
      expect(queryBuilder.skip).toHaveBeenCalledWith(20);
      expect(queryBuilder.take).toHaveBeenCalledWith(20);
      expect(result).toEqual({
        items: schedules,
        meta: { total: 42, page: 2, limit: 20, totalPages: 3 },
      });
    });
  });

  describe('findOne', () => {
    it('should return a visible schedule', async () => {
      helpers.findVisible.mockReturnValueOnce({ id: 'schedule-1' });
      const result = await service.findOne('schedule-1', manager);
      expect(result).toEqual({ id: 'schedule-1' });
    });

    it('should not return a non-visible schedule', async () => {
      helpers.findVisible.mockRejectedValueOnce(new NotFoundException());
      await expect(service.findOne('schedule-1', manager)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
