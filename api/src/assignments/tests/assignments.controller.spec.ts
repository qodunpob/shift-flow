import 'reflect-metadata';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AssignmentsController,
  ShiftAssignmentsController,
} from '../assignments.controller';
import { AssignmentsService } from '../assignments.service';
import { CreateAssignmentDto, DeclineAssignmentDto } from '../assignments.dto';
import { RolesGuard } from '@/auth/roles.guard';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { Assignment, UserRole } from '@/entities';

type Controller = { prototype: Record<string, any> };
interface Endpoint {
  controller: Controller;
  handler: string;
}

describe('assignments controllers', () => {
  /**
   * Exercises the real RolesGuard against the actual controller handlers,
   * asserting the access matrix declared by the `@Roles(...)` decorators.
   * Creating and deleting assignments is a manager task; responding
   * (accept/decline) is open to any authenticated user.
   */
  describe('Access control', () => {
    let guard: RolesGuard;

    const manager: AuthenticatedUser = {
      id: 'u-manager',
      roles: [UserRole.MANAGER],
    };
    const approver: AuthenticatedUser = {
      id: 'u-approver',
      roles: [UserRole.APPROVER],
    };
    const noRoles: AuthenticatedUser = { id: 'u-none', roles: [] };

    const createContext = (
      { controller, handler }: Endpoint,
      user?: AuthenticatedUser,
    ): ExecutionContext =>
      ({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        getHandler: () => controller.prototype[handler],
        getClass: () => controller,
        switchToHttp: () => ({
          getRequest: () => ({ user }),
        }),
      }) as unknown as ExecutionContext;

    const canAccess = (endpoint: Endpoint, user?: AuthenticatedUser): boolean =>
      guard.canActivate(createContext(endpoint, user));

    beforeEach(() => {
      guard = new RolesGuard(new Reflector());
    });

    const managerOnly: Endpoint[] = [
      { controller: ShiftAssignmentsController, handler: 'create' },
      { controller: AssignmentsController, handler: 'remove' },
    ];
    const openToAny: Endpoint[] = [
      { controller: AssignmentsController, handler: 'accept' },
      { controller: AssignmentsController, handler: 'decline' },
    ];

    describe('manager-only endpoints', () => {
      it.each(managerOnly)('should allow a manager to call $handler', (ep) => {
        expect(canAccess(ep, manager)).toBe(true);
      });

      it.each(managerOnly)(
        'should reject an approver calling $handler',
        (ep) => {
          expect(() => canAccess(ep, approver)).toThrow(ForbiddenException);
        },
      );

      it.each(managerOnly)(
        'should reject a user without roles calling $handler',
        (ep) => {
          expect(() => canAccess(ep, noRoles)).toThrow(ForbiddenException);
        },
      );
    });

    describe('endpoints open to any authenticated user', () => {
      it.each(openToAny)('should allow a manager to call $handler', (ep) => {
        expect(canAccess(ep, manager)).toBe(true);
      });

      it.each(openToAny)('should allow an approver to call $handler', (ep) => {
        expect(canAccess(ep, approver)).toBe(true);
      });

      it.each(openToAny)(
        'should allow a user without roles to call $handler',
        (ep) => {
          expect(canAccess(ep, noRoles)).toBe(true);
        },
      );
    });
  });

  /**
   * Verifies the controllers are thin pass-throughs: each handler forwards to
   * the service with the expected arguments and returns what it returns.
   * Business rules live in AssignmentsService and are covered by its own spec.
   */
  describe('Service delegation', () => {
    let shiftAssignments: ShiftAssignmentsController;
    let assignmentsController: AssignmentsController;
    let assignments: jest.Mocked<
      Pick<AssignmentsService, 'create' | 'remove' | 'accept' | 'decline'>
    >;

    const user: AuthenticatedUser = {
      id: 'u-manager',
      roles: [UserRole.MANAGER],
    };
    const shiftId = 'shift-1';
    const assignmentId = 'assignment-1';
    // A stand-in returned by the mocked service; identity is what we assert on.
    const assignment = { id: assignmentId } as Assignment;

    beforeEach(async () => {
      assignments = {
        create: jest.fn().mockResolvedValue(assignment),
        remove: jest.fn().mockResolvedValue(undefined),
        accept: jest.fn().mockResolvedValue(assignment),
        decline: jest.fn().mockResolvedValue(assignment),
      };

      const module: TestingModule = await Test.createTestingModule({
        controllers: [ShiftAssignmentsController, AssignmentsController],
        providers: [{ provide: AssignmentsService, useValue: assignments }],
      }).compile();

      shiftAssignments = module.get(ShiftAssignmentsController);
      assignmentsController = module.get(AssignmentsController);
    });

    it('should create an assignment on the shift for the current user', async () => {
      const dto: CreateAssignmentDto = { employeeId: 'employee-1' };

      await expect(shiftAssignments.create(shiftId, dto, user)).resolves.toBe(
        assignment,
      );
      expect(assignments.create).toHaveBeenCalledWith(shiftId, dto, user);
    });

    it('should delete an assignment for the current user without returning a body', async () => {
      await expect(
        assignmentsController.remove(assignmentId, user),
      ).resolves.toBeUndefined();
      expect(assignments.remove).toHaveBeenCalledWith(assignmentId, user);
    });

    it('should accept an assignment on behalf of the current user', async () => {
      await expect(
        assignmentsController.accept(assignmentId, user),
      ).resolves.toBe(assignment);
      expect(assignments.accept).toHaveBeenCalledWith(assignmentId, user);
    });

    it('should decline an assignment with the supplied reason for the current user', async () => {
      const dto: DeclineAssignmentDto = { declineReason: 'On holiday' };

      await expect(
        assignmentsController.decline(assignmentId, dto, user),
      ).resolves.toBe(assignment);
      expect(assignments.decline).toHaveBeenCalledWith(assignmentId, dto, user);
    });
  });
});
