import { ScheduleStatus } from '@/entities';
import {
  getAvailableActions,
  getTransition,
  isDeletable,
  isEditable,
  ScheduleAction,
  ScheduleActor,
} from '../schedule-lifecycle';

describe('schedule/schedule-lifecycle', () => {
  describe('getTransition', () => {
    const cases: Array<{
      from: ScheduleStatus;
      action: ScheduleAction;
      to: ScheduleStatus;
      actor: ScheduleActor;
    }> = [
      {
        from: ScheduleStatus.DRAFT,
        action: ScheduleAction.Publish,
        to: ScheduleStatus.IN_REVIEW,
        actor: ScheduleActor.OwnerManager,
      },
      {
        from: ScheduleStatus.IN_REVIEW,
        action: ScheduleAction.SubmitForApproval,
        to: ScheduleStatus.AWAITING_APPROVAL,
        actor: ScheduleActor.OwnerManager,
      },
      {
        from: ScheduleStatus.IN_REVIEW,
        action: ScheduleAction.Unpublish,
        to: ScheduleStatus.DRAFT,
        actor: ScheduleActor.OwnerManager,
      },
      {
        from: ScheduleStatus.AWAITING_APPROVAL,
        action: ScheduleAction.Approve,
        to: ScheduleStatus.APPROVED,
        actor: ScheduleActor.Approver,
      },
      {
        from: ScheduleStatus.AWAITING_APPROVAL,
        action: ScheduleAction.Reject,
        to: ScheduleStatus.REJECTED,
        actor: ScheduleActor.Approver,
      },
      {
        from: ScheduleStatus.AWAITING_APPROVAL,
        action: ScheduleAction.Withdraw,
        to: ScheduleStatus.IN_REVIEW,
        actor: ScheduleActor.OwnerManager,
      },
      {
        from: ScheduleStatus.REJECTED,
        action: ScheduleAction.SubmitForApproval,
        to: ScheduleStatus.AWAITING_APPROVAL,
        actor: ScheduleActor.OwnerManager,
      },
    ];

    it.each(cases)(
      'should allow $action from $from, moving to $to by $actor',
      ({ from, action, to, actor }) => {
        expect(getTransition(from, action)).toEqual({ to, actor });
      },
    );

    it('should not allow an action that is invalid for the current status', () => {
      expect(getTransition(ScheduleStatus.DRAFT, ScheduleAction.Approve)).
        toBeUndefined();
      expect(
        getTransition(ScheduleStatus.APPROVED, ScheduleAction.Unpublish),
      ).toBeUndefined();
    });

    it('should treat APPROVED as a terminal status with no transitions', () => {
      expect(getAvailableActions(ScheduleStatus.APPROVED)).toEqual([]);
    });
  });

  describe('getAvailableActions', () => {
    it('should list every action allowed from a status', () => {
      expect(getAvailableActions(ScheduleStatus.AWAITING_APPROVAL).sort()).
        toEqual(
          [
            ScheduleAction.Approve,
            ScheduleAction.Reject,
            ScheduleAction.Withdraw,
          ].sort(),
        );
    });
  });

  describe('editability and deletability', () => {
    it.each([
      [ScheduleStatus.DRAFT, true],
      [ScheduleStatus.IN_REVIEW, true],
      [ScheduleStatus.AWAITING_APPROVAL, false],
      [ScheduleStatus.APPROVED, false],
      [ScheduleStatus.REJECTED, true],
    ])('should report %s editable=%s', (status, editable) => {
      expect(isEditable(status)).toBe(editable);
    });

    it.each([
      [ScheduleStatus.DRAFT, true],
      [ScheduleStatus.IN_REVIEW, true],
      [ScheduleStatus.AWAITING_APPROVAL, false],
      [ScheduleStatus.APPROVED, false],
      [ScheduleStatus.REJECTED, true],
    ])('should report %s deletable=%s', (status, deletable) => {
      expect(isDeletable(status)).toBe(deletable);
    });
  });
});
