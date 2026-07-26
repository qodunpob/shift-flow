import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { AssignEmployeeButton } from '@/features/shift-assignments/AssignEmployeeButton';
import { apiFetchFromClient } from '@/lib/api/client/apiFetch';
import { ApiError } from '@/lib/errors/ApiError';
import { toast } from 'react-toastify';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/lib/api/client/apiFetch', () => ({
  apiFetchFromClient: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockRouterRefresh = jest.fn();
jest.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ refresh: mockRouterRefresh, push: jest.fn() }),
}));

const mockedApiFetchFromClient = apiFetchFromClient as jest.MockedFunction<
  typeof apiFetchFromClient
>;

const availableEmployees = [
  { id: 'employee-1', firstName: 'Ada', lastName: 'Lovelace' },
  { id: 'employee-2', firstName: 'Grace', lastName: 'Hopper' },
];

const renderButton = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <AssignEmployeeButton shiftId="shift-1" />
    </QueryClientProvider>,
  );
};

const openMenu = () =>
  fireEvent.click(screen.getByText('ShiftAssignments.assign'));

describe('features/shift-assignments/AssignEmployeeButton', () => {
  beforeEach(() => {
    mockedApiFetchFromClient.mockReset();
    mockRouterRefresh.mockReset();
  });

  it('should not fetch available employees before the button is clicked', () => {
    renderButton();

    expect(mockedApiFetchFromClient).not.toHaveBeenCalled();
  });

  it('should list the available employees returned for this shift once opened', async () => {
    mockedApiFetchFromClient.mockResolvedValue(availableEmployees);
    renderButton();

    openMenu();

    await waitFor(() =>
      expect(mockedApiFetchFromClient).toHaveBeenCalledWith('/users', {
        params: { availableFor: 'shift-1' },
      }),
    );
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
  });

  it('should show a message when no employees are available', async () => {
    mockedApiFetchFromClient.mockResolvedValue([]);
    renderButton();

    openMenu();

    expect(
      await screen.findByText('ShiftAssignments.noAvailableEmployees'),
    ).toBeInTheDocument();
  });

  it('should assign the picked employee, notify the user, and refresh the page', async () => {
    mockedApiFetchFromClient
      .mockResolvedValueOnce(availableEmployees)
      .mockResolvedValueOnce({});
    renderButton();

    openMenu();
    fireEvent.click(await screen.findByText('Ada Lovelace'));

    await waitFor(() =>
      expect(mockedApiFetchFromClient).toHaveBeenCalledWith(
        '/shifts/shift-1/assignments',
        { method: 'POST', body: JSON.stringify({ employeeId: 'employee-1' }) },
      ),
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'ShiftAssignments.assignSuccess',
      ),
    );
    expect(mockRouterRefresh).toHaveBeenCalled();
  });

  it('should show a distinct error when assigning conflicts with existing state', async () => {
    mockedApiFetchFromClient
      .mockResolvedValueOnce(availableEmployees)
      .mockRejectedValueOnce(
        new ApiError(
          'Request to /shifts/shift-1/assignments failed with status 409',
          409,
        ),
      );
    renderButton();

    openMenu();
    fireEvent.click(await screen.findByText('Ada Lovelace'));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('commonErrors.conflict'),
    );
  });

  it('should show a generic error when assigning fails for another reason', async () => {
    mockedApiFetchFromClient
      .mockResolvedValueOnce(availableEmployees)
      .mockRejectedValueOnce(new Error('network down'));
    renderButton();

    openMenu();
    fireEvent.click(await screen.findByText('Ada Lovelace'));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('commonErrors.generic'),
    );
  });
});
