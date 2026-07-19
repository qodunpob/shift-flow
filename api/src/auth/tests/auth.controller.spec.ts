import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '@/auth/auth.service';
import { AuthenticatedRequest } from '@/auth/authenticated-request';
import { UserRole } from '@/entities';

describe('auth/AuthController', () => {
  let controller: AuthController;
  let authService: { login: jest.Mock };

  beforeEach(async () => {
    authService = { login: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should log in the authenticated user and return the token', () => {
    const token = { access_token: 'signed-token' };
    authService.login.mockReturnValue(token);
    const req = {
      user: { id: 'user-1', roles: [UserRole.MANAGER] },
    } as AuthenticatedRequest;

    const result = controller.login(req);

    expect(authService.login).toHaveBeenCalledWith(req.user);
    expect(result).toBe(token);
  });
});
