import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import { ShiftFormModal } from '@/features/shift-form/ShiftFormModal';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }),
}));

// The calendar popover is irrelevant to this file - only the time field's
// real react-imask integration is under test here, so DatePicker is stubbed
// out but MaskedTextField is left real (every other ShiftFormModal test
// mocks it away, so this is the only coverage that exercises the actual
// masked-input library rather than just ShiftFormModal's own wiring).
jest.mock('@/components/date-picker/DatePicker', () => ({
  DatePicker: () => null,
}));

const renderModal = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <ShiftFormModal
        mode="create"
        open
        onClose={jest.fn()}
        scheduleId="schedule-9"
        timeZone="Asia/Tokyo"
      />
    </QueryClientProvider>,
  );
};

const typeDigits = (input: HTMLInputElement, digits: string) => {
  for (const digit of digits) {
    fireEvent.change(input, { target: { value: input.value + digit } });
  }
};

describe('features/shift-form/ShiftFormModal time input', () => {
  it('should keep a freshly typed time after the field is blurred', async () => {
    renderModal();
    const input = document.querySelector(
      'input[name="startsAtTime"]',
    ) as HTMLInputElement;

    typeDigits(input, '0800');
    fireEvent.blur(input);

    await waitFor(() => expect(input).toHaveValue('08:00'));
  });

  it('should keep a re-typed time after the field is blurred, not revert to the previously entered one', async () => {
    renderModal();
    const input = document.querySelector(
      'input[name="startsAtTime"]',
    ) as HTMLInputElement;

    typeDigits(input, '0800');
    fireEvent.blur(input);
    await waitFor(() => expect(input).toHaveValue('08:00'));

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '13:30' } });
    fireEvent.blur(input);

    await waitFor(() => expect(input).toHaveValue('13:30'));
  });
});
