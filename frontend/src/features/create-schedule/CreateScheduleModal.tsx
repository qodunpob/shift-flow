import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { useTranslations } from 'next-intl';

export interface CreateScheduleProps {
  open: boolean;
  onClose: () => void;
}

export const CreateSchedule: React.FC<CreateScheduleProps> = ({
  open,
  onClose,
}) => {
  const t = useTranslations('CreateSchedule');
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('title')}</DialogTitle>
      <DialogContent>
        <div>Modal Content</div>
      </DialogContent>
    </Dialog>
  );
};
