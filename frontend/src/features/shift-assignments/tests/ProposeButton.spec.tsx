import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { ProposeButton } from '@/features/shift-assignments/ProposeButton';
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

const renderButton = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <ProposeButton shiftId="shift-1" />
    </QueryClientProvider>,
  );
};

describe('features/shift-assignments/ProposeButton', () => {
  beforeEach(() => {
    mockedApiFetchFromClient.mockReset();
    mockRouterRefresh.mockReset();
  });

  it('should send a proposal request with no message when clicked', async () => {
    mockedApiFetchFromClient.mockResolvedValue({});
    renderButton();

    fireEvent.click(screen.getByText('ShiftAssignments.propose'));

    await waitFor(() =>
      expect(mockedApiFetchFromClient).toHaveBeenCalledWith(
        '/shifts/shift-1/assignment-proposals',
        { method: 'POST', body: JSON.stringify({}) },
      ),
    );
  });

  it('should notify the user and refresh the page on success', async () => {
    mockedApiFetchFromClient.mockResolvedValue({});
    renderButton();

    fireEvent.click(screen.getByText('ShiftAssignments.propose'));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'ShiftAssignments.proposeSuccess',
      ),
    );
    expect(mockRouterRefresh).toHaveBeenCalled();
  });

  it('should show a distinct error when proposing conflicts with existing state', async () => {
    mockedApiFetchFromClient.mockRejectedValue(
      new ApiError(
        'Request to /shifts/shift-1/assignment-proposals failed with status 409',
        409,
      ),
    );
    renderButton();

    fireEvent.click(screen.getByText('ShiftAssignments.propose'));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('commonErrors.conflict'),
    );
  });

  it('should show a generic error when proposing fails for another reason', async () => {
    mockedApiFetchFromClient.mockRejectedValue(new Error('network down'));
    renderButton();

    fireEvent.click(screen.getByText('ShiftAssignments.propose'));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('commonErrors.generic'),
    );
  });
});
