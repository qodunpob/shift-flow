import { Column, Entity, OneToMany } from 'typeorm';
import { AuditableEntity } from './auditable.entity';
import { ShiftEntity } from './shift.entity';

export enum ScheduleStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  AWAITING_APPROVAL = 'AWAITING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('schedules')
export class ScheduleEntity extends AuditableEntity {
  @Column({ type: 'text', nullable: true })
  label: string | null;

  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'timestamptz' })
  endsAt: Date;

  @Column({ type: 'enum', enum: ScheduleStatus, default: ScheduleStatus.DRAFT })
  status: ScheduleStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @OneToMany(() => ShiftEntity, (shift) => shift.schedule)
  shifts: ShiftEntity[];
}
