import { Check, Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { AuditableEntity } from './auditable.entity';
import { Assignment } from './assignment';
import { AssignmentProposal } from './assignment-proposal';
import { Schedule } from './schedule';

@Entity('shifts')
@Check('"requiredHeadcount" BETWEEN 1 AND 10')
export class Shift extends AuditableEntity {
  @Column({ type: 'uuid' })
  scheduleId: string;

  @ManyToOne(() => Schedule, (schedule) => schedule.shifts, {
    onDelete: 'RESTRICT',
  })
  schedule: Schedule;

  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'timestamptz' })
  endsAt: Date;

  @Column({ type: 'int' })
  requiredHeadcount: number;

  @OneToMany(() => Assignment, (assignment) => assignment.shift)
  assignments: Assignment[];

  @OneToMany(() => AssignmentProposal, (proposal) => proposal.shift)
  assignmentProposals: AssignmentProposal[];
}
