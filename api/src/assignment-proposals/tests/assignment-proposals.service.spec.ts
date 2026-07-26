import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { AssignmentProposalsService } from '../assignment-proposals.service';
import {
  AssignmentEntity,
  AssignmentProposalEntity,
  AssignmentStatus,
  ScheduleEntity,
  ScheduleStatus,
  ShiftEntity,
  UserEntity,
  UserRole,
} from '@/entities';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { ShiftsHelpersService } from '@/shifts/shifts-helpers.service';

describe('assignment-proposals/AssignmentProposalsService', () => {
  let service: AssignmentProposalsService;
  let proposalsRepo: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    findOneBy: jest.Mock;
  };
  let assignments: { findOneBy: jest.Mock };
  let users: { findOneBy: jest.Mock };
  let entityManager: {
    create: jest.Mock;
    save: jest.Mock;
    softDelete: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };
  let shiftsHelpers: { findVisible: jest.Mock; findEditable: jest.Mock };

  const manager: AuthenticatedUser = {
    id: 'manager-1',
    roles: [UserRole.MANAGER],
  };
  const employee: AuthenticatedUser = {
    id: 'employee-1',
    roles: [UserRole.EMPLOYEE],
  };
  const shiftId = 'shift-1';

  // A shift whose schedule the manager owns and can still edit. IN_REVIEW is
  // both editable and visible to everyone (unlike a draft).
  const editableShift = (
    overrides: Partial<ScheduleEntity> = {},
  ): ShiftEntity =>
    ({
      id: shiftId,
      schedule: {
        id: 'schedule-1',
        createdBy: manager.id,
        status: ScheduleStatus.IN_REVIEW,
        ...overrides,
      } as ScheduleEntity,
    }) as ShiftEntity;

  // A stored proposal with its shift/schedule graph loaded, as the private
  // findVisible/findEditable resolve it.
  const storedProposal = (
    overrides: Partial<AssignmentProposalEntity> = {},
  ): AssignmentProposalEntity =>
    ({
      id: 'proposal-1',
      shiftId,
      employeeId: employee.id,
      message: 'Please add me',
      shift: editableShift(),
      ...overrides,
    }) as AssignmentProposalEntity;

  beforeEach(async () => {
    proposalsRepo = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      create: jest.fn((entity) => entity),
      save: jest.fn((entity) =>
        Promise.resolve({ id: 'proposal-1', ...entity }),
      ),
      findOne: jest.fn(),
      findOneBy: jest.fn().mockResolvedValue(null),
    };
    assignments = { findOneBy: jest.fn().mockResolvedValue(null) };
    users = { findOneBy: jest.fn() };
    entityManager = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      create: jest.fn((_entity, data) => data),
      save: jest.fn((_entity, data) => Promise.resolve(data)),
      softDelete: jest.fn().mockResolvedValue(undefined),
    };
    dataSource = {
      transaction: jest.fn((cb) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
        cb(entityManager as unknown as EntityManager),
      ),
    };
    shiftsHelpers = {
      findVisible: jest.fn().mockResolvedValue(editableShift()),
      findEditable: jest.fn().mockResolvedValue(editableShift()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentProposalsService,
        {
          provide: getRepositoryToken(AssignmentProposalEntity),
          useValue: proposalsRepo,
        },
        { provide: getRepositoryToken(UserEntity), useValue: users },
        {
          provide: getRepositoryToken(AssignmentEntity),
          useValue: assignments,
        },
        { provide: DataSource, useValue: dataSource },
        { provide: ShiftsHelpersService, useValue: shiftsHelpers },
      ],
    }).compile();

    service = module.get(AssignmentProposalsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const dto = { message: 'Please add me' };

    it('should not propose on a shift whose schedule cannot be edited', async () => {
      shiftsHelpers.findEditable.mockRejectedValue(
        new ConflictException('locked'),
      );

      await expect(
        service.create(shiftId, dto, employee),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(proposalsRepo.save).not.toHaveBeenCalled();
    });

    it('should reject a proposal when the employee is already assigned', async () => {
      assignments.findOneBy.mockResolvedValue({ id: 'assignment-1' });

      await expect(
        service.create(shiftId, dto, employee),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(proposalsRepo.save).not.toHaveBeenCalled();
    });

    it('should reject a second proposal from the same employee', async () => {
      proposalsRepo.findOneBy.mockResolvedValue({ id: 'proposal-1' });

      await expect(
        service.create(shiftId, dto, employee),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(proposalsRepo.save).not.toHaveBeenCalled();
    });

    it('should create the proposal for the current user', async () => {
      const result = await service.create(shiftId, dto, employee);

      expect(assignments.findOneBy).toHaveBeenCalledWith({
        shiftId,
        employeeId: employee.id,
      });
      expect(proposalsRepo.save).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        message: dto.message,
        employeeId: employee.id,
        createdBy: employee.id,
        updatedBy: employee.id,
      });
    });

    it('should create the proposal with no message when none is given', async () => {
      const result = await service.create(shiftId, {}, employee);

      expect(result).toMatchObject({
        message: null,
        employeeId: employee.id,
      });
    });
  });

  describe('update', () => {
    it('should not update a proposal that does not exist', async () => {
      proposalsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('missing', { message: 'x' }, employee),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(proposalsRepo.save).not.toHaveBeenCalled();
    });

    it("should forbid updating another employee's proposal", async () => {
      proposalsRepo.findOne.mockResolvedValue(
        storedProposal({ employeeId: 'another-employee' }),
      );

      await expect(
        service.update('proposal-1', { message: 'x' }, employee),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(proposalsRepo.save).not.toHaveBeenCalled();
    });

    it('should apply the new message and record who updated it', async () => {
      proposalsRepo.findOne.mockResolvedValue(storedProposal());

      const result = await service.update(
        'proposal-1',
        { message: 'Updated' },
        employee,
      );

      expect(result).toMatchObject({
        message: 'Updated',
        updatedBy: employee.id,
      });
    });
  });

  describe('remove', () => {
    it("should forbid deleting another employee's proposal", async () => {
      proposalsRepo.findOne.mockResolvedValue(
        storedProposal({ employeeId: 'another-employee' }),
      );

      await expect(
        service.remove('proposal-1', employee),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should soft-delete the proposal and record who removed it', async () => {
      proposalsRepo.findOne.mockResolvedValue(storedProposal());

      await service.remove('proposal-1', employee);

      expect(entityManager.save).toHaveBeenCalledWith(
        AssignmentProposalEntity,
        expect.objectContaining({ id: 'proposal-1', updatedBy: employee.id }),
      );
      expect(entityManager.softDelete).toHaveBeenCalledWith(
        AssignmentProposalEntity,
        'proposal-1',
      );
    });
  });

  describe('accept', () => {
    it('should let only the schedule owner accept a proposal', async () => {
      proposalsRepo.findOne.mockResolvedValue(
        storedProposal({
          shift: editableShift({ createdBy: 'another-manager' }),
        }),
      );

      await expect(
        service.accept('proposal-1', manager),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should create an accepted assignment and consume the proposal', async () => {
      proposalsRepo.findOne.mockResolvedValue(storedProposal());

      await service.accept('proposal-1', manager);

      expect(entityManager.save).toHaveBeenCalledWith(
        AssignmentEntity,
        expect.objectContaining({
          shiftId,
          employeeId: employee.id,
          status: AssignmentStatus.ACCEPTED,
          createdBy: manager.id,
        }),
      );
      expect(entityManager.softDelete).toHaveBeenCalledWith(
        AssignmentProposalEntity,
        'proposal-1',
      );
    });
  });

  describe('decline', () => {
    it('should let only the schedule owner decline a proposal', async () => {
      proposalsRepo.findOne.mockResolvedValue(
        storedProposal({
          shift: editableShift({ createdBy: 'another-manager' }),
        }),
      );

      await expect(
        service.decline('proposal-1', manager),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should soft-delete the declined proposal', async () => {
      proposalsRepo.findOne.mockResolvedValue(storedProposal());

      await service.decline('proposal-1', manager);

      expect(entityManager.softDelete).toHaveBeenCalledWith(
        AssignmentProposalEntity,
        'proposal-1',
      );
    });
  });
});
