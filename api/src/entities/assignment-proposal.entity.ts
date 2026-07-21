import { Column, Entity, ManyToOne } from 'typeorm';
import { AuditableEntity } from './auditable.entity';
import { ShiftEntity } from './shift.entity';
import { UserEntity } from '@/entities/user.entity';

@Entity('assignment_proposals')
export class AssignmentProposalEntity extends AuditableEntity {
  @Column({ type: 'uuid' })
  shiftId: string;

  @ManyToOne(() => ShiftEntity, (shift) => shift.proposals, {
    onDelete: 'RESTRICT',
  })
  shift: ShiftEntity;

  @Column({ type: 'uuid' })
  employeeId: string;

  @ManyToOne(() => UserEntity, (user) => user.proposals, {
    onDelete: 'RESTRICT',
  })
  employee: UserEntity;

  @Column({ type: 'text', nullable: true })
  message: string | null;
}
