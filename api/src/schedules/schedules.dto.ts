import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

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
  startsAt?: Date;

  @Type(() => Date)
  @IsOptional()
  @IsDate()
  endsAt?: Date;
}
