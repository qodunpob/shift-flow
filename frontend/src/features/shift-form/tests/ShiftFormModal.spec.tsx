import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { ShiftFormModal } from '@/features/shift-form/ShiftFormModal';
import { localDateTimeToZonedInstant } from '@/features/shift-form/zonedDateTime';
import { apiFetchFromClient } from '@/lib/api/client/apiFetch';
import { ApiError } from '@/lib/errors/ApiError';
import { toast } from 'react-toastify';
import { Shift } from '@/lib/api/types';

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

// Mocked to a plain button per date field - a real calendar popover isn't
// worth driving through jsdom here; ShiftFormModal's own wiring (which date
// value it forwards to which formik field) is what these tests exercise.
jest.mock('@/components/date-picker/DatePicker', () => ({
  DatePicker: ({
    name,
    onChange,
  }: {
    name: string;
    onChange: (value: Date | null) => void;
  }) => (
    <button type="button" onClick={() => onChange(new Date(2026, 7, 3))}>
      pick-{name}
    </button>
  ),
}));

// Mocked to a plain input - MaskedTextField's IMask-driven masking isn't
// worth driving through jsdom here; these tests exercise ShiftFormModal's
// own name/value/onAccept/onBlur wiring, not the masking library.
jest.mock('@/components/masked-text-field/MaskedTextField', () => ({
  MaskedTextField: ({
    name,
    value,
    onAccept,
    onBlur,
  }: {
    name: string;
    value: string;
    onAccept: (value: string) => void;
    onBlur: React.FocusEventHandler<HTMLInputElement>;
  }) => (
    <input
      aria-label={name}
      name={name}
      value={value}
      onChange={(e) => onAccept(e.target.value)}
      onBlur={onBlur}
    />
  ),
}));

const mockedApiFetchFromClient = apiFetchFromClient as jest.MockedFunction<
  typeof apiFetchFromClient
>;

beforeEach(() => {
  mockedApiFetchFromClient.mockReset();
  mockRouterRefresh.mockReset();
});

// fireEvent.click on the submit button doesn't trigger its cross-referenced
// form (via the `form` attribute) in jsdom - only a real .click() does, per
// https://github.com/jsdom/jsdom's incomplete requestSubmit() support.
const submitForm = () => fireEvent.submit(document.querySelector('form')!);

const fillForm = () => {
  fireEvent.click(screen.getByText('pick-startsAtDate'));
  fireEvent.change(screen.getByLabelText('startsAtTime'), {
    target: { value: '08:00' },
  });
  fireEvent.click(screen.getByText('pick-endsAtDate'));
  fireEvent.change(screen.getByLabelText('endsAtTime'), {
    target: { value: '16:30' },
  });
};

const renderModal = (
  props: Partial<{ open: boolean; onClose: () => void }> = {},
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const onClose = props.onClose ?? jest.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <ShiftFormModal
        mode="create"
        open
        {...props}
        onClose={onClose}
        scheduleId="schedule-9"
        timeZone="Asia/Tokyo"
      />
    </QueryClientProvider>,
  );
  return { onClose };
};

const baseShift: Shift = {
  id: 'shift-1',
  scheduleId: 'schedule-9',
  createdAt: '2026-07-20T00:00:00.000Z',
  createdBy: 'manager-1',
  updatedAt: '2026-07-20T00:00:00.000Z',
  updatedBy: 'manager-1',
  deletedAt: null,
  // 2026-08-02T23:00:00.000Z is 2026-08-03T08:00:00+09:00 in Tokyo.
  startsAt: '2026-08-02T23:00:00.000Z',
  // 2026-08-03T07:30:00.000Z is 2026-08-03T16:30:00+09:00 in Tokyo.
  endsAt: '2026-08-03T07:30:00.000Z',
  requiredHeadcount: 2,
  filledCount: 0,
  spotsRemaining: 2,
  assignments: [],
  proposals: [],
};

const renderEditModal = (
  props: Partial<{ shift: Shift; onClose: () => void }> = {},
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const onClose = props.onClose ?? jest.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <ShiftFormModal
        mode="edit"
        open
        shift={baseShift}
        {...props}
        onClose={onClose}
        timeZone="Asia/Tokyo"
      />
    </QueryClientProvider>,
  );
  return { onClose };
};

describe('features/shift-form/ShiftFormModal', () => {
  it('should send a shift create request combining each picked date with its typed time', async () => {
    mockedApiFetchFromClient.mockResolvedValue({ id: 'shift-1' });
    renderModal();

    fillForm();
    submitForm();

    await waitFor(() =>
      expect(mockedApiFetchFromClient).toHaveBeenCalledWith(
        '/schedules/schedule-9/shifts',
        {
          method: 'POST',
          body: JSON.stringify({
            startsAt: localDateTimeToZonedInstant(
              new Date(2026, 7, 3),
              '08:00',
              'Asia/Tokyo',
            ),
            endsAt: localDateTimeToZonedInstant(
              new Date(2026, 7, 3),
              '16:30',
              'Asia/Tokyo',
            ),
            requiredHeadcount: 1,
          }),
        },
      ),
    );
  });

  it('should close the modal and notify the user when creation succeeds', async () => {
    mockedApiFetchFromClient.mockResolvedValue({ id: 'shift-1' });
    const { onClose } = renderModal();

    fillForm();
    submitForm();

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('ShiftForm.success');
  });

  it('should refresh the page data when creation succeeds', async () => {
    mockedApiFetchFromClient.mockResolvedValue({ id: 'shift-1' });
    renderModal();

    fillForm();
    submitForm();

    await waitFor(() => expect(mockRouterRefresh).toHaveBeenCalled());
  });

  it('should show a distinct error and keep the modal open when the shift conflicts with an existing one', async () => {
    mockedApiFetchFromClient.mockRejectedValue(
      new ApiError(
        'Request to /schedules/schedule-9/shifts failed with status 409',
        409,
      ),
    );
    const { onClose } = renderModal();

    fillForm();
    submitForm();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('ShiftForm.errors.conflict'),
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should show a generic error when creation fails for a reason other than a conflict', async () => {
    mockedApiFetchFromClient.mockRejectedValue(new Error('network down'));
    const { onClose } = renderModal();

    fillForm();
    submitForm();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('commonErrors.generic'),
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  describe('edit mode', () => {
    it("should pre-fill the shift's times and headcount in the schedule's own time zone", () => {
      renderEditModal();

      expect(screen.getByLabelText('startsAtTime')).toHaveValue('08:00');
      expect(screen.getByLabelText('endsAtTime')).toHaveValue('16:30');
      expect(screen.getByLabelText('requiredHeadcount')).toHaveValue('2');
    });

    it('should send an update request to the given shift when submitted', async () => {
      mockedApiFetchFromClient.mockResolvedValue({ id: 'shift-1' });
      renderEditModal();

      submitForm();

      await waitFor(() =>
        expect(mockedApiFetchFromClient).toHaveBeenCalledWith(
          '/shifts/shift-1',
          {
            method: 'PUT',
            body: JSON.stringify({
              startsAt: localDateTimeToZonedInstant(
                new Date(2026, 7, 3),
                '08:00',
                'Asia/Tokyo',
              ),
              endsAt: localDateTimeToZonedInstant(
                new Date(2026, 7, 3),
                '16:30',
                'Asia/Tokyo',
              ),
              requiredHeadcount: 2,
            }),
          },
        ),
      );
    });

    it('should close the modal and notify the user when the update succeeds', async () => {
      mockedApiFetchFromClient.mockResolvedValue({ id: 'shift-1' });
      const { onClose } = renderEditModal();

      submitForm();

      await waitFor(() => expect(onClose).toHaveBeenCalled());
      expect(toast.success).toHaveBeenCalledWith('ShiftForm.updateSuccess');
    });
  });
});
