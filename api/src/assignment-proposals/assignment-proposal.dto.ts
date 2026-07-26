import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAssignmentProposalDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  message?: string;
}

export class UpdateAssignmentProposalDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}
