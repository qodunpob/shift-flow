import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing';
import React from 'react';
import { Schedules } from '@/features/schedules/Schedules';
import { apiFetchFromClient } from '@/lib/api/client/apiFetch';
import { CurrentUser, PaginatedSchedules } from '@/lib/api/types';
import { DEFAULT_PAGE_SIZE } from '@/constants/common';

jest.mock('@/lib/api/client/apiFetch', () => ({
  apiFetchFromClient: jest.fn(),
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/components/schedule-list/ScheduleList', () => ({
  ScheduleList: () => <div data-testid="schedule-list" />,
}));

let capturedResetFiltersAndPage: (() => void) | undefined;

jest.mock('@/features/schedule-form/ScheduleFormModal', () => ({
  ScheduleFormModal: ({
    resetFiltersAndPage,
  }: {
    resetFiltersAndPage: () => void;
  }) => {
    capturedResetFiltersAndPage = resetFiltersAndPage;
    return <div data-testid="schedule-form-modal" />;
  },
}));

const mockedApiFetchFromClient = apiFetchFromClient as jest.MockedFunction<
  typeof apiFetchFromClient
>;

const managerUser: CurrentUser = {
  id: 'manager-1',
  createdAt: '2026-07-20T00:00:00.000Z',
  createdBy: 'manager-1',
  updatedAt: '2026-07-20T00:00:00.000Z',
  updatedBy: 'manager-1',
  deletedAt: null,
  firstName: 'Manager',
  lastName: 'One',
  roles: ['MANAGER'],
};

const employeeUser: CurrentUser = {
  ...managerUser,
  id: 'employee-1',
  roles: ['EMPLOYEE'],
};

const emptySchedules: PaginatedSchedules = {
  items: [],
  meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
};

const renderSchedules = (user: CurrentUser, searchParams?: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  const NuqsWrapper = withNuqsTestingAdapter({ searchParams });
  return render(
    <QueryClientProvider client={queryClient}>
      <NuqsWrapper>
        <Schedules
          user={user}
          schedules={emptySchedules}
          page={1}
          status={null}
          mine={false}
        />
      </NuqsWrapper>
    </QueryClientProvider>,
  );
};

describe('features/schedules/Schedules', () => {
  beforeEach(() => {
    mockedApiFetchFromClient.mockReset();
    capturedResetFiltersAndPage = undefined;
  });

  it('should show the create button when the user is a manager', () => {
    renderSchedules(managerUser);

    expect(screen.getByText('common.create')).toBeInTheDocument();
  });

  it('should not show the create button when the user is not a manager', () => {
    renderSchedules(employeeUser);

    expect(screen.queryByText('common.create')).not.toBeInTheDocument();
  });

  it('should reset the page, status, and mine filters when resetFiltersAndPage is invoked', async () => {
    mockedApiFetchFromClient.mockResolvedValue(emptySchedules);
    renderSchedules(managerUser, '?page=3&status=APPROVED&mine=true');

    await waitFor(() =>
      expect(mockedApiFetchFromClient).toHaveBeenCalledWith('/schedules', {
        params: {
          page: 3,
          limit: DEFAULT_PAGE_SIZE,
          status: 'APPROVED',
          mine: true,
        },
      }),
    );

    await act(async () => {
      capturedResetFiltersAndPage?.();
    });

    await waitFor(() =>
      expect(mockedApiFetchFromClient).toHaveBeenCalledWith('/schedules', {
        params: { page: 1, limit: DEFAULT_PAGE_SIZE },
      }),
    );
  });
});
