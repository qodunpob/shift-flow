import { SelectQueryBuilder } from 'typeorm';
import { ScheduleEntity, ScheduleStatus, UserRole } from '@/entities';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import {
  applyScheduleVisibility,
  isScheduleVisibleTo,
} from '../schedule-visibility';

describe('schedules/schedule-visibility', () => {
  const employee: AuthenticatedUser = {
    id: 'user-1',
    roles: [UserRole.EMPLOYEE],
  };
  const manager: AuthenticatedUser = {
    id: 'manager-1',
    roles: [UserRole.MANAGER],
  };

  const scheduleWith = (
    status: ScheduleStatus,
    createdBy: string,
  ): ScheduleEntity => ({ id: 's', status, createdBy }) as ScheduleEntity;

  describe('isScheduleVisibleTo', () => {
    it('should show a published schedule to anyone', () => {
      const schedule = scheduleWith(ScheduleStatus.APPROVED, 'someone-else');

      expect(isScheduleVisibleTo(schedule, employee)).toBe(true);
    });

    it('should hide a draft from a non-owner', () => {
      const draft = scheduleWith(ScheduleStatus.DRAFT, 'another-manager');

      expect(isScheduleVisibleTo(draft, manager)).toBe(false);
    });

    it('should show a draft to the owning manager', () => {
      const draft = scheduleWith(ScheduleStatus.DRAFT, manager.id);

      expect(isScheduleVisibleTo(draft, manager)).toBe(true);
    });

    it('should hide a draft from a non-manager even if they own it', () => {
      const draft = scheduleWith(ScheduleStatus.DRAFT, employee.id);

      expect(isScheduleVisibleTo(draft, employee)).toBe(false);
    });
  });

  describe('applyScheduleVisibility', () => {
    let query: { andWhere: jest.Mock };

    const asQuery = () =>
      query as unknown as SelectQueryBuilder<ScheduleEntity>;

    beforeEach(() => {
      query = { andWhere: jest.fn().mockReturnThis() };
    });

    afterEach(() => jest.clearAllMocks());

    it('should restrict non-managers to published schedules', () => {
      applyScheduleVisibility(asQuery(), employee);

      expect(query.andWhere).toHaveBeenCalledWith(
        'schedule.status != :visibilityDraft',
        { visibilityDraft: ScheduleStatus.DRAFT },
      );
    });

    it('should also let managers see their own drafts', () => {
      applyScheduleVisibility(asQuery(), manager);

      expect(query.andWhere).toHaveBeenCalledWith(
        '(schedule.status != :visibilityDraft OR schedule.createdBy = :visibilityUserId)',
        { visibilityDraft: ScheduleStatus.DRAFT, visibilityUserId: manager.id },
      );
    });
  });
});
