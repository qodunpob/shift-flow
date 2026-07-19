import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { UsersService } from '@/users/users.service';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { UserRole } from '@/entities';

describe('auth/AuthService', () => {
  let service: AuthService;
  let usersService: { findOne: jest.Mock };
  let jwtService: { sign: jest.Mock };

  const storedUser = {
    id: 'user-1',
    emailAddress: 'manager@example.com',
    password: 'secret',
    roles: [UserRole.MANAGER],
  };

  beforeEach(async () => {
    usersService = { findOne: jest.fn() };
    jwtService = { sign: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return the user without the password when credentials match', async () => {
      usersService.findOne.mockResolvedValue({ ...storedUser });

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
      usersService.findOne.mockResolvedValue({ ...storedUser });

      const result = await service.validateUser(
        storedUser.emailAddress,
        'wrong',
      );

      expect(result).toBeNull();
    });

    it('should return null when the user does not exist', async () => {
      usersService.findOne.mockResolvedValue(undefined);

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
