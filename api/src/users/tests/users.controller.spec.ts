import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { FindUsersQueryDto } from '../users.dto';
import { UserEntity } from '@/entities';

describe('users/UsersController', () => {
  let controller: UsersController;
  let users: jest.Mocked<Pick<UsersService, 'findAll'>>;

  const allUsers = [{ id: 'user-1' }] as UserEntity[];

  beforeEach(async () => {
    users = { findAll: jest.fn().mockResolvedValue(allUsers) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: users }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list users matching the submitted query', async () => {
    const query: FindUsersQueryDto = { availableFor: 'shift-1' };

    await expect(controller.findAll(query)).resolves.toBe(allUsers);

    expect(users.findAll).toHaveBeenCalledWith(query);
  });
});
