import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { ConfirmScheduleActionDialog } from '../ConfirmScheduleActionDialog';

describe('features/schedule-actions/ConfirmScheduleActionDialog', () => {
  it('should show the title, schedule identity, and description when open', () => {
    render(
      <ConfirmScheduleActionDialog
        open
        title="Delete this schedule?"
        description="This can't be undone."
        scheduleIdentity="Week 32"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        isPending={false}
      />,
    );

    expect(screen.getByText('Delete this schedule?')).toBeInTheDocument();
    expect(screen.getByText('Week 32')).toBeInTheDocument();
    expect(screen.getByText("This can't be undone.")).toBeInTheDocument();
  });

  it('should call onConfirm when the confirm button is clicked', () => {
    const onConfirm = jest.fn();
    render(
      <ConfirmScheduleActionDialog
        open
        title="Delete this schedule?"
        description="This can't be undone."
        scheduleIdentity="Week 32"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
        isPending={false}
      />,
    );

    fireEvent.click(screen.getByText('Delete'));

    expect(onConfirm).toHaveBeenCalled();
  });

  it('should call onCancel when the cancel button is clicked', () => {
    const onCancel = jest.fn();
    render(
      <ConfirmScheduleActionDialog
        open
        title="Delete this schedule?"
        description="This can't be undone."
        scheduleIdentity="Week 32"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={jest.fn()}
        onCancel={onCancel}
        isPending={false}
      />,
    );

    fireEvent.click(screen.getByText('Cancel'));

    expect(onCancel).toHaveBeenCalled();
  });

  it('should disable the confirm button while pending', () => {
    render(
      <ConfirmScheduleActionDialog
        open
        title="Delete this schedule?"
        description="This can't be undone."
        scheduleIdentity="Week 32"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        isPending
      />,
    );

    expect(screen.getByText('Delete')).toBeDisabled();
  });
});
