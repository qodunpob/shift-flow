import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ScheduleStatsService } from '../schedule-stats.service';
import { AssignmentStatus, ScheduleEntity, ShiftEntity } from '@/entities';

/**
 * A chainable stand-in for a TypeORM SelectQueryBuilder. Every builder method
 * returns the same object so calls can be chained; `getRawMany` yields whatever
 * the test queued up for that particular builder instance.
 */
const createQueryBuilder = (rows: unknown[]) => {
  const qb = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rows),
  };
  return qb;
};

describe('schedules/ScheduleStatsService', () => {
  let service: ScheduleStatsService;
  let builders: ReturnType<typeof createQueryBuilder>[];
  let nextBuilder: number;
  let repository: { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    builders = [];
    nextBuilder = 0;
    repository = {
      // The service builds two queries; hand each call the next queued builder.
      createQueryBuilder: jest.fn(() => {
        const qb = builders[nextBuilder++];
        if (!qb) {
          throw new Error('Unexpected createQueryBuilder call');
        }
        return qb;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleStatsService,
        { provide: getRepositoryToken(ShiftEntity), useValue: repository },
      ],
    }).compile();

    service = module.get(ScheduleStatsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('statsFor', () => {
    it('should not touch the database when there are no schedule ids', async () => {
      const result = await service.statsFor([]);

      expect(result.size).toBe(0);
      expect(repository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should combine the headcount sum with the filled and accepted counts per schedule', async () => {
      builders = [
        // headcount query
        createQueryBuilder([{ scheduleId: 's1', total: '5' }]),
        // assignment counts query
        createQueryBuilder([{ scheduleId: 's1', filled: '3', accepted: '2' }]),
      ];

      const result = await service.statsFor(['s1']);

      expect(result.get('s1')).toEqual({
        totalRequiredHeadcount: 5,
        totalFilledCount: 3,
        totalAcceptedCount: 2,
      });
    });

    it('should count assignments by status, excluding declined ones from the filled count', async () => {
      builders = [createQueryBuilder([]), createQueryBuilder([])];

      await service.statsFor(['s1']);

      const countsBuilder = builders[1];
      expect(countsBuilder.addSelect).toHaveBeenCalledWith(
        'COUNT(assignment.id) FILTER (WHERE assignment.status != :declined)',
        'filled',
      );
      expect(countsBuilder.addSelect).toHaveBeenCalledWith(
        'COUNT(assignment.id) FILTER (WHERE assignment.status = :accepted)',
        'accepted',
      );
      expect(countsBuilder.setParameters).toHaveBeenCalledWith({
        declined: AssignmentStatus.DECLINED,
        accepted: AssignmentStatus.ACCEPTED,
      });
    });

    it('should default a schedule that only has shifts but no assignments to zero counts', async () => {
      builders = [
        createQueryBuilder([{ scheduleId: 's1', total: '4' }]),
        createQueryBuilder([]),
      ];

      const result = await service.statsFor(['s1']);

      expect(result.get('s1')).toEqual({
        totalRequiredHeadcount: 4,
        totalFilledCount: 0,
        totalAcceptedCount: 0,
      });
    });

    it('should default a schedule that has assignments but was missing from the headcount query to zero headcount', async () => {
      builders = [
        createQueryBuilder([]),
        createQueryBuilder([{ scheduleId: 's1', filled: '2', accepted: '1' }]),
      ];

      const result = await service.statsFor(['s1']);

      expect(result.get('s1')).toEqual({
        totalRequiredHeadcount: 0,
        totalFilledCount: 2,
        totalAcceptedCount: 1,
      });
    });
  });

  describe('withStats', () => {
    it('should merge the stored totals onto the schedule', () => {
      const schedule = { id: 's1' } as ScheduleEntity;
      const stats = new Map([
        [
          's1',
          {
            totalRequiredHeadcount: 7,
            totalFilledCount: 5,
            totalAcceptedCount: 3,
          },
        ],
      ]);

      expect(service.withStats(schedule, stats)).toEqual({
        id: 's1',
        totalRequiredHeadcount: 7,
        totalFilledCount: 5,
        totalAcceptedCount: 3,
      });
    });

    it('should fall back to zeroed totals when the schedule has none', () => {
      const schedule = { id: 's1' } as ScheduleEntity;

      expect(service.withStats(schedule, new Map())).toEqual({
        id: 's1',
        totalRequiredHeadcount: 0,
        totalFilledCount: 0,
        totalAcceptedCount: 0,
      });
    });
  });
});
