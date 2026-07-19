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

describe('schedule/SchedulesService', () => {
  let service: SchedulesService;
  let queryBuilder: {
    where: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    getExists: jest.Mock;
    getMany: jest.Mock;
  };
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    findOneBy: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let entityManager: { save: jest.Mock; softDelete: jest.Mock };
  let dataSource: { transaction: jest.Mock };

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
      getExists: jest.fn().mockResolvedValue(false),
      getMany: jest.fn().mockResolvedValue([]),
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        { provide: getRepositoryToken(Schedule), useValue: repository },
        { provide: DataSource, useValue: dataSource },
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
      queryBuilder.getExists.mockResolvedValue(false);

      const result = await service.create(user, dto);

      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({ createdBy: user.id, updatedBy: user.id });
    });

    it('should treat schedules as whole days, ignoring the time of day when checking for overlaps', async () => {
      // dto carries a 10:00 time; a schedule occupies the entire calendar day,
      // so the overlap check must widen it to [start of day, end of day].
      await service.create(user, dto);

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
      queryBuilder.getExists.mockResolvedValue(true);

      await expect(service.create(user, dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const existing = {
      id: 'schedule-1',
      createdBy: user.id,
      startsAt: startOfDay(new Date('2026-01-01T00:00:00.000Z')),
      endsAt: endOfDay(new Date('2026-01-07T00:00:00.000Z')),
    } as Schedule;

    it('should not update a schedule that does not exist', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.update('missing', user, {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(queryBuilder.getExists).not.toHaveBeenCalled();
    });

    it('should not let a user update a schedule owned by someone else', async () => {
      repository.findOneBy.mockResolvedValue({
        ...existing,
        createdBy: 'another-user',
      });

      await expect(
        service.update(existing.id, user, { label: 'Hijacked' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(queryBuilder.getExists).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should not treat the schedule being updated as overlapping itself', async () => {
      repository.findOneBy.mockResolvedValue({ ...existing });

      await service.update(existing.id, user, {
        startsAt: new Date('2026-01-02T00:00:00.000Z'),
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'schedule.id != :excludeId',
        { excludeId: existing.id },
      );
    });

    it('should keep the current dates when the update leaves them unchanged', async () => {
      repository.findOneBy.mockResolvedValue({ ...existing });

      await service.update(existing.id, user, { label: 'Renamed' });

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
      repository.findOneBy.mockResolvedValue({ ...existing });
      queryBuilder.getExists.mockResolvedValue(true);

      await expect(
        service.update(existing.id, user, {
          endsAt: new Date('2026-01-20T00:00:00.000Z'),
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should update the schedule when the new dates do not overlap another one', async () => {
      repository.findOneBy.mockResolvedValue({ ...existing });
      queryBuilder.getExists.mockResolvedValue(false);

      const result = await service.update(existing.id, user, {
        endsAt: new Date('2026-01-10T00:00:00.000Z'),
      });

      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({ updatedBy: user.id });
    });
  });

  describe('remove', () => {
    const existing = {
      id: 'schedule-1',
      createdBy: user.id,
      startsAt: startOfDay(new Date('2026-01-01T00:00:00.000Z')),
      endsAt: endOfDay(new Date('2026-01-07T00:00:00.000Z')),
    } as Schedule;

    it('should not delete a schedule that does not exist', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.remove('missing', user)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should not let a user delete a schedule owned by someone else', async () => {
      repository.findOneBy.mockResolvedValue({
        ...existing,
        createdBy: 'another-user',
      });

      await expect(service.remove(existing.id, user)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(entityManager.softDelete).not.toHaveBeenCalled();
    });

    it('should soft-delete the schedule and record who removed it when the owner deletes it', async () => {
      repository.findOneBy.mockResolvedValue({ ...existing });

      await service.remove(existing.id, user);

      expect(entityManager.save).toHaveBeenCalledWith(
        Schedule,
        expect.objectContaining({ id: existing.id, updatedBy: user.id }),
      );
      expect(entityManager.softDelete).toHaveBeenCalledWith(
        Schedule,
        existing.id,
      );
    });
  });

  describe('findAll', () => {
    it('should hide draft schedules from non-managers', async () => {
      await service.findAll(user);

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'schedule.status != :draftStatus',
        { draftStatus: ScheduleStatus.DRAFT },
      );
    });

    it('should show managers published schedules together with their own drafts', async () => {
      await service.findAll(manager);

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'schedule.status != :draftStatus OR schedule.createdBy = :userId',
        { draftStatus: ScheduleStatus.DRAFT, userId: manager.id },
      );
    });

    it('should return the schedules ordered by their start date', async () => {
      const schedules = [{ id: 'schedule-1' }] as Schedule[];
      queryBuilder.getMany.mockResolvedValue(schedules);

      const result = await service.findAll(manager);

      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'schedule.startsAt',
        'ASC',
      );
      expect(result).toBe(schedules);
    });
  });
});
