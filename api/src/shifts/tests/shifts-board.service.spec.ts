import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ShiftsBoardService } from '../shifts-board.service';
import {
  AssignmentEntity,
  AssignmentProposalEntity,
  AssignmentStatus,
  ScheduleEntity,
  ScheduleStatus,
  ShiftEntity,
  UserEntity,
  UserRole,
} from '@/entities';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { SchedulesHelpersService } from '@/schedules/schedules-helpers.service';

describe('shifts/ShiftsBoardService', () => {
  let service: ShiftsBoardService;
  let shifts: { find: jest.Mock; findOne: jest.Mock };
  let schedulesHelpers: { findVisible: jest.Mock };

  const manager: AuthenticatedUser = {
    id: 'manager-1',
    roles: [UserRole.MANAGER],
  };
  const employee: AuthenticatedUser = { id: 'emp-1', roles: [] };
  const scheduleId = 'schedule-1';

  const employeeUser = (id: string): UserEntity =>
    ({
      id,
      firstName: `${id}-first`,
      lastName: `${id}-last`,
      emailAddress: `${id}@example.com`,
      roles: [],
    }) as unknown as UserEntity;

  const assignment = (over: Partial<AssignmentEntity> = {}): AssignmentEntity =>
    ({
      id: 'a-default',
      employeeId: 'emp-1',
      employee: employeeUser(over.employeeId ?? 'emp-1'),
      status: AssignmentStatus.PENDING,
      declineReason: null,
      ...over,
    }) as AssignmentEntity;

  const proposal = (
    over: Partial<AssignmentProposalEntity> = {},
  ): AssignmentProposalEntity =>
    ({
      id: 'p-default',
      employeeId: 'emp-1',
      employee: employeeUser(over.employeeId ?? 'emp-1'),
      message: 'pick me',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      ...over,
    }) as AssignmentProposalEntity;

  const shift = (over: Partial<ShiftEntity> = {}): ShiftEntity =>
    ({
      id: 'shift-1',
      scheduleId,
      startsAt: new Date('2026-01-02T09:00:00.000Z'),
      endsAt: new Date('2026-01-02T17:00:00.000Z'),
      requiredHeadcount: 3,
      assignments: [],
      proposals: [],
      ...over,
    }) as ShiftEntity;

  beforeEach(async () => {
    shifts = { find: jest.fn().mockResolvedValue([]), findOne: jest.fn() };
    schedulesHelpers = {
      findVisible: jest.fn().mockResolvedValue({ id: scheduleId }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftsBoardService,
        { provide: getRepositoryToken(ShiftEntity), useValue: shifts },
        { provide: SchedulesHelpersService, useValue: schedulesHelpers },
      ],
    }).compile();

    service = module.get(ShiftsBoardService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getScheduleBoard', () => {
    it('should gate on schedule visibility and load shifts with their relations', async () => {
      await service.getScheduleBoard(scheduleId, manager);

      expect(schedulesHelpers.findVisible).toHaveBeenCalledWith(
        scheduleId,
        manager,
      );
      expect(shifts.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { scheduleId },
          relations: {
            assignments: { employee: true },
            proposals: { employee: true },
          },
          order: { startsAt: 'ASC' },
        }),
      );
    });

    it('should not load shifts when the schedule is not visible', async () => {
      schedulesHelpers.findVisible.mockRejectedValueOnce(
        new NotFoundException(),
      );

      await expect(
        service.getScheduleBoard(scheduleId, manager),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(shifts.find).not.toHaveBeenCalled();
    });

    it('should show a manager the full roster and every proposal', async () => {
      shifts.find.mockResolvedValueOnce([
        shift({
          requiredHeadcount: 3,
          assignments: [
            assignment({ id: 'a-1', employeeId: 'emp-1' }),
            assignment({
              id: 'a-2',
              employeeId: 'emp-2',
              status: AssignmentStatus.DECLINED,
            }),
          ],
          proposals: [
            proposal({ id: 'p-1', employeeId: 'emp-1' }),
            proposal({ id: 'p-2', employeeId: 'emp-3' }),
          ],
        }),
      ]);

      const [view] = await service.getScheduleBoard(scheduleId, manager);

      expect(view.assignments.map((a) => a.id)).toEqual(['a-1', 'a-2']);
      expect(view.proposals.map((p) => p.id)).toEqual(['p-1', 'p-2']);
      // One assignment is DECLINED, so only one slot is filled of three.
      expect(view.filledCount).toBe(1);
      expect(view.spotsRemaining).toBe(2);
    });

    it('should show a non-manager the full roster but only their own proposals', async () => {
      shifts.find.mockResolvedValueOnce([
        shift({
          assignments: [
            assignment({ id: 'a-1', employeeId: 'emp-1' }),
            assignment({ id: 'a-2', employeeId: 'emp-2' }),
          ],
          proposals: [
            proposal({ id: 'p-own', employeeId: 'emp-1' }),
            proposal({ id: 'p-other', employeeId: 'emp-3' }),
          ],
        }),
      ]);

      const [view] = await service.getScheduleBoard(scheduleId, employee);

      expect(view.assignments.map((a) => a.id)).toEqual(['a-1', 'a-2']);
      expect(view.proposals.map((p) => p.id)).toEqual(['p-own']);
    });

    it('should expose only safe employee fields and clamp spotsRemaining at zero', async () => {
      shifts.find.mockResolvedValueOnce([
        shift({
          requiredHeadcount: 1,
          assignments: [
            assignment({ id: 'a-1', employeeId: 'emp-1' }),
            assignment({ id: 'a-2', employeeId: 'emp-2' }),
          ],
        }),
      ]);

      const [view] = await service.getScheduleBoard(scheduleId, manager);

      expect(view.spotsRemaining).toBe(0);
      expect(view.assignments[0].employee).toEqual({
        id: 'emp-1',
        firstName: 'emp-1-first',
        lastName: 'emp-1-last',
      });
      expect(view.assignments[0].employee).not.toHaveProperty('emailAddress');
    });
  });

  describe('getShift', () => {
    it('should return the enriched shift when the schedule is visible', async () => {
      shifts.findOne.mockResolvedValueOnce(
        shift({
          schedule: { status: ScheduleStatus.APPROVED } as ScheduleEntity,
          proposals: [
            proposal({ id: 'p-own', employeeId: 'emp-1' }),
            proposal({ id: 'p-other', employeeId: 'emp-3' }),
          ],
        }),
      );

      const view = await service.getShift('shift-1', employee);

      expect(view.id).toBe('shift-1');
      expect(view).not.toHaveProperty('schedule');
      expect(view.proposals.map((p) => p.id)).toEqual(['p-own']);
    });

    it('should throw NotFound when the shift does not exist', async () => {
      shifts.findOne.mockResolvedValueOnce(null);

      await expect(service.getShift('missing', manager)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should throw NotFound when the schedule is hidden from the viewer', async () => {
      shifts.findOne.mockResolvedValueOnce(
        shift({
          schedule: {
            status: ScheduleStatus.DRAFT,
            createdBy: 'another-manager',
          } as ScheduleEntity,
        }),
      );

      await expect(
        service.getShift('shift-1', employee),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
