import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing';
import { ScheduleFilters } from '@/features/schedules/ScheduleFilters';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('features/schedules/ScheduleFilters', () => {
  it('should set the status query param and reset the page when a status is chosen', async () => {
    const onUrlUpdate = jest.fn();
    render(<ScheduleFilters />, {
      wrapper: withNuqsTestingAdapter({
        searchParams: '?page=3',
        onUrlUpdate,
      }),
    });

    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(within(screen.getByRole('listbox')).getByText('APPROVED'));

    await waitFor(() =>
      expect(onUrlUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({ queryString: '?status=APPROVED' }),
      ),
    );
  });

  it('should set the mine query param and reset the page when the switch is toggled on', async () => {
    const onUrlUpdate = jest.fn();
    render(<ScheduleFilters />, {
      wrapper: withNuqsTestingAdapter({
        searchParams: '?page=3',
        onUrlUpdate,
      }),
    });

    fireEvent.click(screen.getByRole('switch'));

    await waitFor(() =>
      expect(onUrlUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({ queryString: '?mine=true' }),
      ),
    );
  });
});
