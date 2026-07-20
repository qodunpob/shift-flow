import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAssignmentProposalDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class UpdateAssignmentProposalDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}
