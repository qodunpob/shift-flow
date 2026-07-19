import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { endOfDay, startOfDay } from 'date-fns';
import { SchedulesService } from '../schedules.service';
import { Schedule } from '@/entities';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { CreateScheduleDto } from '@/schedules/schedules.dto';

describe('schedule/SchedulesService', () => {
  let service: SchedulesService;
  let queryBuilder: {
    where: jest.Mock;
    andWhere: jest.Mock;
    getExists: jest.Mock;
  };
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    findOneBy: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  const user: AuthenticatedUser = { id: 'user-1', roles: [] };

  beforeEach(async () => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getExists: jest.fn().mockResolvedValue(false),
    };
    repository = {
      create: jest.fn((entity) => entity),
      save: jest.fn((entity) =>
        Promise.resolve({ id: 'schedule-1', ...entity }),
      ),
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn(() => queryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        { provide: getRepositoryToken(Schedule), useValue: repository },
        { provide: DataSource, useValue: {} },
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
});
