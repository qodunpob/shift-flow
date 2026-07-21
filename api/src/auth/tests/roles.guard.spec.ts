import 'reflect-metadata';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../roles.guard';
import { Roles } from '../roles.decorator';
import { AuthenticatedUser } from '../authenticated-request';
import { UserRole } from '@/entities';

/**
 * A stand-in controller whose handlers carry the same `@Roles(...)` metadata
 * the guard reads in production, so these tests drive the real Reflector path
 * rather than a hand-stubbed metadata lookup.
 */
class TestController {
  // No @Roles decorator: the endpoint is open to any authenticated user.
  open() {}

  @Roles([UserRole.MANAGER])
  singleRole() {}

  @Roles([UserRole.MANAGER, UserRole.APPROVER])
  multipleRoles() {}
}

type HandlerName = keyof TestController;

describe('auth/RolesGuard', () => {
  let guard: RolesGuard;

  const userWith = (...roles: UserRole[]): AuthenticatedUser => ({
    id: 'u-test',
    roles,
  });

  const createContext = (
    handlerName: HandlerName,
    user: AuthenticatedUser,
  ): ExecutionContext =>
    ({
      getHandler: () => TestController.prototype[handlerName],
      getClass: () => TestController,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  const canActivate = (
    handlerName: HandlerName,
    user: AuthenticatedUser,
  ): boolean => guard.canActivate(createContext(handlerName, user));

  beforeEach(() => {
    guard = new RolesGuard(new Reflector());
  });

  describe('endpoints without a role requirement', () => {
    it('should grant access when the handler declares no required roles', () => {
      expect(canActivate('open', userWith())).toBe(true);
    });
  });

  describe('endpoints requiring a single role', () => {
    it('should grant access when the user has the required role', () => {
      expect(canActivate('singleRole', userWith(UserRole.MANAGER))).toBe(true);
    });

    it('should grant access when the user has the required role among others', () => {
      expect(
        canActivate(
          'singleRole',
          userWith(UserRole.MANAGER, UserRole.APPROVER),
        ),
      ).toBe(true);
    });

    it('should deny access when the user has no roles', () => {
      expect(() => canActivate('singleRole', userWith())).toThrow(
        ForbiddenException,
      );
    });

    it('should deny access when the user has a different role', () => {
      expect(() =>
        canActivate('singleRole', userWith(UserRole.APPROVER)),
      ).toThrow(ForbiddenException);
    });

    it('should deny access when the user has several roles but none is required', () => {
      expect(() =>
        canActivate(
          'singleRole',
          userWith(UserRole.APPROVER, UserRole.EMPLOYEE),
        ),
      ).toThrow(ForbiddenException);
    });
  });

  describe('endpoints requiring one of several roles', () => {
    it('should grant access when the user has one of the required roles', () => {
      expect(canActivate('multipleRoles', userWith(UserRole.MANAGER))).toBe(
        true,
      );
    });

    it('should grant access when the user has one of the required roles among others', () => {
      expect(
        canActivate(
          'multipleRoles',
          userWith(UserRole.MANAGER, UserRole.EMPLOYEE),
        ),
      ).toBe(true);
    });

    it('should deny access when the user has no roles', () => {
      expect(() => canActivate('multipleRoles', userWith())).toThrow(
        ForbiddenException,
      );
    });

    it('should deny access when the user has none of the required roles', () => {
      expect(() =>
        canActivate('multipleRoles', userWith(UserRole.EMPLOYEE)),
      ).toThrow(ForbiddenException);
    });
  });
});
