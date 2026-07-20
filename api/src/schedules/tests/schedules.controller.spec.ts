import 'reflect-metadata';
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { SchedulesController } from '../schedules.controller';
import { SchedulesService } from '../schedules.service';
import { SchedulesTransitionService } from '../schedules-transition.service';
import { RolesGuard } from '@/auth/roles.guard';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { Schedule, UserRole } from '@/entities';
import {
  CreateScheduleDto,
  FindSchedulesQueryDto,
  RejectScheduleDto,
  UpdateScheduleDto,
} from '../schedules.dto';

describe('schedules/SchedulesController', () => {
  /**
   * These tests exercise the real RolesGuard against the actual
   * SchedulesController handlers, so they assert the access matrix that the
   * `@Roles(...)` decorators declare on each endpoint.
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
    const both: AuthenticatedUser = {
      id: 'u-both',
      roles: [UserRole.MANAGER, UserRole.APPROVER],
    };
    const noRoles: AuthenticatedUser = { id: 'u-none', roles: [] };

    type HandlerName = keyof SchedulesController;

    const createContext = (
      handlerName: HandlerName,
      user?: AuthenticatedUser,
    ): ExecutionContext =>
      ({
        getHandler: () => SchedulesController.prototype[handlerName],
        getClass: () => SchedulesController,
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

    // handler -> the single role the endpoint requires (undefined = any authenticated user)
    const managerOnly: HandlerName[] = [
      'create',
      'update',
      'remove',
      'publish',
      'submitForApproval',
      'unpublish',
      'withdraw',
    ];
    const approverOnly: HandlerName[] = ['approve', 'reject'];
    const openToAny: HandlerName[] = ['findAll', 'findOne'];

    describe('manager-only endpoints', () => {
      it.each(managerOnly)('allows a manager to call %s', (handler) => {
        expect(canAccess(handler, manager)).toBe(true);
      });

      it.each(managerOnly)(
        'should allow a user holding both roles to call %s',
        (handler) => {
          expect(canAccess(handler, both)).toBe(true);
        },
      );

      it.each(managerOnly)(
        'should reject an approver calling %s',
        (handler) => {
          expect(() => canAccess(handler, approver)).toThrow(
            ForbiddenException,
          );
        },
      );

      it.each(managerOnly)(
        'should reject a user without roles calling %s',
        (handler) => {
          expect(() => canAccess(handler, noRoles)).toThrow(ForbiddenException);
        },
      );
    });

    describe('approver-only endpoints', () => {
      it.each(approverOnly)(
        'should allow an approver to call %s',
        (handler) => {
          expect(canAccess(handler, approver)).toBe(true);
        },
      );

      it.each(approverOnly)(
        'should allow a user holding both roles to call %s',
        (handler) => {
          expect(canAccess(handler, both)).toBe(true);
        },
      );

      it.each(approverOnly)('should reject a manager calling %s', (handler) => {
        expect(() => canAccess(handler, manager)).toThrow(ForbiddenException);
      });

      it.each(approverOnly)(
        'should reject a user without roles calling %s',
        (handler) => {
          expect(() => canAccess(handler, noRoles)).toThrow(ForbiddenException);
        },
      );
    });

    describe('endpoints open to any authenticated user', () => {
      it.each(openToAny)('allows a manager to call %s', (handler) => {
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

    it('should reject a role-restricted endpoint when no user is present', () => {
      expect(() => canAccess('create', undefined)).toThrow(
        UnauthorizedException,
      );
    });
  });

  /**
   * These tests verify the controller is a thin pass-through: each handler
   * forwards to the correct service method with the expected arguments and
   * returns whatever the service returns. Business rules live in the services
   * and are covered by their own specs.
   */
  describe('Service delegation', () => {
    let controller: SchedulesController;
    let schedules: jest.Mocked<
      Pick<
        SchedulesService,
        'create' | 'findAll' | 'findOne' | 'update' | 'remove'
      >
    >;
    let transitions: jest.Mocked<
      Pick<
        SchedulesTransitionService,
        | 'publish'
        | 'submitForApproval'
        | 'unpublish'
        | 'withdraw'
        | 'approve'
        | 'reject'
      >
    >;

    const user: AuthenticatedUser = {
      id: 'u-manager',
      roles: [UserRole.MANAGER],
    };
    const scheduleId = 'schedule-1';
    // A stand-in returned by the mocked services; identity is what we assert on.
    const schedule = { id: scheduleId } as Schedule;

    beforeEach(async () => {
      schedules = {
        create: jest.fn().mockResolvedValue(schedule),
        findAll: jest.fn(),
        findOne: jest.fn().mockResolvedValue(schedule),
        update: jest.fn().mockResolvedValue(schedule),
        remove: jest.fn().mockResolvedValue(undefined),
      };
      transitions = {
        publish: jest.fn().mockResolvedValue(schedule),
        submitForApproval: jest.fn().mockResolvedValue(schedule),
        unpublish: jest.fn().mockResolvedValue(schedule),
        withdraw: jest.fn().mockResolvedValue(schedule),
        approve: jest.fn().mockResolvedValue(schedule),
        reject: jest.fn().mockResolvedValue(schedule),
      };

      const module: TestingModule = await Test.createTestingModule({
        controllers: [SchedulesController],
        providers: [
          { provide: SchedulesService, useValue: schedules },
          { provide: SchedulesTransitionService, useValue: transitions },
        ],
      }).compile();

      controller = module.get(SchedulesController);
    });

    it('should create a schedule from the submitted details on behalf of the current user', async () => {
      const dto: CreateScheduleDto = {
        startsAt: new Date('2026-01-01'),
        endsAt: new Date('2026-01-07'),
      };

      await expect(controller.create(dto, user)).resolves.toBe(schedule);
      expect(schedules.create).toHaveBeenCalledWith(dto, user);
    });

    it('should list schedules matching the query for the current user', async () => {
      const query = { mine: true } as FindSchedulesQueryDto;
      const page = {
        items: [schedule],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      schedules.findAll.mockResolvedValue(page);

      await expect(controller.findAll(query, user)).resolves.toBe(page);
      expect(schedules.findAll).toHaveBeenCalledWith(query, user);
    });

    it('should return a single schedule by its id', async () => {
      await expect(controller.findOne(scheduleId)).resolves.toBe(schedule);
      expect(schedules.findOne).toHaveBeenCalledWith(scheduleId);
    });

    it('should apply the submitted changes to an existing schedule for the current user', async () => {
      const dto: UpdateScheduleDto = { label: 'Q1' };

      await expect(controller.update(scheduleId, dto, user)).resolves.toBe(
        schedule,
      );
      expect(schedules.update).toHaveBeenCalledWith(scheduleId, dto, user);
    });

    it('should delete a schedule on behalf of the current user without returning a body', async () => {
      await expect(
        controller.remove(scheduleId, user),
      ).resolves.toBeUndefined();
      expect(schedules.remove).toHaveBeenCalledWith(scheduleId, user);
    });

    it.each([
      'publish',
      'submitForApproval',
      'unpublish',
      'withdraw',
      'approve',
    ] as const)(
      'should %s a schedule on behalf of the current user',
      async (action) => {
        await expect(controller[action](scheduleId, user)).resolves.toBe(
          schedule,
        );
        expect(transitions[action]).toHaveBeenCalledWith(scheduleId, user);
      },
    );

    it('should reject a schedule with the supplied reason on behalf of the current user', async () => {
      const dto: RejectScheduleDto = { rejectionReason: 'Understaffed' };

      await expect(controller.reject(scheduleId, user, dto)).resolves.toBe(
        schedule,
      );
      expect(transitions.reject).toHaveBeenCalledWith(scheduleId, user, dto);
    });
  });
});
