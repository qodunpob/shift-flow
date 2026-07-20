import 'reflect-metadata';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ScheduleShiftsController,
  ShiftsController,
} from '../shifts.controller';
import { ShiftsService } from '../shifts.service';
import { ShiftBoardView, ShiftsBoardService } from '../shifts-board.service';
import { CreateShiftDto, UpdateShiftDto } from '../shifts.dto';
import { RolesGuard } from '@/auth/roles.guard';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { Shift, UserRole } from '@/entities';

type Controller = { prototype: Record<string, any> };
interface Endpoint {
  controller: Controller;
  handler: string;
}

describe('shifts controllers', () => {
  /**
   * Exercises the real RolesGuard against the actual controller handlers,
   * asserting the access matrix declared by the `@Roles(...)` decorators.
   * Shift mutations live on ShiftsController; creating and listing shifts of a
   * schedule live on ScheduleShiftsController.
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

    // Mutating shifts is a manager task; reading them is open to any
    // authenticated user (subject to schedule visibility in the service).
    const managerOnly: Endpoint[] = [
      { controller: ScheduleShiftsController, handler: 'create' },
      { controller: ShiftsController, handler: 'update' },
      { controller: ShiftsController, handler: 'remove' },
    ];
    const openToAny: Endpoint[] = [
      { controller: ScheduleShiftsController, handler: 'findAll' },
      { controller: ShiftsController, handler: 'findOne' },
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
   * Business rules live in ShiftsService and are covered by its own spec.
   */
  describe('Service delegation', () => {
    let scheduleShifts: ScheduleShiftsController;
    let shiftsController: ShiftsController;
    let shifts: jest.Mocked<
      Pick<ShiftsService, 'create' | 'update' | 'remove'>
    >;
    let board: jest.Mocked<
      Pick<ShiftsBoardService, 'getScheduleBoard' | 'getShift'>
    >;

    const user: AuthenticatedUser = {
      id: 'u-manager',
      roles: [UserRole.MANAGER],
    };
    const scheduleId = 'schedule-1';
    const shiftId = 'shift-1';
    // Stand-ins returned by the mocked services; identity is what we assert on.
    const shift = { id: shiftId } as Shift;
    const boardView = { id: shiftId } as unknown as ShiftBoardView;

    beforeEach(async () => {
      shifts = {
        create: jest.fn().mockResolvedValueOnce(shift),
        update: jest.fn().mockResolvedValueOnce(shift),
        remove: jest.fn().mockResolvedValueOnce(undefined),
      };
      board = {
        getScheduleBoard: jest.fn().mockResolvedValueOnce([boardView]),
        getShift: jest.fn().mockResolvedValueOnce(boardView),
      };

      const module: TestingModule = await Test.createTestingModule({
        controllers: [ScheduleShiftsController, ShiftsController],
        providers: [
          { provide: ShiftsService, useValue: shifts },
          { provide: ShiftsBoardService, useValue: board },
        ],
      }).compile();

      scheduleShifts = module.get(ScheduleShiftsController);
      shiftsController = module.get(ShiftsController);
    });

    it('should create a shift on the schedule for the current user', async () => {
      const dto: CreateShiftDto = {
        startsAt: new Date('2026-01-01T09:00:00.000Z'),
        endsAt: new Date('2026-01-01T17:00:00.000Z'),
        requiredHeadcount: 3,
      };

      await expect(
        scheduleShifts.create(scheduleId, dto, user),
      ).resolves.toStrictEqual(shift);
      expect(shifts.create).toHaveBeenCalledWith(scheduleId, dto, user);
    });

    it("should list a schedule's shifts board for the current user", async () => {
      const result = [boardView];
      board.getScheduleBoard.mockResolvedValueOnce(result);

      await expect(
        scheduleShifts.findAll(scheduleId, user),
      ).resolves.toStrictEqual(result);
      expect(board.getScheduleBoard).toHaveBeenCalledWith(scheduleId, user);
    });

    it('should return a single shift board view by its id for the current user', async () => {
      await expect(
        shiftsController.findOne(shiftId, user),
      ).resolves.toStrictEqual(boardView);
      expect(board.getShift).toHaveBeenCalledWith(shiftId, user);
    });

    it('should apply the submitted changes to an existing shift', async () => {
      const dto: UpdateShiftDto = { requiredHeadcount: 5 };

      await expect(
        shiftsController.update(shiftId, dto, user),
      ).resolves.toStrictEqual(shift);
      expect(shifts.update).toHaveBeenCalledWith(shiftId, dto, user);
    });

    it('should delete a shift for the current user without returning a body', async () => {
      await expect(
        shiftsController.remove(shiftId, user),
      ).resolves.toBeUndefined();
      expect(shifts.remove).toHaveBeenCalledWith(shiftId, user);
    });
  });
});
