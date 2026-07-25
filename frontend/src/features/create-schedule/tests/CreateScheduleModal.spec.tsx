import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CreateScheduleModal } from '@/features/create-schedule/CreateScheduleModal';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fallback',
}));

// fireEvent.click on the submit button doesn't trigger its cross-referenced
// form (via the `form` attribute) in jsdom - only a real .click() does, per
// https://github.com/jsdom/jsdom's incomplete requestSubmit() support.
// Submitting the form directly is the reliable way to exercise this here;
// real browsers activate the button correctly.
const submitForm = () => fireEvent.submit(document.querySelector('form')!);

describe('features/create-schedule/CreateScheduleModal', () => {
  it('should not show validation errors before the fields are touched', () => {
    render(<CreateScheduleModal open onClose={jest.fn()} />);

    expect(
      screen.queryByText('CreateSchedule.errors.datesRequired'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('CreateSchedule.errors.timeZoneRequired'),
    ).not.toBeInTheDocument();
  });

  it('should show validation errors when submitting with empty required fields', async () => {
    render(<CreateScheduleModal open onClose={jest.fn()} />);

    submitForm();

    await waitFor(() => {
      expect(
        screen.getByText('CreateSchedule.errors.datesRequired'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('CreateSchedule.errors.timeZoneRequired'),
      ).toBeInTheDocument();
    });
  });

  it('should not close the modal while required fields are empty', async () => {
    const onClose = jest.fn();
    render(<CreateScheduleModal open onClose={onClose} />);

    submitForm();

    await waitFor(() => {
      expect(
        screen.getByText('CreateSchedule.errors.datesRequired'),
      ).toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
