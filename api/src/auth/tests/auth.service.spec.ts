import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { UserRole } from '@/entities';
import { hashPassword } from '@/utils/password';
import { UsersHelpersService } from '@/users/users-helpers.service';

describe('auth/AuthService', () => {
  let service: AuthService;
  let usersHelpers: { findOneWithPassword: jest.Mock };
  let jwtService: { sign: jest.Mock };

  const storedUser = {
    id: 'user-1',
    emailAddress: 'manager@example.com',
    password: '',
    roles: [UserRole.MANAGER],
  };

  beforeAll(async () => {
    storedUser.password = await hashPassword('secret');
  });

  beforeEach(async () => {
    usersHelpers = { findOneWithPassword: jest.fn() };
    jwtService = { sign: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersHelpersService, useValue: usersHelpers },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return the user without the password when credentials match', async () => {
      usersHelpers.findOneWithPassword.mockResolvedValueOnce({ ...storedUser });

      const result = await service.validateUser(
        storedUser.emailAddress,
        'secret',
      );

      expect(result).toEqual({
        id: storedUser.id,
        emailAddress: storedUser.emailAddress,
        roles: storedUser.roles,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should return null when the password does not match', async () => {
      usersHelpers.findOneWithPassword.mockResolvedValueOnce({ ...storedUser });

      const result = await service.validateUser(
        storedUser.emailAddress,
        'wrong',
      );

      expect(result).toBeNull();
    });

    it('should return null when the user does not exist', async () => {
      usersHelpers.findOneWithPassword.mockResolvedValueOnce(undefined);

      const result = await service.validateUser('nobody@example.com', 'secret');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should sign a token carrying the user id and roles', () => {
      jwtService.sign.mockReturnValue('signed-token');
      const user: AuthenticatedUser = {
        id: 'user-1',
        roles: [UserRole.MANAGER],
      };

      const result = service.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        roles: user.roles,
      });
      expect(result).toEqual({ access_token: 'signed-token' });
    });
  });
});
