import { SelectQueryBuilder } from 'typeorm';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { ScheduleEntity, ScheduleStatus, UserRole } from '@/entities';

/**
 * The single source of truth for who may see a schedule: published schedules
 * are visible to everyone; drafts are visible only to the manager who owns
 * them. Exposed in two forms that must stay in sync — a predicate for a loaded
 * schedule and a query contributor for listing.
 */
export function isScheduleVisibleTo(
  schedule: ScheduleEntity,
  user: AuthenticatedUser,
): boolean {
  if (schedule.status !== ScheduleStatus.DRAFT) {
    return true;
  }
  return (
    user.roles.includes(UserRole.MANAGER) && schedule.createdBy === user.id
  );
}

/**
 * Applies the visibility rule to a query builder. Uses `andWhere` so it
 * composes with any other conditions regardless of call order. The builder
 * must alias the schedule table as `schedule`.
 */
export function applyScheduleVisibility(
  query: SelectQueryBuilder<ScheduleEntity>,
  user: AuthenticatedUser,
): void {
  if (user.roles.includes(UserRole.MANAGER)) {
    query.andWhere(
      '(schedule.status != :visibilityDraft OR schedule.createdBy = :visibilityUserId)',
      { visibilityDraft: ScheduleStatus.DRAFT, visibilityUserId: user.id },
    );
  } else {
    query.andWhere('schedule.status != :visibilityDraft', {
      visibilityDraft: ScheduleStatus.DRAFT,
    });
  }
}
