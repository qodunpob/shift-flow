import { Column, Entity, ManyToOne } from 'typeorm';
import { AuditableEntity } from './auditable.entity';
import { Shift } from './shift';
import { User } from '@/entities/user';

export enum AssignmentStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

@Entity('assignments')
export class Assignment extends AuditableEntity {
  @Column({ type: 'uuid' })
  shiftId: string;

  @ManyToOne(() => Shift, (shift) => shift.assignments, {
    onDelete: 'RESTRICT',
  })
  shift: Shift;

  @Column({ type: 'uuid' })
  employeeId: string;

  @ManyToOne(() => User, (user) => user.assignments, {
    onDelete: 'RESTRICT',
  })
  employee: User;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.PENDING,
  })
  status: AssignmentStatus;

  @Column({ type: 'text', nullable: true })
  declineReason: string | null;
}
