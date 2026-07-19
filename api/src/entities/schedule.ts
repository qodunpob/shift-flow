import { Column, Entity, OneToMany } from 'typeorm';
import { AuditableEntity } from './auditable.entity';
import { Shift } from './shift';

export enum ScheduleStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  AWAITING_APPROVAL = 'AWAITING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('schedules')
export class Schedule extends AuditableEntity {
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

  @OneToMany(() => Shift, (shift) => shift.schedule)
  shifts: Shift[];
}
