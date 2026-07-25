import 'reflect-metadata';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  INestApplication,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { SchedulesController } from '../schedules.controller';
import { SchedulesService } from '../schedules.service';
import { SchedulesTransitionService } from '../schedules-transition.service';
import { ScheduleView } from '../schedule-stats.service';
import { RolesGuard } from '@/auth/roles.guard';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthenticatedRequest, AuthenticatedUser } from '@/auth/authenticated-request';
import { ScheduleEntity, UserRole } from '@/entities';
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
      it.each(managerOnly)(
        'should reject an employee calling %s',
        (handler) => {
          expect(() => canAccess(handler, employee)).toThrow(
            ForbiddenException,
          );
        },
      );

      it.each(managerOnly)('allows a manager to call %s', (handler) => {
        expect(canAccess(handler, manager)).toBe(true);
      });

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
        'should reject an employee calling %s',
        (handler) => {
          expect(() => canAccess(handler, employee)).toThrow(
            ForbiddenException,
          );
        },
      );

      it.each(approverOnly)(
        'should allow an approver to call %s',
        (handler) => {
          expect(canAccess(handler, approver)).toBe(true);
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
      it.each(openToAny)('allows an employee to call %s', (handler) => {
        expect(canAccess(handler, employee)).toBe(true);
      });

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
    const schedule = { id: scheduleId } as ScheduleEntity;
    // The read endpoints return schedules enriched with headcount totals.
    const scheduleView = {
      id: scheduleId,
      totalRequiredHeadcount: 4,
      totalFilledCount: 2,
      totalAcceptedCount: 1,
    } as ScheduleView;

    beforeEach(async () => {
      schedules = {
        create: jest.fn().mockResolvedValue(schedule),
        findAll: jest.fn(),
        findOne: jest.fn().mockResolvedValue(scheduleView),
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

    afterEach(() => jest.clearAllMocks());

    it('should create a schedule from the submitted details on behalf of the current user', async () => {
      const dto: CreateScheduleDto = {
        startsAt: new Date('2026-01-01'),
        endsAt: new Date('2026-01-07'),
      };

      await expect(controller.create(dto, user)).resolves.toStrictEqual(
        schedule,
      );
      expect(schedules.create).toHaveBeenCalledWith(dto, user);
    });

    it('should list schedules matching the query for the current user', async () => {
      const query = { mine: true } as FindSchedulesQueryDto;
      const page = {
        items: [scheduleView],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      schedules.findAll.mockResolvedValueOnce(page);

      await expect(controller.findAll(query, user)).resolves.toStrictEqual(
        page,
      );
      expect(schedules.findAll).toHaveBeenCalledWith(query, user);
    });

    it('should return a single schedule by its id', async () => {
      await expect(controller.findOne(scheduleId, user)).resolves.toStrictEqual(
        scheduleView,
      );
      expect(schedules.findOne).toHaveBeenCalledWith(scheduleId, user);
    });

    it('should apply the submitted changes to an existing schedule for the current user', async () => {
      const dto: UpdateScheduleDto = { label: 'Q1' };

      await expect(
        controller.update(scheduleId, dto, user),
      ).resolves.toStrictEqual(schedule);
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
        await expect(
          controller[action](scheduleId, user),
        ).resolves.toStrictEqual(schedule);
        expect(transitions[action]).toHaveBeenCalledWith(scheduleId, user);
      },
    );

    it('should reject a schedule with the supplied reason on behalf of the current user', async () => {
      const dto: RejectScheduleDto = { rejectionReason: 'Understaffed' };

      await expect(
        controller.reject(scheduleId, dto, user),
      ).resolves.toStrictEqual(schedule);
      expect(transitions.reject).toHaveBeenCalledWith(scheduleId, dto, user);
    });
  });

  /**
   * These tests exercise the real HTTP router (not direct method calls like
   * the suites above), because a route-ordering mistake between `:id` and a
   * literal path like `unavailable-dates` can only be observed by actually
   * matching a request against the registered routes in order.
   */
  describe('Route resolution (HTTP)', () => {
    let app: INestApplication<App>;
    let schedules: jest.Mocked<
      Pick<SchedulesService, 'findOne' | 'findUnavailableDates'>
    >;

    const manager: AuthenticatedUser = {
      id: 'u-manager',
      roles: [UserRole.MANAGER],
    };
    const employee: AuthenticatedUser = {
      id: 'u-employee',
      roles: [UserRole.EMPLOYEE],
    };
    const validScheduleId = '11111111-1111-4111-8111-111111111111';

    // Stands in for real JWT verification: attaches whichever user the test
    // wants, so the real RolesGuard below can be exercised unmodified.
    let currentTestUser: AuthenticatedUser;
    class FakeJwtAuthGuard implements CanActivate {
      canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
        req.user = currentTestUser;
        return true;
      }
    }

    beforeEach(async () => {
      schedules = {
        findOne: jest.fn().mockResolvedValue({ id: validScheduleId }),
        findUnavailableDates: jest.fn().mockResolvedValue([]),
      };

      const module: TestingModule = await Test.createTestingModule({
        controllers: [SchedulesController],
        providers: [
          { provide: SchedulesService, useValue: schedules },
          { provide: SchedulesTransitionService, useValue: {} },
          { provide: APP_GUARD, useClass: FakeJwtAuthGuard },
          { provide: APP_GUARD, useClass: RolesGuard },
          Reflector,
        ],
      }).compile();

      app = module.createNestApplication();
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('should route GET /schedules/unavailable-dates to findUnavailableDates instead of matching it as an :id', async () => {
      currentTestUser = manager;

      await request(app.getHttpServer())
        .get('/schedules/unavailable-dates')
        .expect(200, []);

      expect(schedules.findUnavailableDates).toHaveBeenCalled();
      expect(schedules.findOne).not.toHaveBeenCalled();
    });

    it('should reject a non-manager requesting GET /schedules/unavailable-dates with 403, not a UUID validation error', async () => {
      currentTestUser = employee;

      const response = await request(app.getHttpServer())
        .get('/schedules/unavailable-dates')
        .expect(403);

      expect(response.body.message).not.toMatch(/uuid/i);
    });

    it('should still route GET /schedules/:id to findOne for an actual schedule id', async () => {
      currentTestUser = manager;

      await request(app.getHttpServer())
        .get(`/schedules/${validScheduleId}`)
        .expect(200, { id: validScheduleId });

      expect(schedules.findOne).toHaveBeenCalledWith(validScheduleId, manager);
    });
  });
});
