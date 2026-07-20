import { Column, Entity } from 'typeorm';
import { AuditableEntity } from './auditable.entity';

export enum UserRole {
  MANAGER = 'MANAGER',
  APPROVER = 'APPROVER',
}

@Entity('users')
export class User extends AuditableEntity {
  @Column({ type: 'text', unique: true })
  authProviderId: string;

  @Column({ type: 'text' })
  firstName: string;

  @Column({ type: 'text' })
  lastName: string;

  @Column({ type: 'text', unique: true })
  emailAddress: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'enum', enum: UserRole, array: true })
  roles: UserRole[];
}
