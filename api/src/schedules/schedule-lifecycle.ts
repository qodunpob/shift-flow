import { ScheduleStatus } from '@/entities';

/** Actions that drive a schedule from one status to the next. */
export enum ScheduleAction {
  Publish = 'publish',
  SubmitForApproval = 'submitForApproval',
  Unpublish = 'unpublish',
  Approve = 'approve',
  Reject = 'reject',
  Withdraw = 'withdraw',
}

/** Who is allowed to perform a given transition. */
export enum ScheduleActor {
  /** The manager who owns (created) the schedule. */
  OwnerManager = 'OWNER_MANAGER',
  /** Any user with the approver role. */
  Approver = 'APPROVER',
}

export interface Transition {
  to: ScheduleStatus;
  actor: ScheduleActor;
}

/**
 * The schedule lifecycle, expressed as a transition table:
 * `status -> action -> { resulting status, required actor }`.
 * A status with no entry for an action cannot perform it, and APPROVED is
 * terminal (no outgoing transitions).
 */
const TRANSITIONS: Record<
  ScheduleStatus,
  Partial<Record<ScheduleAction, Transition>>
> = {
  [ScheduleStatus.DRAFT]: {
    [ScheduleAction.Publish]: {
      to: ScheduleStatus.IN_REVIEW,
      actor: ScheduleActor.OwnerManager,
    },
  },
  [ScheduleStatus.IN_REVIEW]: {
    [ScheduleAction.SubmitForApproval]: {
      to: ScheduleStatus.AWAITING_APPROVAL,
      actor: ScheduleActor.OwnerManager,
    },
    [ScheduleAction.Unpublish]: {
      to: ScheduleStatus.DRAFT,
      actor: ScheduleActor.OwnerManager,
    },
  },
  [ScheduleStatus.AWAITING_APPROVAL]: {
    [ScheduleAction.Approve]: {
      to: ScheduleStatus.APPROVED,
      actor: ScheduleActor.Approver,
    },
    [ScheduleAction.Reject]: {
      to: ScheduleStatus.REJECTED,
      actor: ScheduleActor.Approver,
    },
    [ScheduleAction.Withdraw]: {
      to: ScheduleStatus.IN_REVIEW,
      actor: ScheduleActor.OwnerManager,
    },
  },
  [ScheduleStatus.APPROVED]: {},
  [ScheduleStatus.REJECTED]: {
    [ScheduleAction.SubmitForApproval]: {
      to: ScheduleStatus.AWAITING_APPROVAL,
      actor: ScheduleActor.OwnerManager,
    },
  },
};

/** Statuses in which a schedule may be updated or deleted. */
const EDITABLE_STATUSES: ReadonlySet<ScheduleStatus> = new Set([
  ScheduleStatus.DRAFT,
  ScheduleStatus.IN_REVIEW,
  ScheduleStatus.REJECTED,
]);

/**
 * Returns the transition for `action` from `status`, or `undefined` when the
 * action is not allowed in that status.
 */
export function getTransition(
  status: ScheduleStatus,
  action: ScheduleAction,
): Transition | undefined {
  return TRANSITIONS[status][action];
}

/** Lists the actions available from a given status. */
export function getAvailableActions(status: ScheduleStatus): ScheduleAction[] {
  return Object.keys(TRANSITIONS[status]) as ScheduleAction[];
}

export function isEditable(status: ScheduleStatus): boolean {
  return EDITABLE_STATUSES.has(status);
}
