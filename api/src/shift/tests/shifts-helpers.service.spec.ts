import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ShiftsHelpersService } from '../shifts-helpers.service';
import { Schedule, ScheduleStatus, Shift, UserRole } from '@/entities';
import { AuthenticatedUser } from '@/auth/authenticated-request';

describe('shifts/ShiftsHelpersService', () => {
  let service: ShiftsHelpersService;
  let shifts: { findOne: jest.Mock };

  const manager: AuthenticatedUser = {
    id: 'manager-1',
    roles: [UserRole.MANAGER],
  };

  // Builds a shift whose schedule carries the given status/owner, so the real
  // visibility and editability rules can be exercised end to end.
  const shiftWithSchedule = (schedule: Partial<Schedule>): Shift =>
    ({
      id: 'shift-1',
      scheduleId: 'schedule-1',
      schedule: { id: 'schedule-1', ...schedule } as Schedule,
    }) as Shift;

  beforeEach(async () => {
    shifts = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftsHelpersService,
        { provide: getRepositoryToken(Shift), useValue: shifts },
      ],
    }).compile();

    service = module.get(ShiftsHelpersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findVisible', () => {
    it('should load the shift together with its schedule', async () => {
      shifts.findOne.mockResolvedValue(
        shiftWithSchedule({ status: ScheduleStatus.APPROVED }),
      );

      await service.findVisible('shift-1', manager);

      expect(shifts.findOne).toHaveBeenCalledWith({
        where: { id: 'shift-1' },
        relations: { schedule: true },
      });
    });

    it('should return a shift on a published schedule to any user', async () => {
      const shift = shiftWithSchedule({
        status: ScheduleStatus.APPROVED,
        createdBy: 'someone-else',
      });
      shifts.findOne.mockResolvedValue(shift);

      await expect(service.findVisible('shift-1', manager)).resolves.toBe(shift);
    });

    it('should return a shift on a draft to the manager who owns the schedule', async () => {
      const shift = shiftWithSchedule({
        status: ScheduleStatus.DRAFT,
        createdBy: manager.id,
      });
      shifts.findOne.mockResolvedValue(shift);

      await expect(service.findVisible('shift-1', manager)).resolves.toBe(shift);
    });

    it('should hide a shift on a draft owned by someone else', async () => {
      shifts.findOne.mockResolvedValue(
        shiftWithSchedule({
          status: ScheduleStatus.DRAFT,
          createdBy: 'another-manager',
        }),
      );

      await expect(
        service.findVisible('shift-1', manager),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw NotFound when the shift does not exist', async () => {
      shifts.findOne.mockResolvedValue(null);

      await expect(
        service.findVisible('missing', manager),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findEditable', () => {
    it('should return a visible shift whose schedule is editable', async () => {
      const shift = shiftWithSchedule({
        status: ScheduleStatus.DRAFT,
        createdBy: manager.id,
      });
      shifts.findOne.mockResolvedValue(shift);

      await expect(service.findEditable('shift-1', manager)).resolves.toBe(
        shift,
      );
    });

    it('should reject a visible shift whose schedule is not editable', async () => {
      shifts.findOne.mockResolvedValue(
        shiftWithSchedule({
          status: ScheduleStatus.APPROVED,
          createdBy: 'someone-else',
        }),
      );

      await expect(
        service.findEditable('shift-1', manager),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should surface the visibility outcome, hiding an invisible draft', async () => {
      shifts.findOne.mockResolvedValue(
        shiftWithSchedule({
          status: ScheduleStatus.DRAFT,
          createdBy: 'another-manager',
        }),
      );

      await expect(
        service.findEditable('shift-1', manager),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
