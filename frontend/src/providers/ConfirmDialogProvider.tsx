'use client';

import React, { createContext, useContext, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/components/confirm-dialog/ConfirmDialog';

export interface ConfirmDialogParams {
  title: string;
  description: string;
  identity?: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
}

interface ConfirmDialogContextValue {
  confirm: (params: ConfirmDialogParams) => void;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(
  null,
);

export interface ConfirmDialogProviderProps {
  children: React.ReactNode;
}

export const ConfirmDialogProvider: React.FC<ConfirmDialogProviderProps> = ({
  children,
}) => {
  const t = useTranslations();
  const [params, setParams] = useState<ConfirmDialogParams | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Every caller's onConfirm settles the same way today (toast + close,
  // whether the mutation succeeds or fails), so closing here on either
  // outcome matches existing behavior instead of leaving error handling
  // to a second, dialog-specific mechanism.
  const handleConfirm = async () => {
    if (!params) return;
    setIsPending(true);
    try {
      await params.onConfirm();
    } finally {
      setIsPending(false);
      setParams(null);
    }
  };

  const handleCancel = () => {
    if (isPending) return;
    setParams(null);
  };

  return (
    <ConfirmDialogContext.Provider
      value={{ confirm: (next) => setParams(next) }}
    >
      {children}
      <ConfirmDialog
        open={!!params}
        title={params?.title ?? ''}
        description={params?.description ?? ''}
        identity={params?.identity}
        confirmLabel={params?.confirmLabel ?? ''}
        cancelLabel={t('common.cancel')}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isPending={isPending}
      />
    </ConfirmDialogContext.Provider>
  );
};

export const useConfirmDialog = (): ConfirmDialogContextValue => {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) {
    throw new Error(
      'useConfirmDialog must be used within a ConfirmDialogProvider',
    );
  }
  return ctx;
};
