import { Injectable } from '@nestjs/common';
import { UserRole } from '@/entities';

@Injectable()
export class UsersService {
  private readonly testUsers = [
    {
      id: 'caffe836-3198-4e55-9a46-a1e8d8e49f9e',
      avatarUrl: null,
      firstName: 'Employee',
      lastName: 'Test',
      emailAddress: 'test-employee@example.com',
      password: 'test-employee@example.com',
      roles: [],
    },
    {
      id: 'cde9a7fe-d70a-4af7-bdb1-0444ef03231b',
      avatarUrl: null,
      firstName: 'Manager',
      lastName: 'Test',
      emailAddress: 'test-manager@example.com',
      password: 'test-manager@example.com',
      roles: [UserRole.MANAGER],
    },
    {
      id: 'a7d3e30b-1362-499f-96d5-1efbf8c07b5f',
      avatarUrl: null,
      firstName: 'Approver',
      lastName: 'Test',
      emailAddress: 'test-approver@example.com',
      password: 'test-approver@example.com',
      roles: [UserRole.APPROVER],
    },
  ];

  findOne(emailAddress: string) {
    return Promise.resolve(
      this.testUsers.find((user) => user.emailAddress === emailAddress),
    );
  }
}
