import { DEFAULT_PAGE_SIZE } from '@/constants/common';
import { getSchedulesFromServer } from '@/features/schedules/api/server';
import { apiFetchFromServer } from '@/lib/api/server/apiFetch';

jest.mock('@/lib/api/server/apiFetch', () => ({
  apiFetchFromServer: jest.fn(),
}));

const mockedApiFetchFromServer = apiFetchFromServer as jest.MockedFunction<
  typeof apiFetchFromServer
>;

describe('features/schedules/api/server', () => {
  beforeEach(() => {
    mockedApiFetchFromServer.mockReset();
  });

  it('should request schedules with only page and limit when no filter is given', async () => {
    await getSchedulesFromServer(1);

    expect(mockedApiFetchFromServer).toHaveBeenCalledWith('/schedules', {
      params: { page: 1, limit: DEFAULT_PAGE_SIZE },
    });
  });

  it('should include the status filter in the request params when provided', async () => {
    await getSchedulesFromServer(1, { status: 'APPROVED' });

    expect(mockedApiFetchFromServer).toHaveBeenCalledWith('/schedules', {
      params: { page: 1, limit: DEFAULT_PAGE_SIZE, status: 'APPROVED' },
    });
  });

  it('should include the mine filter in the request params only when true', async () => {
    await getSchedulesFromServer(1, { mine: true });

    expect(mockedApiFetchFromServer).toHaveBeenCalledWith('/schedules', {
      params: { page: 1, limit: DEFAULT_PAGE_SIZE, mine: true },
    });
  });

  it('should omit status and mine from the request params when not provided', async () => {
    await getSchedulesFromServer(1, { status: null, mine: false });

    expect(mockedApiFetchFromServer).toHaveBeenCalledWith('/schedules', {
      params: { page: 1, limit: DEFAULT_PAGE_SIZE },
    });
  });
});
