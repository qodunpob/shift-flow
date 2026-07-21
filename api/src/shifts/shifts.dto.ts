import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateShiftDto {
  @Type(() => Date)
  @IsDate()
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
