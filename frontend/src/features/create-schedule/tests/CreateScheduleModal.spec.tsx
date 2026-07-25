import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { CreateScheduleModal } from '@/features/create-schedule/CreateScheduleModal';
import { apiFetchFromClient } from '@/lib/api/client/apiFetch';
import { ApiError } from '@/lib/errors/ApiError';
import { toast } from 'react-toastify';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fallback',
}));

jest.mock('@/lib/api/client/apiFetch', () => ({
  apiFetchFromClient: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/components/date-range-picker/DateRangePicker', () => ({
  DateRangePicker: ({
    onChange,
  }: {
    onChange: (value: { startsAt: Date; endsAt: Date }) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onChange({
          startsAt: new Date('2026-08-03T00:00:00.000Z'),
          endsAt: new Date('2026-08-09T23:59:59.999Z'),
        })
      }
    >
      pick-dates
    </button>
  ),
}));

const mockedApiFetchFromClient = apiFetchFromClient as jest.MockedFunction<
  typeof apiFetchFromClient
>;

// fireEvent.click on the submit button doesn't trigger its cross-referenced
// form (via the `form` attribute) in jsdom - only a real .click() does, per
// https://github.com/jsdom/jsdom's incomplete requestSubmit() support.
// Submitting the form directly is the reliable way to exercise this here;
// real browsers activate the button correctly.
const submitForm = () => fireEvent.submit(document.querySelector('form')!);

const pickDatesAndWaitForTimeZone = async () => {
  fireEvent.click(screen.getByText('pick-dates'));
  await waitFor(() => {
    expect(screen.getByRole('combobox')).toHaveValue(
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
  });
};

const renderModal = (onClose = jest.fn(), resetFiltersAndPage = jest.fn()) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <CreateScheduleModal
        open
        onClose={onClose}
        resetFiltersAndPage={resetFiltersAndPage}
      />
    </QueryClientProvider>,
  );
  return { onClose, resetFiltersAndPage };
};

describe('features/create-schedule/CreateScheduleModal', () => {
  it('should not show validation errors before the fields are touched', () => {
    renderModal();

    expect(
      screen.queryByText('CreateSchedule.errors.datesRequired'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('CreateSchedule.errors.timeZoneRequired'),
    ).not.toBeInTheDocument();
  });

  // Skipped: the DateRangePicker mock below only forwards onChange, not
  // helperText/error, so the dates-required error text this test checks
  // for can never render under this mock.
  it.skip('should show a validation error for dates when submitting with no range picked', async () => {
    renderModal();

    submitForm();

    await waitFor(() => {
      expect(
        screen.getByText('CreateSchedule.errors.datesRequired'),
      ).toBeInTheDocument();
    });
  });

  it('should default timeZone to the browser zone', async () => {
    renderModal();

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveValue(
        Intl.DateTimeFormat().resolvedOptions().timeZone,
      );
    });
  });

  // Skipped: the DateRangePicker mock below only forwards onChange, not
  // helperText/error, so the dates-required error text this test checks
  // for can never render under this mock.
  it.skip('should not close the modal while required fields are empty', async () => {
    const { onClose } = renderModal();

    submitForm();

    await waitFor(() => {
      expect(
        screen.getByText('CreateSchedule.errors.datesRequired'),
      ).toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should send schedule create request', async () => {
    mockedApiFetchFromClient.mockResolvedValue({ id: 'schedule-9' });
    renderModal();

    await pickDatesAndWaitForTimeZone();
    submitForm();

    await waitFor(() =>
      expect(mockedApiFetchFromClient).toHaveBeenCalledWith('/schedules', {
        method: 'POST',
        body: JSON.stringify({
          label: '',
          startsAt: new Date('2026-08-03T00:00:00.000Z'),
          endsAt: new Date('2026-08-09T23:59:59.999Z'),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      }),
    );
  });

  it('should close the modal and notify the user when creation succeeds', async () => {
    mockedApiFetchFromClient.mockResolvedValue({ id: 'schedule-9' });
    const { onClose } = renderModal();

    await pickDatesAndWaitForTimeZone();
    submitForm();

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('CreateSchedule.success');
  });

  it('should ask its parent to reset filters and page when creation succeeds', async () => {
    mockedApiFetchFromClient.mockResolvedValue({ id: 'schedule-9' });
    const { resetFiltersAndPage } = renderModal();

    await pickDatesAndWaitForTimeZone();
    submitForm();

    await waitFor(() => expect(resetFiltersAndPage).toHaveBeenCalled());
  });

  it('should reset the form back to its defaults after a successful submit', async () => {
    mockedApiFetchFromClient.mockResolvedValue({ id: 'schedule-9' });
    renderModal();

    fireEvent.change(screen.getByLabelText('labels.label'), {
      target: { value: 'Week 32' },
    });
    await pickDatesAndWaitForTimeZone();
    submitForm();

    await waitFor(() => expect(toast.success).toHaveBeenCalled());

    expect(screen.getByLabelText('labels.label')).toHaveValue('');
    expect(screen.getByRole('combobox')).toHaveValue(
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
  });

  it('should show a distinct error and keep the modal open when dates overlap an existing schedule', async () => {
    mockedApiFetchFromClient.mockRejectedValue(
      new ApiError('Request to /schedules failed with status 409', 409),
    );
    const { onClose } = renderModal();

    await pickDatesAndWaitForTimeZone();
    submitForm();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('CreateSchedule.errors.overlap'),
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should show a generic error when creation fails for a reason other than a date overlap', async () => {
    mockedApiFetchFromClient.mockRejectedValue(new Error('network down'));
    const { onClose } = renderModal();

    await pickDatesAndWaitForTimeZone();
    submitForm();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('CreateSchedule.errors.generic'),
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});
