import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity, UserRole } from '@/entities';
import { UsersService } from '@/users/users.service';

describe('users/UsersService', () => {
  let service: UsersService;
  let queryBuilder: {
    where: jest.Mock;
    leftJoin: jest.Mock;
    andWhere: jest.Mock;
    getMany: jest.Mock;
  };
  let users: { find: jest.Mock; createQueryBuilder: jest.Mock };

  const allUsers = [{ id: 'user-1' }] as UserEntity[];
  const availableUsers = [{ id: 'user-2' }] as UserEntity[];

  beforeEach(async () => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(availableUsers),
    };
    users = {
      find: jest.fn().mockResolvedValue(allUsers),
      createQueryBuilder: jest.fn(() => queryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(UserEntity), useValue: users },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns every user when no filter is given', async () => {
      const result = await service.findAll();

      expect(users.find).toHaveBeenCalledWith();
      expect(users.createQueryBuilder).not.toHaveBeenCalled();
      expect(result).toBe(allUsers);
    });

    it('filters to employees not already assigned to the shift when availableFor is given', async () => {
      const result = await service.findAll({ availableFor: 'shift-1' });

      expect(queryBuilder.where).toHaveBeenCalledWith(
        ':role = ANY(user.roles)',
        { role: UserRole.EMPLOYEE },
      );
      expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
        'user.assignments',
        'assignment',
        'assignment.shiftId = :shiftId',
        { shiftId: 'shift-1' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'assignment.id IS NULL',
      );
      expect(result).toBe(availableUsers);
    });
  });
});
