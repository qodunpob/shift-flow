import { Check, Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { AuditableEntity } from './auditable.entity';
import { AssignmentEntity } from './assignment.entity';
import { AssignmentProposalEntity } from './assignment-proposal.entity';
import { ScheduleEntity } from './schedule.entity';

@Entity('shifts')
@Check('"requiredHeadcount" BETWEEN 1 AND 10')
export class ShiftEntity extends AuditableEntity {
  @Column({ type: 'uuid' })
  scheduleId: string;

  @ManyToOne(() => ScheduleEntity, (schedule) => schedule.shifts, {
    onDelete: 'RESTRICT',
  })
  schedule: ScheduleEntity;

  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'timestamptz' })
  endsAt: Date;

  @Column({ type: 'int' })
  requiredHeadcount: number;

  @OneToMany(() => AssignmentEntity, (assignment) => assignment.shift)
  assignments: AssignmentEntity[];

  @OneToMany(() => AssignmentProposalEntity, (proposal) => proposal.shift)
  proposals: AssignmentProposalEntity[];
}
