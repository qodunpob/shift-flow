import { Column, Entity, ManyToOne } from 'typeorm';
import { AuditableEntity } from './auditable.entity';
import { Shift } from './shift';
import { User } from '@/entities/user';

@Entity('assignment_proposals')
export class AssignmentProposal extends AuditableEntity {
  @Column({ type: 'uuid' })
  shiftId: string;

  @ManyToOne(() => Shift, (shift) => shift.assignmentProposals, {
    onDelete: 'RESTRICT',
  })
  shift: Shift;

  @Column({ type: 'uuid' })
  employeeId: string;

  @ManyToOne(() => User, (user) => user.assignments, {
    onDelete: 'RESTRICT',
  })
  employee: Shift;

  @Column({ type: 'text', nullable: true })
  message: string | null;
}
