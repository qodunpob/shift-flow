import 'reflect-metadata';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ShiftsController } from '../shifts.controller';
import { ShiftsService } from '../shifts.service';
import { CreateShiftDto, UpdateShiftDto } from '../shifts.dto';
import { RolesGuard } from '@/auth/roles.guard';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { Shift, UserRole } from '@/entities';

describe('shifts/ShiftsController', () => {
  /**
   * Exercises the real RolesGuard against the actual ShiftsController handlers,
   * asserting the access matrix declared by the `@Roles(...)` decorators.
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

    type HandlerName = keyof ShiftsController;

    const createContext = (
      handlerName: HandlerName,
      user?: AuthenticatedUser,
    ): ExecutionContext =>
      ({
        getHandler: () => ShiftsController.prototype[handlerName],
        getClass: () => ShiftsController,
        switchToHttp: () => ({
          getRequest: () => ({ user }),
        }),
      }) as unknown as ExecutionContext;

    const canAccess = (
      handlerName: HandlerName,
      user?: AuthenticatedUser,
    ): boolean => guard.canActivate(createContext(handlerName, user));

    beforeEach(() => {
      guard = new RolesGuard(new Reflector());
    });

    // Mutating a schedule's shifts is a manager task; reading them is open to
    // any authenticated user (subject to schedule visibility in the service).
    const managerOnly: HandlerName[] = ['create', 'update', 'remove'];
    const openToAny: HandlerName[] = ['findAll', 'findOne'];

    describe('manager-only endpoints', () => {
      it.each(managerOnly)('should allow a manager to call %s', (handler) => {
        expect(canAccess(handler, manager)).toBe(true);
      });

      it.each(managerOnly)(
        'should reject an approver calling %s',
        (handler) => {
          expect(() => canAccess(handler, approver)).toThrow(
            UnauthorizedException,
          );
        },
      );

      it.each(managerOnly)(
        'should reject a user without roles calling %s',
        (handler) => {
          expect(() => canAccess(handler, noRoles)).toThrow(
            UnauthorizedException,
          );
        },
      );

      it.each(managerOnly)(
        'should reject %s when no user is present',
        (handler) => {
          expect(() => canAccess(handler, undefined)).toThrow(
            UnauthorizedException,
          );
        },
      );
    });

    describe('endpoints open to any authenticated user', () => {
      it.each(openToAny)('should allow a manager to call %s', (handler) => {
        expect(canAccess(handler, manager)).toBe(true);
      });

      it.each(openToAny)('should allow an approver to call %s', (handler) => {
        expect(canAccess(handler, approver)).toBe(true);
      });

      it.each(openToAny)(
        'should allow a user without roles to call %s',
        (handler) => {
          expect(canAccess(handler, noRoles)).toBe(true);
        },
      );
    });
  });

  /**
   * Verifies the controller is a thin pass-through: each handler forwards to
   * the service with the expected arguments and returns what it returns.
   * Business rules live in ShiftsService and are covered by its own spec.
   */
  describe('Service delegation', () => {
    let controller: ShiftsController;
    let shifts: jest.Mocked<
      Pick<ShiftsService, 'create' | 'findAll' | 'findOne' | 'update' | 'remove'>
    >;

    const user: AuthenticatedUser = {
      id: 'u-manager',
      roles: [UserRole.MANAGER],
    };
    const scheduleId = 'schedule-1';
    const shiftId = 'shift-1';
    // A stand-in returned by the mocked service; identity is what we assert on.
    const shift = { id: shiftId } as Shift;

    beforeEach(async () => {
      shifts = {
        create: jest.fn().mockResolvedValue(shift),
        findAll: jest.fn().mockResolvedValue([shift]),
        findOne: jest.fn().mockResolvedValue(shift),
        update: jest.fn().mockResolvedValue(shift),
        remove: jest.fn().mockResolvedValue(undefined),
      };

      const module: TestingModule = await Test.createTestingModule({
        controllers: [ShiftsController],
        providers: [{ provide: ShiftsService, useValue: shifts }],
      }).compile();

      controller = module.get(ShiftsController);
    });

    it('should create a shift on the schedule for the current user', async () => {
      const dto: CreateShiftDto = {
        startsAt: new Date('2026-01-01T09:00:00.000Z'),
        endsAt: new Date('2026-01-01T17:00:00.000Z'),
        requiredHeadcount: 3,
      };

      await expect(controller.create(scheduleId, dto, user)).resolves.toBe(
        shift,
      );
      expect(shifts.create).toHaveBeenCalledWith(scheduleId, dto, user);
    });

    it("should list a schedule's shifts for the current user", async () => {
      const result = [shift];
      shifts.findAll.mockResolvedValue(result);

      await expect(controller.findAll(scheduleId, user)).resolves.toBe(result);
      expect(shifts.findAll).toHaveBeenCalledWith(scheduleId, user);
    });

    it('should return a single shift by its id for the current user', async () => {
      await expect(
        controller.findOne(scheduleId, shiftId, user),
      ).resolves.toBe(shift);
      expect(shifts.findOne).toHaveBeenCalledWith(scheduleId, shiftId, user);
    });

    it('should apply the submitted changes to an existing shift', async () => {
      const dto: UpdateShiftDto = { requiredHeadcount: 5 };

      await expect(
        controller.update(scheduleId, shiftId, dto, user),
      ).resolves.toBe(shift);
      expect(shifts.update).toHaveBeenCalledWith(
        scheduleId,
        shiftId,
        dto,
        user,
      );
    });

    it('should delete a shift for the current user without returning a body', async () => {
      await expect(
        controller.remove(scheduleId, shiftId, user),
      ).resolves.toBeUndefined();
      expect(shifts.remove).toHaveBeenCalledWith(scheduleId, shiftId, user);
    });
  });
});
