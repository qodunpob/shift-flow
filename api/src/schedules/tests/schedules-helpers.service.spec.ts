import { Schedule, ScheduleStatus, UserRole } from '@/entities';
import { SchedulesHelpersService } from '@/schedules/schedules-helpers.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('schedules/SchedulesHelpersService', () => {
  let service: SchedulesHelpersService;
  let repository: {
    findOneBy: jest.Mock;
  };
  const user: AuthenticatedUser = { id: 'user-1', roles: [] };
  const manager: AuthenticatedUser = {
    id: 'manager-1',
    roles: [UserRole.MANAGER],
  };

  beforeEach(async () => {
    repository = { findOneBy: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesHelpersService,
        { provide: getRepositoryToken(Schedule), useValue: repository },
      ],
    }).compile();

    service = module.get(SchedulesHelpersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findVisible', () => {
    it('should return a published schedule to any user', async () => {
      const schedule = {
        id: 'schedule-1',
        createdBy: 'someone-else',
        status: ScheduleStatus.APPROVED,
      } as Schedule;
      repository.findOneBy.mockResolvedValueOnce(schedule);

      await expect(
        service.findVisible('schedule-1', user),
      ).resolves.toStrictEqual(schedule);
    });

    it('should return a draft to the manager who owns it', async () => {
      const draft = {
        id: 'schedule-1',
        createdBy: manager.id,
        status: ScheduleStatus.DRAFT,
      } as Schedule;
      repository.findOneBy.mockResolvedValueOnce(draft);

      await expect(
        service.findVisible('schedule-1', manager),
      ).resolves.toStrictEqual(draft);
    });

    it('should report a draft owned by someone else as not found', async () => {
      repository.findOneBy.mockResolvedValueOnce({
        id: 'schedule-1',
        createdBy: 'another-manager',
        status: ScheduleStatus.DRAFT,
      });

      await expect(
        service.findVisible('schedule-1', manager),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw NotFound when the schedule does not exist', async () => {
      repository.findOneBy.mockResolvedValueOnce(null);

      await expect(
        service.findVisible('missing', manager),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findEditable', () => {
    it('should return a visible schedule whose status is editable', async () => {
      const schedule = {
        id: 'schedule-1',
        createdBy: manager.id,
        status: ScheduleStatus.DRAFT,
      } as Schedule;
      repository.findOneBy.mockResolvedValueOnce(schedule);

      await expect(
        service.findEditable('schedule-1', manager),
      ).resolves.toStrictEqual(schedule);
    });

    it('should reject a visible schedule whose status is not editable', async () => {
      repository.findOneBy.mockResolvedValueOnce({
        id: 'schedule-1',
        createdBy: 'someone-else',
        status: ScheduleStatus.APPROVED,
      });

      await expect(
        service.findEditable('schedule-1', manager),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should surface the visibility outcome, hiding a draft owned by someone else', async () => {
      // findEditable builds on findVisible, so an invisible draft stays a 404
      // and never leaks through as an editability conflict.
      repository.findOneBy.mockResolvedValueOnce({
        id: 'schedule-1',
        createdBy: 'another-manager',
        status: ScheduleStatus.DRAFT,
      });

      await expect(
        service.findEditable('schedule-1', manager),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw NotFound when the schedule does not exist', async () => {
      repository.findOneBy.mockResolvedValueOnce(null);

      await expect(
        service.findEditable('missing', manager),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
