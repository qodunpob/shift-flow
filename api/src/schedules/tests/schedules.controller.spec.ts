import 'reflect-metadata';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SchedulesController } from '../schedules.controller';
import { RolesGuard } from '@/auth/roles.guard';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { UserRole } from '@/entities';

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
        expect(() => canAccess(handler, manager)).toThrow(
          UnauthorizedException,
        );
      });

      it.each(approverOnly)(
        'should reject a user without roles calling %s',
        (handler) => {
          expect(() => canAccess(handler, noRoles)).toThrow(
            UnauthorizedException,
          );
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
});
