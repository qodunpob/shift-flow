import { Column, Entity, ManyToOne } from 'typeorm';
import { AuditableEntity } from './auditable.entity';
import { Shift } from './shift';

@Entity('assignment_proposals')
export class AssignmentProposal extends AuditableEntity {
  @Column({ type: 'uuid' })
  shiftId: string;

  @ManyToOne(() => Shift, (shift) => shift.assignmentProposals, {
    onDelete: 'RESTRICT',
  })
  shift: Shift;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'text', nullable: true })
  message: string | null;
}
