import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignmentStatus, Schedule, Shift } from '@/entities';

/** Aggregate headcount figures derived from all shifts of a schedule. */
export interface ScheduleStats {
  /** Sum of requiredHeadcount across every shift in the schedule. */
  totalRequiredHeadcount: number;
  /** Assignments that have not been declined, across every shift. */
  totalFilledCount: number;
  /** Assignments in the ACCEPTED state, across every shift. */
  totalAcceptedCount: number;
}

/** A schedule enriched with its derived headcount figures. */
export type ScheduleView = Schedule & ScheduleStats;

const ZERO_STATS: ScheduleStats = {
  totalRequiredHeadcount: 0,
  totalFilledCount: 0,
  totalAcceptedCount: 0,
};

@Injectable()
export class ScheduleStatsService {
  constructor(
    @InjectRepository(Shift)
    private readonly shifts: Repository<Shift>,
  ) {}

  /**
   * Computes the headcount totals for the given schedules in bulk, keyed by
   * schedule id. Schedules that have no shifts are absent from the map; use
   * {@link withStats} so those fall back to zeroed figures.
   *
   * The figures are gathered in two queries on purpose: requiredHeadcount is a
   * per-shift value, so summing it in the same query that joins the one-to-many
   * assignments would inflate it once per assignment. Both queries go through
   * the repository builder, so soft-deleted shifts and assignments are excluded.
   */
  async statsFor(scheduleIds: string[]): Promise<Map<string, ScheduleStats>> {
    const stats = new Map<string, ScheduleStats>();
    if (scheduleIds.length === 0) {
      return stats;
    }

    const headcounts = await this.shifts
      .createQueryBuilder('shift')
      .select('shift.scheduleId', 'scheduleId')
      .addSelect('COALESCE(SUM(shift.requiredHeadcount), 0)', 'total')
      .where('shift.scheduleId IN (:...scheduleIds)', { scheduleIds })
      .groupBy('shift.scheduleId')
      .getRawMany<{ scheduleId: string; total: string }>();

    const assignmentCounts = await this.shifts
      .createQueryBuilder('shift')
      .leftJoin('shift.assignments', 'assignment')
      .select('shift.scheduleId', 'scheduleId')
      .addSelect(
        'COUNT(assignment.id) FILTER (WHERE assignment.status != :declined)',
        'filled',
      )
      .addSelect(
        'COUNT(assignment.id) FILTER (WHERE assignment.status = :accepted)',
        'accepted',
      )
      .where('shift.scheduleId IN (:...scheduleIds)', { scheduleIds })
      .setParameters({
        declined: AssignmentStatus.DECLINED,
        accepted: AssignmentStatus.ACCEPTED,
      })
      .groupBy('shift.scheduleId')
      .getRawMany<{ scheduleId: string; filled: string; accepted: string }>();

    for (const row of headcounts) {
      stats.set(row.scheduleId, {
        ...ZERO_STATS,
        totalRequiredHeadcount: Number(row.total),
      });
    }

    for (const row of assignmentCounts) {
      stats.set(row.scheduleId, {
        ...(stats.get(row.scheduleId) ?? ZERO_STATS),
        totalFilledCount: Number(row.filled),
        totalAcceptedCount: Number(row.accepted),
      });
    }

    return stats;
  }

  /** Attaches the totals to a schedule, defaulting to zero when it has none. */
  withStats(
    schedule: Schedule,
    stats: Map<string, ScheduleStats>,
  ): ScheduleView {
    return { ...schedule, ...(stats.get(schedule.id) ?? ZERO_STATS) };
  }
}
