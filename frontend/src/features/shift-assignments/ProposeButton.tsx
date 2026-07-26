'use client';

import React from 'react';
import { Button } from '@mui/material';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import { StatusCodes } from 'http-status-codes';
import { useRouter } from '@/i18n/navigation';
import { ApiError } from '@/lib/errors/ApiError';
import { useCreateProposalMutation } from '@/features/shift-assignments/api/client';

export interface ProposeButtonProps {
  shiftId: string;
}

export const ProposeButton: React.FC<ProposeButtonProps> = ({ shiftId }) => {
  const t = useTranslations();
  const router = useRouter();
  const { mutate: createProposal, isPending } =
    useCreateProposalMutation(shiftId);

  const handlePropose = () => {
    createProposal(undefined, {
      onSuccess: () => {
        toast.success(t('ShiftAssignments.proposeSuccess'));
        router.refresh();
      },
      onError: (error) => {
        const isConflict =
          error instanceof ApiError &&
          error.statusCode === StatusCodes.CONFLICT;
        toast.error(
          isConflict ? t('commonErrors.conflict') : t('commonErrors.generic'),
        );
      },
    });
  };

  return (
    <Button variant="contained" onClick={handlePropose} disabled={isPending}>
      {t('ShiftAssignments.propose')}
    </Button>
  );
};
