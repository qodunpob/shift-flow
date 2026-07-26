import { ApiProperty, OmitType } from '@nestjs/swagger';
import { AssignmentStatus, ShiftEntity } from '@/entities';
import {
  AssignmentView,
  ProposalView,
  ShiftBoardView,
} from '@/shifts/shifts-board.service';

export class EmployeeRefDto {
  id: string;
  firstName: string;
  lastName: string;
}

export class AssignmentViewDto implements AssignmentView {
  id: string;
  employeeId: string;
  employee: EmployeeRefDto | null;
  status: AssignmentStatus;
  declineReason: string | null;
}

export class ProposalViewDto implements ProposalView {
  id: string;
  employeeId: string;
  employee: EmployeeRefDto | null;
  message: string | null;
  createdAt: Date;
}

export class ShiftBoardViewDto
  extends OmitType(ShiftEntity, [
    'schedule',
    'assignments',
    'proposals',
  ] as const)
  implements ShiftBoardView
{
  @ApiProperty({
    description: 'Assignments that have not been declined.',
  })
  filledCount: number;

  @ApiProperty({
    description: 'Number of open assignments.',
  })
  spotsRemaining: number;

  assignments: AssignmentViewDto[];
  proposals: ProposalViewDto[];
}
