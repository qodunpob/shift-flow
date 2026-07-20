import { Column, Entity, ManyToOne } from 'typeorm';
import { AuditableEntity } from './auditable.entity';
import { ShiftEntity } from './shift.entity';
import { UserEntity } from '@/entities/user.entity';

export enum AssignmentStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

@Entity('assignments')
export class AssignmentEntity extends AuditableEntity {
  @Column({ type: 'uuid' })
  shiftId: string;

  @ManyToOne(() => ShiftEntity, (shift) => shift.assignments, {
    onDelete: 'RESTRICT',
  })
  shift: ShiftEntity;

  @Column({ type: 'uuid' })
  employeeId: string;

  @ManyToOne(() => UserEntity, (user) => user.assignments, {
    onDelete: 'RESTRICT',
  })
  employee: UserEntity;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.PENDING,
  })
  status: AssignmentStatus;

  @Column({ type: 'text', nullable: true })
  declineReason: string | null;
}
