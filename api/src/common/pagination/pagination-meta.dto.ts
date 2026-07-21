import { ApiProperty } from '@nestjs/swagger';
import { PaginationMeta } from './paginate';

/** Swagger-documented shape of the pagination metadata returned by any paginated endpoint. */
export class PaginationMetaDto implements PaginationMeta {
  @ApiProperty({
    description: 'Total number of matching rows across all pages.',
  })
  total: number;

  @ApiProperty({ description: '1-based page number that was returned.' })
  page: number;

  @ApiProperty({ description: 'Maximum number of items per page.' })
  limit: number;

  @ApiProperty({
    description:
      'Total number of pages for the current page size (0 when there are no rows).',
  })
  totalPages: number;
}
