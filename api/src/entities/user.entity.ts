import { Column, Entity, OneToMany } from 'typeorm';
import { AuditableEntity } from './auditable.entity';
import { AssignmentEntity } from '@/entities/assignment.entity';
import { AssignmentProposalEntity } from '@/entities/assignment-proposal.entity';

export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  APPROVER = 'APPROVER',
}

@Entity('users')
export class UserEntity extends AuditableEntity {
  @Column({ type: 'text', select: false })
  password: string;

  @Column({ type: 'text' })
  firstName: string;

  @Column({ type: 'text' })
  lastName: string;

  @Column({ type: 'text', unique: true, select: false })
  emailAddress: string;

  @Column({ type: 'enum', enum: UserRole, array: true })
  roles: UserRole[];

  @OneToMany(() => AssignmentEntity, (assignment) => assignment.employee)
  assignments: AssignmentEntity[];

  @OneToMany(
    () => AssignmentProposalEntity,
    (assignmentProposal) => assignmentProposal.employee,
  )
  proposals: AssignmentProposalEntity[];
}
