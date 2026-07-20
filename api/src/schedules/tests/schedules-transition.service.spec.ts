import { AuthenticatedUser } from '@/auth/authenticated-request';
import { Schedule, ScheduleStatus, UserRole } from '@/entities';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SchedulesTransitionService } from '@/schedules/schedules-transition.service';

describe('schedules/SchedulesTransitionService', () => {
  let service: SchedulesTransitionService;
  let repository: {
    save: jest.Mock;
    findOneBy: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      save: jest.fn((entity) =>
        Promise.resolve({ id: 'schedule-1', ...entity }),
      ),
      findOneBy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesTransitionService,
        { provide: getRepositoryToken(Schedule), useValue: repository },
      ],
    }).compile();

    service = module.get(SchedulesTransitionService);
  });

  afterEach(() => jest.clearAllMocks());

  const user: AuthenticatedUser = { id: 'user-1', roles: [] };
  const manager: AuthenticatedUser = {
    id: 'manager-1',
    roles: [UserRole.MANAGER],
  };
  const approver: AuthenticatedUser = {
    id: 'approver-1',
    roles: [UserRole.APPROVER],
  };

  // A schedule owned by `manager`, so owner-manager actions are authorized.
  const scheduleIn = (status: ScheduleStatus) =>
    ({
      id: 'schedule-1',
      createdBy: manager.id,
      status,
    }) as Schedule;

  it('should let the owning manager publish a draft, moving it to review', async () => {
    repository.findOneBy.mockResolvedValueOnce(
      scheduleIn(ScheduleStatus.DRAFT),
    );

    const result = await service.publish('schedule-1', manager);

    expect(result).toMatchObject({
      status: ScheduleStatus.IN_REVIEW,
      updatedBy: manager.id,
    });
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('should not let a user who is not the owning manager publish a schedule', async () => {
    // `user` owns nothing here and lacks the manager role.
    repository.findOneBy.mockResolvedValueOnce(
      scheduleIn(ScheduleStatus.DRAFT),
    );

    await expect(service.publish('schedule-1', user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should reject an action that is invalid for the current status', async () => {
    repository.findOneBy.mockResolvedValueOnce(
      scheduleIn(ScheduleStatus.DRAFT),
    );

    // Approve is only valid from AWAITING_APPROVAL.
    await expect(
      service.approve('schedule-1', approver),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should fail the transition when the schedule does not exist', async () => {
    repository.findOneBy.mockResolvedValueOnce(null);

    await expect(service.publish('missing', manager)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should let an approver approve a schedule awaiting approval', async () => {
    repository.findOneBy.mockResolvedValueOnce(
      scheduleIn(ScheduleStatus.AWAITING_APPROVAL),
    );

    const result = await service.approve('schedule-1', approver);

    expect(result).toMatchObject({
      status: ScheduleStatus.APPROVED,
      updatedBy: approver.id,
    });
  });

  it('should not let a non-approver approve a schedule', async () => {
    repository.findOneBy.mockResolvedValueOnce(
      scheduleIn(ScheduleStatus.AWAITING_APPROVAL),
    );

    await expect(service.approve('schedule-1', manager)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should record the reason when an approver rejects a schedule', async () => {
    repository.findOneBy.mockResolvedValueOnce(
      scheduleIn(ScheduleStatus.AWAITING_APPROVAL),
    );

    const result = await service.reject(
      'schedule-1',
      {
        rejectionReason: 'Understaffed on the weekend',
      },
      approver,
    );

    expect(result).toMatchObject({
      status: ScheduleStatus.REJECTED,
      rejectionReason: 'Understaffed on the weekend',
      updatedBy: approver.id,
    });
  });

  it('should clear a stale rejection reason when a rejected schedule is resubmitted', async () => {
    repository.findOneBy.mockResolvedValueOnce({
      ...scheduleIn(ScheduleStatus.REJECTED),
      rejectionReason: 'Previously rejected',
    });

    const result = await service.submitForApproval('schedule-1', manager);

    expect(result).toMatchObject({
      status: ScheduleStatus.AWAITING_APPROVAL,
      rejectionReason: null,
    });
  });
});
