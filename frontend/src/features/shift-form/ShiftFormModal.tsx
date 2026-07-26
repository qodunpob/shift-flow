'use client';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  Stack,
} from '@mui/material';
import React from 'react';
import { useTranslations } from 'next-intl';
import { useShiftForm } from '@/features/shift-form/useShiftForm';
import { DatePicker } from '@/components/date-picker/DatePicker';
import { FlexBox } from '@/components/box/box';
import { MaskedTextField } from '@/components/masked-text-field/MaskedTextField';
import { hasError } from '@/utils/formikHelpers';

const FORM_ID = 'shift-form';

export interface ShiftFormModalProps {
  open: boolean;
  onClose: () => void;
}

export const ShiftFormModal: React.FC<ShiftFormModalProps> = ({
  open,
  onClose,
}) => {
  const t = useTranslations();
  const formik = useShiftForm(() => {});

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>{t('ShiftForm.createTitle')}</DialogTitle>
      <DialogContent dividers>
        <Stack
          id={FORM_ID}
          component="form"
          spacing={2}
          onSubmit={formik.handleSubmit}
        >
          <FormControl error={hasError(formik, 'startsAt')}>
            <FlexBox>
              <Box sx={{ flexGrow: 1 }}>
                <DatePicker
                  label={t('labels.startsAt')}
                  name="startsAtDate"
                  required
                  value={formik.values.startsAt}
                  error={hasError(formik, 'startsAt')}
                  onChange={() => {}}
                  fullWidth
                />
              </Box>
              <MaskedTextField
                name="startsAtTime"
                sx={{ width: '100px' }}
                mask={'00:00'}
                placeholder={'08:00'}
              />
            </FlexBox>
            <FormHelperText> </FormHelperText>
          </FormControl>
          <FormControl error={hasError(formik, 'endsAt')}>
            <FlexBox>
              <Box sx={{ flexGrow: 1 }}>
                <DatePicker
                  label={t('labels.endsAt')}
                  name="endsAtDate"
                  required
                  value={formik.values.endsAt}
                  error={hasError(formik, 'endsAt')}
                  onChange={() => {}}
                  fullWidth
                />
              </Box>
              <MaskedTextField
                name="endsAtTime"
                sx={{ width: '100px' }}
                mask={'00:00'}
                placeholder={'08:00'}
              />
            </FlexBox>
            <FormHelperText> </FormHelperText>
          </FormControl>
          <FormControl required error={hasError(formik, 'requiredHeadcount')}>
            <InputLabel>{t('labels.requiredHeadcount')}</InputLabel>
            <MaskedTextField
              label={t('labels.requiredHeadcount')}
              name="requiredHeadcount"
              mask={'00'}
              value={String(formik.values.requiredHeadcount)}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <FormHelperText> </FormHelperText>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          {t('common.cancel')}
        </Button>
        <Button type="submit" form={FORM_ID} variant="contained">
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
