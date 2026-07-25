import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { AssignmentsService } from '../assignments.service';
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

describe('assignments/AssignmentsService', () => {
  let service: AssignmentsService;
  let assignments: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    findOneBy: jest.Mock;
  };
  let users: { findOneBy: jest.Mock };
  let entityManager: {
    findOneBy: jest.Mock;
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
  // both editable and visible to everyone (unlike a draft), so it also covers
  // the employee-driven accept/decline flows out of the box.
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

  // A stored assignment with its shift/schedule graph loaded, as the private
  // findVisible/findEditable resolve it.
  const storedAssignment = (
    overrides: Partial<AssignmentEntity> = {},
  ): AssignmentEntity =>
    ({
      id: 'assignment-1',
      shiftId,
      employeeId: employee.id,
      status: AssignmentStatus.PENDING,
      declineReason: null,
      shift: editableShift(),
      employee: { id: employee.id } as UserEntity,
      ...overrides,
    }) as AssignmentEntity;

  beforeEach(async () => {
    assignments = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      create: jest.fn((entity) => entity),
      save: jest.fn((entity) =>
        Promise.resolve({ id: 'assignment-1', ...entity }),
      ),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      findOneBy: jest.fn().mockResolvedValue(null),
    };
    users = {
      findOneBy: jest.fn().mockResolvedValue({
        id: employee.id,
        roles: [UserRole.EMPLOYEE],
      }),
    };
    entityManager = {
      findOneBy: jest.fn().mockResolvedValue(null),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      create: jest.fn((_entity, data) => data),
      save: jest.fn((_entity, data) =>
        Promise.resolve({ id: 'assignment-1', ...data }),
      ),
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
        AssignmentsService,
        {
          provide: getRepositoryToken(AssignmentEntity),
          useValue: assignments,
        },
        { provide: getRepositoryToken(UserEntity), useValue: users },
        { provide: DataSource, useValue: dataSource },
        { provide: ShiftsHelpersService, useValue: shiftsHelpers },
      ],
    }).compile();

    service = module.get(AssignmentsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const dto = { employeeId: employee.id };

    it('should not create an assignment when the shift schedule cannot be edited', async () => {
      shiftsHelpers.findEditable.mockRejectedValue(
        new ConflictException('locked'),
      );

      await expect(
        service.create(shiftId, dto, manager),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should forbid assigning on a schedule owned by someone else', async () => {
      shiftsHelpers.findEditable.mockResolvedValue(
        editableShift({ createdBy: 'another-manager' }),
      );

      await expect(
        service.create(shiftId, dto, manager),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(users.findOneBy).not.toHaveBeenCalled();
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should reject an assignment for an employee that does not exist', async () => {
      users.findOneBy.mockResolvedValue(null);

      await expect(
        service.create(shiftId, dto, manager),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should reject an employeeId that does not have the EMPLOYEE role', async () => {
      users.findOneBy.mockResolvedValue({
        id: 'manager-2',
        roles: [UserRole.MANAGER],
      });

      await expect(
        service.create(shiftId, dto, manager),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should reject assigning an employee that is already assigned', async () => {
      assignments.findOneBy.mockResolvedValue({ id: 'assignment-1' });

      await expect(
        service.create(shiftId, dto, manager),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should create a PENDING assignment when the employee has no proposal', async () => {
      entityManager.findOneBy.mockResolvedValue(null);

      const result = await service.create(shiftId, dto, manager);

      expect(entityManager.softDelete).not.toHaveBeenCalled();
      expect(entityManager.save).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        shiftId,
        employeeId: employee.id,
        status: AssignmentStatus.PENDING,
        createdBy: manager.id,
        updatedBy: manager.id,
      });
    });

    it('should consume an existing proposal and accept the assignment in one transaction', async () => {
      entityManager.findOneBy.mockResolvedValue({
        id: 'proposal-1',
        shiftId,
        employeeId: employee.id,
      });

      const result = await service.create(shiftId, dto, manager);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      // The proposal is soft-deleted and the assignment saved on the same manager.
      expect(entityManager.softDelete).toHaveBeenCalledWith(
        AssignmentProposalEntity,
        'proposal-1',
      );
      expect(entityManager.save).toHaveBeenCalledWith(
        AssignmentEntity,
        expect.objectContaining({
          shiftId,
          employeeId: employee.id,
          status: AssignmentStatus.ACCEPTED,
        }),
      );
      expect(result).toMatchObject({ status: AssignmentStatus.ACCEPTED });
    });

    it('should not expose the shift and employee relations in the result', async () => {
      entityManager.save.mockResolvedValueOnce({
        id: 'assignment-1',
        shiftId,
        employeeId: employee.id,
        shift: editableShift(),
        employee: { id: employee.id },
      });

      const result = await service.create(shiftId, dto, manager);

      expect(result).not.toHaveProperty('shift');
      expect(result).not.toHaveProperty('employee');
    });
  });

  describe('remove', () => {
    it('should throw NotFound when the assignment does not exist', async () => {
      assignments.findOne.mockResolvedValue(null);

      await expect(service.remove('missing', manager)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should hide an assignment whose schedule the user may not see', async () => {
      assignments.findOne.mockResolvedValue(
        storedAssignment({
          shift: editableShift({
            status: ScheduleStatus.DRAFT,
            createdBy: 'another-manager',
          }),
        }),
      );

      await expect(
        service.remove('assignment-1', employee),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should forbid deleting an assignment on a schedule owned by someone else', async () => {
      assignments.findOne.mockResolvedValue(
        storedAssignment({
          shift: editableShift({ createdBy: 'another-manager' }),
        }),
      );

      await expect(
        service.remove('assignment-1', manager),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should reject deleting an assignment when the schedule is not editable', async () => {
      assignments.findOne.mockResolvedValue(
        storedAssignment({
          shift: editableShift({ status: ScheduleStatus.APPROVED }),
        }),
      );

      await expect(
        service.remove('assignment-1', manager),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should soft-delete the assignment and record who removed it', async () => {
      assignments.findOne.mockResolvedValue(storedAssignment());

      await service.remove('assignment-1', manager);

      expect(entityManager.save).toHaveBeenCalledWith(
        AssignmentEntity,
        expect.objectContaining({ id: 'assignment-1', updatedBy: manager.id }),
      );
      expect(entityManager.softDelete).toHaveBeenCalledWith(
        AssignmentEntity,
        'assignment-1',
      );
    });
  });

  describe('accept', () => {
    it('should let the assigned employee accept their assignment', async () => {
      assignments.findOne.mockResolvedValue(storedAssignment());

      const result = await service.accept('assignment-1', employee);

      expect(assignments.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AssignmentStatus.ACCEPTED,
          updatedBy: employee.id,
        }),
      );
      expect(result).not.toHaveProperty('shift');
    });

    it('should forbid accepting an assignment that belongs to someone else', async () => {
      assignments.findOne.mockResolvedValue(
        storedAssignment({ employeeId: 'another-employee' }),
      );

      await expect(
        service.accept('assignment-1', employee),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(assignments.save).not.toHaveBeenCalled();
    });

    it('should reject accepting when the schedule is no longer editable', async () => {
      assignments.findOne.mockResolvedValue(
        storedAssignment({
          shift: editableShift({ status: ScheduleStatus.APPROVED }),
        }),
      );

      await expect(
        service.accept('assignment-1', employee),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(assignments.save).not.toHaveBeenCalled();
    });
  });

  describe('decline', () => {
    const dto = { declineReason: 'On holiday' };

    it('should let the assigned employee decline with a reason', async () => {
      assignments.findOne.mockResolvedValue(storedAssignment());

      const result = await service.decline('assignment-1', dto, employee);

      expect(assignments.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AssignmentStatus.DECLINED,
          declineReason: dto.declineReason,
          updatedBy: employee.id,
        }),
      );
      expect(result).not.toHaveProperty('shift');
    });

    it('should forbid declining an assignment that belongs to someone else', async () => {
      assignments.findOne.mockResolvedValue(
        storedAssignment({ employeeId: 'another-employee' }),
      );

      await expect(
        service.decline('assignment-1', dto, employee),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(assignments.save).not.toHaveBeenCalled();
    });

    it('should reject declining when the schedule is no longer editable', async () => {
      assignments.findOne.mockResolvedValue(
        storedAssignment({
          shift: editableShift({ status: ScheduleStatus.APPROVED }),
        }),
      );

      await expect(
        service.decline('assignment-1', dto, employee),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(assignments.save).not.toHaveBeenCalled();
    });
  });
});
