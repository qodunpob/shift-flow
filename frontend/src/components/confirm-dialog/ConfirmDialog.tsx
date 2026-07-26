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

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  identity?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  identity,
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
        {identity && <div>{identity}</div>}
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
