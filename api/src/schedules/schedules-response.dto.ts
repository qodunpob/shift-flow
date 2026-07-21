import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ScheduleEntity } from '@/entities';
import { PaginationMetaDto } from '@/common/pagination/pagination-meta.dto';
import { ScheduleStats } from './schedule-stats.service';

/**
 * Swagger response model for a schedule enriched with its derived headcount
 * figures. Mirrors the {@link ScheduleView} type the service returns; the
 * `shifts` relation is omitted because these endpoints never load it.
 */
export class ScheduleViewDto
  extends OmitType(ScheduleEntity, ['shifts'] as const)
  implements ScheduleStats
{
  @ApiProperty({
    description: 'Sum of requiredHeadcount across every shift in the schedule.',
  })
  totalRequiredHeadcount: number;

  @ApiProperty({
    description: 'Assignments that have not been declined, across every shift.',
  })
  totalFilledCount: number;

  @ApiProperty({
    description: 'Assignments in the ACCEPTED state, across every shift.',
  })
  totalAcceptedCount: number;
}

/** Swagger response model for a paginated page of schedules. */
export class PaginatedSchedulesDto {
  @ApiProperty({ type: [ScheduleViewDto] })
  items: ScheduleViewDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
