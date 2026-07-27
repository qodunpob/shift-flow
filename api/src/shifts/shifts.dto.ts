import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, Max, Min } from 'class-validator';
import { IsBeforeEndsAt } from '@/common/validators/is-before-ends-at.validator';

export class CreateShiftDto {
  @Type(() => Date)
  @IsDate()
  @IsBeforeEndsAt()
  startsAt: Date;

  @Type(() => Date)
  @IsDate()
  endsAt: Date;

  @Type(() => Number)
  @Min(1)
  @Max(10)
  @IsInt()
  requiredHeadcount: number;
}

export class UpdateShiftDto {
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  @IsBeforeEndsAt()
  startsAt?: Date;

  @Type(() => Date)
  @IsOptional()
  @IsDate()
  endsAt?: Date;

  @Type(() => Number)
  @IsOptional()
  @Min(1)
  @Max(10)
  @IsInt()
  requiredHeadcount?: number;
}
