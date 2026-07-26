import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { ConfirmDialog } from '../ConfirmDialog';

describe('components/confirm-dialog/ConfirmDialog', () => {
  it('should show the title, identity, and description when open', () => {
    render(
      <ConfirmDialog
        open
        title="Delete this schedule?"
        description="This can't be undone."
        identity="Week 32"
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

  it('should not render an identity line when none is given', () => {
    render(
      <ConfirmDialog
        open
        title="Delete this schedule?"
        description="This can't be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        isPending={false}
      />,
    );

    expect(screen.queryByText('Week 32')).not.toBeInTheDocument();
  });

  it('should call onConfirm when the confirm button is clicked', () => {
    const onConfirm = jest.fn();
    render(
      <ConfirmDialog
        open
        title="Delete this schedule?"
        description="This can't be undone."
        identity="Week 32"
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
      <ConfirmDialog
        open
        title="Delete this schedule?"
        description="This can't be undone."
        identity="Week 32"
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
      <ConfirmDialog
        open
        title="Delete this schedule?"
        description="This can't be undone."
        identity="Week 32"
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
