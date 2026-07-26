import {
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import React from 'react';
import {
  ConfirmDialogProvider,
  useConfirmDialog,
} from '@/providers/ConfirmDialogProvider';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
);

const Trigger: React.FC<{
  onConfirm: () => Promise<void>;
  identity?: string;
}> = ({ onConfirm, identity }) => {
  const { confirm } = useConfirmDialog();
  return (
    <button
      onClick={() =>
        confirm({
          title: 'Delete this schedule?',
          description: "This can't be undone.",
          identity,
          confirmLabel: 'Delete',
          onConfirm,
        })
      }
    >
      trigger
    </button>
  );
};

describe('providers/ConfirmDialogProvider', () => {
  it('should throw when used outside a ConfirmDialogProvider', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => renderHook(() => useConfirmDialog())).toThrow(
      'useConfirmDialog must be used within a ConfirmDialogProvider',
    );

    consoleError.mockRestore();
  });

  it('should render no dialog content until confirm() is called', () => {
    render(<Trigger onConfirm={jest.fn()} />, { wrapper });

    expect(screen.queryByText('Delete this schedule?')).not.toBeInTheDocument();
  });

  it('should show the given title, description, and identity once confirm() is called', () => {
    render(<Trigger onConfirm={jest.fn()} identity="Week 32" />, { wrapper });

    fireEvent.click(screen.getByText('trigger'));

    expect(screen.getByText('Delete this schedule?')).toBeInTheDocument();
    expect(screen.getByText("This can't be undone.")).toBeInTheDocument();
    expect(screen.getByText('Week 32')).toBeInTheDocument();
  });

  it("should call the triggering caller's onConfirm and close once it settles", async () => {
    let resolveConfirm: () => void = () => {};
    const onConfirm = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveConfirm = resolve;
        }),
    );
    render(<Trigger onConfirm={onConfirm} />, { wrapper });

    fireEvent.click(screen.getByText('trigger'));
    fireEvent.click(screen.getByText('Delete'));

    expect(onConfirm).toHaveBeenCalled();
    expect(screen.getByText('Delete')).toBeDisabled();

    resolveConfirm();

    await waitFor(() =>
      expect(
        screen.queryByText('Delete this schedule?'),
      ).not.toBeInTheDocument(),
    );
  });

  it('should close without calling onConfirm when cancel is clicked', () => {
    const onConfirm = jest.fn();
    render(<Trigger onConfirm={onConfirm} />, { wrapper });

    fireEvent.click(screen.getByText('trigger'));
    fireEvent.click(screen.getByText('common.cancel'));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByText('Delete this schedule?')).not.toBeInTheDocument();
  });
});
