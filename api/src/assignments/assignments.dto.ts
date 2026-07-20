import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateAssignmentDto {
  @IsUUID()
  employeeId: string;
}

export class DeclineAssignmentDto {
  @IsString()
  @IsNotEmpty()
  declineReason: string;
}
