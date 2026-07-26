'use client';

import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

export interface ConfirmScheduleActionDialogProps {
  open: boolean;
  title: string;
  description: string;
  scheduleIdentity: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

export const ConfirmScheduleActionDialog: React.FC<
  ConfirmScheduleActionDialogProps
> = ({
  open,
  title,
  description,
  scheduleIdentity,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isPending,
}) => (
  <Dialog open={open} onClose={isPending ? undefined : onCancel}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText component="div">
        <div>{scheduleIdentity}</div>
        <div>{description}</div>
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} variant="outlined" disabled={isPending}>
        {cancelLabel}
      </Button>
      <Button onClick={onConfirm} variant="contained" disabled={isPending}>
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);
