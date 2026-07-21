import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from '@/entities';
import { FindUsersQueryDto } from '@/users/users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  findAll(filter: FindUsersQueryDto = {}) {
    if (!filter.availableFor) {
      return this.users.find();
    }

    // Available means: role EMPLOYEE, and no assignment record (of any
    // status) already exists for this shift — matching the conflict check
    // AssignmentsService.create() uses to reject double-booking.
    return this.users
      .createQueryBuilder('user')
      .where(':role = ANY(user.roles)', { role: UserRole.EMPLOYEE })
      .leftJoin(
        'user.assignments',
        'assignment',
        'assignment.shiftId = :shiftId',
        { shiftId: filter.availableFor },
      )
      .andWhere('assignment.id IS NULL')
      .getMany();
  }
}
