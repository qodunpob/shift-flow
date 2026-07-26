import { Dialog, DialogContent, DialogTitle, Stack } from '@mui/material';
import React from 'react';
import { useTranslations } from 'next-intl';
import { useShiftForm } from '@/features/shift-form/useShiftForm';
import { DatePicker } from '@/components/date-picker/DatePicker';

const FORM_ID = 'shift-form';

export const ShiftFormModal = () => {
  const t = useTranslations();
  const formik = useShiftForm(() => {});

  return (
    <Dialog open={true} maxWidth="sm" fullWidth>
      <DialogTitle>{t('ShiftForm.createTitle')}</DialogTitle>
      <DialogContent dividers>
        <Stack
          id={FORM_ID}
          component="form"
          spacing={2}
          onSubmit={formik.handleSubmit}
        >
          <DatePicker value={null} onChange={() => {}} />
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
