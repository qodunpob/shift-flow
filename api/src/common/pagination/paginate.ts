import { SelectQueryBuilder } from 'typeorm';

export interface PaginationMeta {
  /** Total number of matching rows across all pages. */
  total: number;
  /** 1-based page number that was returned. */
  page: number;
  /** Maximum number of items per page. */
  limit: number;
  /** Total number of pages for the current page size (0 when there are no rows). */
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Applies offset pagination to a query builder and returns the page of items
 * together with the metadata a client needs to render pagination controls.
 */
export async function paginate<T extends object>(
  query: SelectQueryBuilder<T>,
  { page, limit }: PaginationParams,
): Promise<Paginated<T>> {
  const [items, total] = await query
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  return {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
