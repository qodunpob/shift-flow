import { IsOptional, IsUUID } from 'class-validator';

export class FindUsersQueryDto {
  /**
   * Restricts results to users who could still be assigned to this shift:
   * role EMPLOYEE, and not already assigned to it.
   */
  @IsOptional()
  @IsUUID()
  availableFor?: string;
}
