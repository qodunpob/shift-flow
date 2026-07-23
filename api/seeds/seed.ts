import 'reflect-metadata';
import dataSource from '../datasource';
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
import { hashPassword } from '@/utils/password';

/**
 * Standalone database seed. Wipes the domain tables and inserts a small but
 * varied dataset: 6 users (3 employees, 2 managers, 1 approver), schedules in
 * every lifecycle status, shifts, and assignments/proposals in different
 * states. Re-runnable.
 *
 * Prerequisite: run migrations first (`npm run migration:run`).
 * Dev accounts log in with password === email address.
 */

type SeedUser = {
  id: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  roles: UserRole[];
};

// Fixed ids so logins and references stay predictable across re-seeds.
const SEED_USERS: SeedUser[] = [
  // Employees
  {
    id: '00000000-0000-4000-8000-000000000000',
    firstName: 'Emma',
    lastName: 'Employee',
    emailAddress: 'test-employee@example.com',
    roles: [UserRole.EMPLOYEE],
  },
  {
    id: '11111111-1111-4111-8111-111111111111',
    firstName: 'Ethan',
    lastName: 'Employee',
    emailAddress: 'test-employee2@example.com',
    roles: [UserRole.EMPLOYEE],
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    firstName: 'Ava',
    lastName: 'Employee',
    emailAddress: 'test-employee3@example.com',
    roles: [UserRole.EMPLOYEE],
  },
  // Managers
  {
    id: '33333333-3333-4333-8333-333333333333',
    firstName: 'Mia',
    lastName: 'Manager',
    emailAddress: 'test-manager@example.com',
    roles: [UserRole.MANAGER],
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    firstName: 'Max',
    lastName: 'Manager',
    emailAddress: 'test-manager2@example.com',
    roles: [UserRole.MANAGER],
  },
  // Approver
  {
    id: '55555555-5555-4555-8555-555555555555',
    firstName: 'Aiden',
    lastName: 'Approver',
    emailAddress: 'test-approver@example.com',
    roles: [UserRole.APPROVER],
  },
];

const at = (iso: string) => new Date(iso);

async function seed() {
  await dataSource.initialize();
  try {
    // FK-safe wipe so the seed can be run repeatedly.
    await dataSource.query(
      'TRUNCATE TABLE "assignments", "assignment_proposals", "shifts", "schedules", "users" RESTART IDENTITY CASCADE',
    );

    const users = dataSource.getRepository(UserEntity);
    const schedules = dataSource.getRepository(ScheduleEntity);
    const shifts = dataSource.getRepository(ShiftEntity);
    const assignments = dataSource.getRepository(AssignmentEntity);
    const proposals = dataSource.getRepository(AssignmentProposalEntity);

    // --- Users -------------------------------------------------------------
    await users.save(
      await Promise.all(
        SEED_USERS.map(async (u) =>
          users.create({
            ...u,
            password: await hashPassword(u.emailAddress),
            createdBy: u.id,
            updatedBy: u.id,
          }),
        ),
      ),
    );

    const [emma, ethan, ava, mia, max, aiden] = SEED_USERS.map((u) => u.id);
    void aiden; // approver has no authored data in this seed

    // --- Schedules (one per lifecycle status) ------------------------------
    const draft = await schedules.save(
      schedules.create({
        label: 'Week 30 — Draft',
        startsAt: at('2026-07-20T00:00:00.000+09:00'),
        endsAt: at('2026-07-26T23:59:59.999+09:00'),
        status: ScheduleStatus.DRAFT,
        createdBy: mia,
        updatedBy: mia,
      }),
    );
    const inReview = await schedules.save(
      schedules.create({
        label: 'Week 31 — In Review',
        startsAt: at('2026-07-27T00:00:00.000+09:00'),
        endsAt: at('2026-08-02T23:59:59.999+09:00'),
        status: ScheduleStatus.IN_REVIEW,
        createdBy: mia,
        updatedBy: mia,
      }),
    );
    const awaiting = await schedules.save(
      schedules.create({
        label: 'Week 32 — Awaiting Approval',
        startsAt: at('2026-08-03T00:00:00.000+09:00'),
        endsAt: at('2026-08-09T23:59:59.999+09:00'),
        status: ScheduleStatus.AWAITING_APPROVAL,
        createdBy: max,
        updatedBy: max,
      }),
    );
    const approved = await schedules.save(
      schedules.create({
        label: 'Week 33 — Approved',
        startsAt: at('2026-08-10T00:00:00.000+09:00'),
        endsAt: at('2026-08-16T23:59:59.999+09:00'),
        status: ScheduleStatus.APPROVED,
        createdBy: max,
        updatedBy: max,
      }),
    );
    const rejected = await schedules.save(
      schedules.create({
        label: 'Week 29 — Rejected',
        startsAt: at('2026-07-13T00:00:00.000+09:00'),
        endsAt: at('2026-07-19T23:59:59.999+09:00'),
        status: ScheduleStatus.REJECTED,
        rejectionReason: 'Not enough weekend coverage — please revise.',
        createdBy: mia,
        updatedBy: mia,
      }),
    );

    // --- Shifts ------------------------------------------------------------
    const makeShift = (
      scheduleId: string,
      manager: string,
      startsAt: string,
      endsAt: string,
      requiredHeadcount: number,
    ) =>
      shifts.save(
        shifts.create({
          scheduleId,
          startsAt: at(startsAt),
          endsAt: at(endsAt),
          requiredHeadcount,
          createdBy: manager,
          updatedBy: manager,
        }),
      );

    const draftShift = await makeShift(
      draft.id,
      mia,
      '2026-07-21T09:00:00.000+09:00',
      '2026-07-21T17:00:00.000+09:00',
      2,
    );
    const reviewMorning = await makeShift(
      inReview.id,
      mia,
      '2026-07-28T06:00:00.000+09:00',
      '2026-07-28T14:00:00.000+09:00',
      2,
    );
    const reviewEvening = await makeShift(
      inReview.id,
      mia,
      '2026-07-28T14:00:00.000+09:00',
      '2026-07-28T22:00:00.000+09:00',
      3,
    );
    const awaitingShift = await makeShift(
      awaiting.id,
      max,
      '2026-08-04T09:00:00.000+09:00',
      '2026-08-04T17:00:00.000+09:00',
      3,
    );
    const approvedShift = await makeShift(
      approved.id,
      max,
      '2026-08-11T09:00:00.000+09:00',
      '2026-08-11T17:00:00.000+09:00',
      2,
    );
    const rejectedShift = await makeShift(
      rejected.id,
      mia,
      '2026-07-18T09:00:00.000+09:00',
      '2026-07-18T17:00:00.000+09:00',
      2,
    );

    // --- Assignments (PENDING / ACCEPTED / DECLINED) -----------------------
    // updatedBy reflects who last touched it: the manager for pending offers,
    // the employee once they accept or decline.
    const makeAssignment = (
      shiftId: string,
      employeeId: string,
      status: AssignmentStatus,
      manager: string,
      declineReason: string | null = null,
    ) =>
      assignments.save(
        assignments.create({
          shiftId,
          employeeId,
          status,
          declineReason,
          createdBy: manager,
          updatedBy: status === AssignmentStatus.PENDING ? manager : employeeId,
        }),
      );

    await makeAssignment(draftShift.id, emma, AssignmentStatus.PENDING, mia);
    await makeAssignment(
      reviewMorning.id,
      emma,
      AssignmentStatus.ACCEPTED,
      mia,
    );
    await makeAssignment(
      awaitingShift.id,
      emma,
      AssignmentStatus.ACCEPTED,
      max,
    );
    await makeAssignment(
      awaitingShift.id,
      ethan,
      AssignmentStatus.DECLINED,
      max,
      'On leave that week.',
    );
    await makeAssignment(approvedShift.id, ava, AssignmentStatus.ACCEPTED, max);
    await makeAssignment(
      rejectedShift.id,
      ava,
      AssignmentStatus.DECLINED,
      mia,
      'Double-booked with another site.',
    );

    // --- Proposals ---------------------------------------------------------
    // Proposals have no status column; they are employee offers to work a
    // shift. An open proposal has deletedAt = null; a fulfilled one is
    // soft-deleted (consumed when the manager turns it into an assignment).
    const makeProposal = (
      shiftId: string,
      employeeId: string,
      message: string | null,
    ) =>
      proposals.save(
        proposals.create({
          shiftId,
          employeeId,
          message,
          createdBy: employeeId,
          updatedBy: employeeId,
        }),
      );

    // Open proposals awaiting a manager decision.
    await makeProposal(draftShift.id, ethan, 'Happy to take this one.');
    await makeProposal(reviewEvening.id, ava, 'Available all evening.');
    await makeProposal(reviewEvening.id, ethan, null);

    // A consumed proposal: fulfilled into the ACCEPTED assignment below.
    const consumed = await makeProposal(
      approvedShift.id,
      emma,
      'I proposed this and it was accepted.',
    );
    await makeAssignment(
      approvedShift.id,
      emma,
      AssignmentStatus.ACCEPTED,
      max,
    );
    await proposals.softDelete(consumed.id);

    console.log('Seed complete:');
    console.log(`  users:       ${await users.count()}`);
    console.log(`  schedules:   ${await schedules.count()}`);
    console.log(`  shifts:      ${await shifts.count()}`);
    console.log(`  assignments: ${await assignments.count()}`);
    console.log(
      `  proposals:   ${await proposals.count()} open (+1 consumed/soft-deleted)`,
    );
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
