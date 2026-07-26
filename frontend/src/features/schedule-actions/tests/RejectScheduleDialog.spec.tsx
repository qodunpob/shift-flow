import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { RejectScheduleDialog } from '../RejectScheduleDialog';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('features/schedule-actions/RejectScheduleDialog', () => {
  it('should show the title, schedule identity, and description when open', () => {
    render(
      <RejectScheduleDialog
        open
        scheduleIdentity="Week 32"
        rejectionReason=""
        onRejectionReasonChange={jest.fn()}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        isPending={false}
        canConfirm={false}
      />,
    );

    expect(
      screen.getByText('ScheduleActions.confirm.reject.title'),
    ).toBeInTheDocument();
    expect(screen.getByText('Week 32')).toBeInTheDocument();
    expect(
      screen.getByText('ScheduleActions.confirm.reject.description'),
    ).toBeInTheDocument();
  });

  it('should call onRejectionReasonChange when the reason field is typed into', () => {
    const onRejectionReasonChange = jest.fn();
    render(
      <RejectScheduleDialog
        open
        scheduleIdentity="Week 32"
        rejectionReason=""
        onRejectionReasonChange={onRejectionReasonChange}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        isPending={false}
        canConfirm={false}
      />,
    );

    fireEvent.change(screen.getByLabelText('labels.rejectionReason'), {
      target: { value: 'Understaffed' },
    });

    expect(onRejectionReasonChange).toHaveBeenCalledWith('Understaffed');
  });

  it('should disable the confirm button when canConfirm is false', () => {
    render(
      <RejectScheduleDialog
        open
        scheduleIdentity="Week 32"
        rejectionReason=""
        onRejectionReasonChange={jest.fn()}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        isPending={false}
        canConfirm={false}
      />,
    );

    expect(
      screen.getByText('ScheduleActions.confirm.reject.confirmLabel'),
    ).toBeDisabled();
  });

  it('should enable the confirm button when canConfirm is true and call onConfirm when clicked', () => {
    const onConfirm = jest.fn();
    render(
      <RejectScheduleDialog
        open
        scheduleIdentity="Week 32"
        rejectionReason="Understaffed"
        onRejectionReasonChange={jest.fn()}
        onConfirm={onConfirm}
        onCancel={jest.fn()}
        isPending={false}
        canConfirm
      />,
    );

    const confirmButton = screen.getByText(
      'ScheduleActions.confirm.reject.confirmLabel',
    );
    expect(confirmButton).not.toBeDisabled();

    fireEvent.click(confirmButton);

    expect(onConfirm).toHaveBeenCalled();
  });

  it('should call onCancel when the cancel button is clicked', () => {
    const onCancel = jest.fn();
    render(
      <RejectScheduleDialog
        open
        scheduleIdentity="Week 32"
        rejectionReason=""
        onRejectionReasonChange={jest.fn()}
        onConfirm={jest.fn()}
        onCancel={onCancel}
        isPending={false}
        canConfirm={false}
      />,
    );

    fireEvent.click(screen.getByText('common.cancel'));

    expect(onCancel).toHaveBeenCalled();
  });
});
