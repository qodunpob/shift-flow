import { SelectQueryBuilder } from 'typeorm';
import { paginate } from '../paginate';

describe('common/paginate', () => {
  let queryBuilder: {
    skip: jest.Mock;
    take: jest.Mock;
    getManyAndCount: jest.Mock;
  };

  const asQuery = () => queryBuilder as unknown as SelectQueryBuilder<object>;

  beforeEach(() => {
    queryBuilder = {
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
  });

  it('should skip and take according to the requested page', async () => {
    await paginate(asQuery(), { page: 3, limit: 10 });

    // page 3 of size 10 skips the first 20 rows and takes 10.
    expect(queryBuilder.skip).toHaveBeenCalledWith(20);
    expect(queryBuilder.take).toHaveBeenCalledWith(10);
  });

  it('should return the items together with pagination metadata', async () => {
    const items = [{ id: 'a' }, { id: 'b' }];
    queryBuilder.getManyAndCount.mockResolvedValue([items, 25]);

    const result = await paginate(asQuery(), { page: 1, limit: 10 });

    expect(result).toEqual({
      items,
      meta: { total: 25, page: 1, limit: 10, totalPages: 3 },
    });
  });

  it('should report zero total pages when there are no matching rows', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

    const result = await paginate(asQuery(), { page: 1, limit: 10 });

    expect(result.meta).toEqual({
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });
  });
});
