import 'reflect-metadata';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AssignmentProposalsController,
  ShiftAssignmentProposalsController,
} from '../assignment-proposals.controller';
import { AssignmentProposalsService } from '../assignment-proposals.service';
import {
  CreateAssignmentProposalDto,
  UpdateAssignmentProposalDto,
} from '../assignment-proposal.dto';
import { RolesGuard } from '@/auth/roles.guard';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { AssignmentProposalEntity, UserRole } from '@/entities';

type Controller = { prototype: Record<string, any> };
interface Endpoint {
  controller: Controller;
  handler: string;
}

describe('assignment-proposals/controllers', () => {
  /**
   * Exercises the real RolesGuard against the actual controller handlers,
   * asserting the access matrix declared by the `@Roles(...)` decorators.
   * Employees propose, edit and withdraw their own proposals (open to any
   * authenticated user); accepting and declining are manager decisions.
   */
  describe('Access control', () => {
    let guard: RolesGuard;

    const employee: AuthenticatedUser = {
      id: 'u-employee',
      roles: [UserRole.EMPLOYEE],
    };
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
      { controller: AssignmentProposalsController, handler: 'accept' },
      { controller: AssignmentProposalsController, handler: 'decline' },
    ];
    const employeeOnly: Endpoint[] = [
      { controller: ShiftAssignmentProposalsController, handler: 'create' },
      { controller: AssignmentProposalsController, handler: 'update' },
      { controller: AssignmentProposalsController, handler: 'delete' },
    ];

    describe('manager-only endpoints', () => {
      it.each(managerOnly)(
        'should reject an employee calling $handler',
        (ep) => {
          expect(() => canAccess(ep, employee)).toThrow(ForbiddenException);
        },
      );

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

    describe('employee only endpoints', () => {
      it.each(employeeOnly)(
        'should allow an employee to call $handler',
        (ep) => {
          expect(canAccess(ep, employee)).toBe(true);
        },
      );

      it.each(employeeOnly)(
        'should reject a manager calling $handler',
        (ep) => {
          expect(() => canAccess(ep, manager)).toThrow(ForbiddenException);
        },
      );

      it.each(employeeOnly)(
        'should reject an approver calling $handler',
        (ep) => {
          expect(() => canAccess(ep, approver)).toThrow(ForbiddenException);
        },
      );

      it.each(employeeOnly)(
        'should reject a user without roles calling $handler',
        (ep) => {
          expect(() => canAccess(ep, noRoles)).toThrow(ForbiddenException);
        },
      );
    });
  });

  /**
   * Verifies the controllers are thin pass-throughs: each handler forwards to
   * the service with the expected arguments and returns what it returns.
   * Business rules live in AssignmentProposalsService and are covered by its
   * own spec.
   */
  describe('Service delegation', () => {
    let shiftProposals: ShiftAssignmentProposalsController;
    let proposalsController: AssignmentProposalsController;
    let proposals: jest.Mocked<
      Pick<
        AssignmentProposalsService,
        'create' | 'update' | 'remove' | 'accept' | 'decline'
      >
    >;

    const user: AuthenticatedUser = { id: 'u-employee', roles: [] };
    const shiftId = 'shift-1';
    const proposalId = 'proposal-1';
    // A stand-in returned by the mocked service; identity is what we assert on.
    const proposal = { id: proposalId } as AssignmentProposalEntity;

    beforeEach(async () => {
      proposals = {
        create: jest.fn().mockResolvedValue(proposal),
        update: jest.fn().mockResolvedValue(proposal),
        remove: jest.fn().mockResolvedValue(undefined),
        accept: jest.fn().mockResolvedValue(undefined),
        decline: jest.fn().mockResolvedValue(undefined),
      };

      const module: TestingModule = await Test.createTestingModule({
        controllers: [
          ShiftAssignmentProposalsController,
          AssignmentProposalsController,
        ],
        providers: [
          { provide: AssignmentProposalsService, useValue: proposals },
        ],
      }).compile();

      shiftProposals = module.get(ShiftAssignmentProposalsController);
      proposalsController = module.get(AssignmentProposalsController);
    });

    it('should create a proposal on the shift for the current user', async () => {
      const dto: CreateAssignmentProposalDto = { message: 'Please add me' };

      await expect(shiftProposals.create(shiftId, dto, user)).resolves.toBe(
        proposal,
      );
      expect(proposals.create).toHaveBeenCalledWith(shiftId, dto, user);
    });

    it('should apply the submitted changes to an existing proposal', async () => {
      const dto: UpdateAssignmentProposalDto = { message: 'Updated' };

      await expect(
        proposalsController.update(proposalId, dto, user),
      ).resolves.toBe(proposal);
      expect(proposals.update).toHaveBeenCalledWith(proposalId, dto, user);
    });

    it('should delete a proposal for the current user', async () => {
      await expect(
        proposalsController.delete(proposalId, user),
      ).resolves.toBeUndefined();
      // The DELETE handler forwards to the service's remove method.
      expect(proposals.remove).toHaveBeenCalledWith(proposalId, user);
    });

    it('should accept a proposal on behalf of the current user', async () => {
      await expect(
        proposalsController.accept(proposalId, user),
      ).resolves.toBeUndefined();
      expect(proposals.accept).toHaveBeenCalledWith(proposalId, user);
    });

    it('should decline a proposal on behalf of the current user', async () => {
      await expect(
        proposalsController.decline(proposalId, user),
      ).resolves.toBeUndefined();
      expect(proposals.decline).toHaveBeenCalledWith(proposalId, user);
    });
  });
});
