'use client';

import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material';
import { useTranslations } from 'next-intl';

export interface RejectScheduleDialogProps {
  open: boolean;
  scheduleIdentity: string;
  rejectionReason: string;
  onRejectionReasonChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
  canConfirm: boolean;
}

export const RejectScheduleDialog: React.FC<RejectScheduleDialogProps> = ({
  open,
  scheduleIdentity,
  rejectionReason,
  onRejectionReasonChange,
  onConfirm,
  onCancel,
  isPending,
  canConfirm,
}) => {
  const t = useTranslations();

  return (
    <Dialog open={open} onClose={isPending ? undefined : onCancel}>
      <DialogTitle>{t('ScheduleActions.confirm.reject.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText component="div">
          <div>{scheduleIdentity}</div>
          <div>{t('ScheduleActions.confirm.reject.description')}</div>
        </DialogContentText>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={2}
          sx={{ mt: 2 }}
          label={t('labels.rejectionReason')}
          value={rejectionReason}
          onChange={(event) => onRejectionReasonChange(event.target.value)}
          disabled={isPending}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} variant="outlined" disabled={isPending}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={isPending || !canConfirm}
        >
          {t('ScheduleActions.confirm.reject.confirmLabel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
