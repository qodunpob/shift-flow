import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ScheduleStatus } from '@/entities';
import { PaginationQueryDto } from '@/common/pagination/pagination-query.dto';
import { IsValidTimeZone } from '@/common/validators/is-valid-timezone.validator';
import { RequireTimeZone } from '@/common/validators/require-timezone.validator';

export class CreateScheduleDto {
  @IsOptional()
  @IsString()
  label?: string | null;

  @Type(() => Date)
  @IsDate()
  startsAt: Date;

  @Type(() => Date)
  @IsDate()
  endsAt: Date;

  @IsString()
  @IsNotEmpty()
  @IsValidTimeZone()
  timeZone: string;
}

export class FindSchedulesQueryDto extends PaginationQueryDto {
  /** Restrict results to a single lifecycle status. */
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;

  /** When true, return only schedules owned (created) by the current user. */
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined ? undefined : value === 'true' || value === true,
  )
  @IsBoolean()
  mine?: boolean;
}

export class RejectScheduleDto {
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}

export class UpdateScheduleDto {
  @IsOptional()
  @IsString()
  label?: string | null;

  @Type(() => Date)
  @IsOptional()
  @IsDate()
  @RequireTimeZone()
  startsAt?: Date;

  @Type(() => Date)
  @IsOptional()
  @IsDate()
  @RequireTimeZone()
  endsAt?: Date;

  @IsOptional()
  @IsValidTimeZone()
  timeZone?: string;
}
