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
  Assignment,
  AssignmentStatus,
  Schedule,
  ScheduleStatus,
  Shift,
  User,
  UserRole,
} from '@/entities';
import { AuthenticatedUser } from '@/auth/authenticated-request';
import { ShiftsHelpersService } from '@/shift/shifts-helpers.service';

describe('assignments/AssignmentsService', () => {
  let service: AssignmentsService;
  let assignments: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let users: { findOneBy: jest.Mock };
  let entityManager: { save: jest.Mock; softDelete: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let shiftsHelpers: { findVisible: jest.Mock; findEditable: jest.Mock };

  const manager: AuthenticatedUser = {
    id: 'manager-1',
    roles: [UserRole.MANAGER],
  };
  const employee: AuthenticatedUser = { id: 'employee-1', roles: [] };
  const shiftId = 'shift-1';

  // A shift whose schedule the manager owns and can still edit. IN_REVIEW is
  // both editable and visible to everyone (unlike a draft), so it also covers
  // the employee-driven accept/decline flows out of the box.
  const editableShift = (overrides: Partial<Schedule> = {}): Shift =>
    ({
      id: shiftId,
      schedule: {
        id: 'schedule-1',
        createdBy: manager.id,
        status: ScheduleStatus.IN_REVIEW,
        ...overrides,
      } as Schedule,
    }) as Shift;

  // A stored assignment with its shift/schedule graph loaded, as the private
  // findVisible/findEditable resolve it.
  const storedAssignment = (overrides: Partial<Assignment> = {}): Assignment =>
    ({
      id: 'assignment-1',
      shiftId,
      employeeId: employee.id,
      status: AssignmentStatus.PENDING,
      declineReason: null,
      shift: editableShift(),
      employee: { id: employee.id } as User,
      ...overrides,
    }) as Assignment;

  beforeEach(async () => {
    assignments = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      create: jest.fn((entity) => entity),
      save: jest.fn((entity) =>
        Promise.resolve({ id: 'assignment-1', ...entity }),
      ),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
    };
    users = { findOneBy: jest.fn().mockResolvedValue({ id: employee.id }) };
    entityManager = {
      save: jest.fn().mockResolvedValue(undefined),
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
        { provide: getRepositoryToken(Assignment), useValue: assignments },
        { provide: getRepositoryToken(User), useValue: users },
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
      expect(assignments.save).not.toHaveBeenCalled();
    });

    it('should forbid assigning on a schedule owned by someone else', async () => {
      shiftsHelpers.findEditable.mockResolvedValue(
        editableShift({ createdBy: 'another-manager' }),
      );

      await expect(
        service.create(shiftId, dto, manager),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(users.findOneBy).not.toHaveBeenCalled();
      expect(assignments.save).not.toHaveBeenCalled();
    });

    it('should reject an assignment for an employee that does not exist', async () => {
      users.findOneBy.mockResolvedValue(null);

      await expect(
        service.create(shiftId, dto, manager),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(assignments.save).not.toHaveBeenCalled();
    });

    it('should create the assignment and record who made it', async () => {
      const result = await service.create(shiftId, dto, manager);

      expect(assignments.save).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        shiftId,
        employeeId: employee.id,
        createdBy: manager.id,
        updatedBy: manager.id,
      });
    });

    it('should not expose the shift and employee relations in the result', async () => {
      assignments.save.mockResolvedValue({
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

  describe('findAll', () => {
    it('should return the assignments of a shift the user may see', async () => {
      const found = [{ id: 'assignment-1' }] as Assignment[];
      assignments.find.mockResolvedValue(found);

      const result = await service.findAll(shiftId, manager);

      expect(shiftsHelpers.findVisible).toHaveBeenCalledWith(shiftId, manager);
      expect(assignments.find).toHaveBeenCalledWith({ where: { shiftId } });
      expect(result).toBe(found);
    });

    it('should not return assignments when the shift is not visible', async () => {
      shiftsHelpers.findVisible.mockRejectedValue(new NotFoundException());

      await expect(service.findAll(shiftId, manager)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(assignments.find).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a visible assignment without its relations', async () => {
      assignments.findOne.mockResolvedValue(storedAssignment());

      const result = await service.findOne('assignment-1', manager);

      expect(assignments.findOne).toHaveBeenCalledWith({
        where: { id: 'assignment-1' },
        relations: { shift: { schedule: true } },
      });
      expect(result).toMatchObject({ id: 'assignment-1' });
      expect(result).not.toHaveProperty('shift');
      expect(result).not.toHaveProperty('employee');
    });

    it('should throw NotFound when the assignment does not exist', async () => {
      assignments.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing', manager)).rejects.toBeInstanceOf(
        NotFoundException,
      );
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
        service.findOne('assignment-1', employee),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
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
        Assignment,
        expect.objectContaining({ id: 'assignment-1', updatedBy: manager.id }),
      );
      expect(entityManager.softDelete).toHaveBeenCalledWith(
        Assignment,
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
