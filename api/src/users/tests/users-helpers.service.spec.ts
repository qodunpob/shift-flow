import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity, UserRole } from '@/entities';
import { UsersHelpersService } from '@/users/users-helpers.service';

describe('users/UsersHelpersService', () => {
  let service: UsersHelpersService;
  let queryBuilder: {
    addSelect: jest.Mock;
    where: jest.Mock;
    getOne: jest.Mock;
  };
  let users: { createQueryBuilder: jest.Mock };

  const storedUser = {
    id: 'user-1',
    emailAddress: 'manager@example.com',
    password: 'salt:hash',
    roles: [UserRole.MANAGER],
  } as unknown as UserEntity;

  beforeEach(async () => {
    queryBuilder = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };
    users = { createQueryBuilder: jest.fn(() => queryBuilder) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersHelpersService,
        { provide: getRepositoryToken(UserEntity), useValue: users },
      ],
    }).compile();

    service = module.get<UsersHelpersService>(UsersHelpersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('looks up the user by email and selects the password', async () => {
      queryBuilder.getOne.mockResolvedValueOnce(storedUser);

      const result = await service.findOne('manager@example.com');

      expect(queryBuilder.addSelect).toHaveBeenCalledWith('user.password');
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'user.emailAddress = :emailAddress',
        { emailAddress: 'manager@example.com' },
      );
      expect(result).toBe(storedUser);
    });

    it('returns null when no user matches', async () => {
      queryBuilder.getOne.mockResolvedValueOnce(null);

      const result = await service.findOne('nobody@example.com');

      expect(result).toBeNull();
    });
  });
});
