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
import { useShiftFormHandler } from '@/features/shift-form/useShiftFormHandler';
import { DatePicker } from '@/components/date-picker/DatePicker';
import { FlexBox } from '@/components/box/box';
import { MaskedTextField } from '@/components/masked-text-field/MaskedTextField';
import { hasError } from '@/utils/formikHelpers';

const FORM_ID = 'shift-form';

export interface ShiftFormModalProps {
  open: boolean;
  onClose: () => void;
  scheduleId: string;
  timeZone: string;
}

export const ShiftFormModal: React.FC<ShiftFormModalProps> = ({
  open,
  onClose,
  scheduleId,
  timeZone,
}) => {
  const t = useTranslations();
  const { onSubmit, isPending } = useShiftFormHandler({
    scheduleId,
    timeZone,
    onClose,
    t,
  });
  const formik = useShiftForm(
    // `formik` is fully assigned by the time this callback ever runs
    // (only after a later user submit), so this self-reference is safe
    // despite the React Compiler lint rule's static TDZ heuristic.
    // eslint-disable-next-line react-hooks/immutability
    (values) => onSubmit(formik)(values),
  );

  const startsAtInvalid =
    hasError(formik, 'startsAtDate') || hasError(formik, 'startsAtTime');
  const endsAtInvalid =
    hasError(formik, 'endsAtDate') || hasError(formik, 'endsAtTime');

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
          <FormControl error={startsAtInvalid}>
            <FlexBox>
              <Box sx={{ flexGrow: 1 }}>
                <DatePicker
                  label={t('labels.startsAt')}
                  name="startsAtDate"
                  required
                  value={formik.values.startsAtDate}
                  error={startsAtInvalid}
                  onChange={(value) =>
                    formik.setFieldValue('startsAtDate', value)
                  }
                  onBlur={formik.handleBlur}
                  fullWidth
                />
              </Box>
              <MaskedTextField
                name="startsAtTime"
                sx={{ width: '100px' }}
                mask={'00:00'}
                placeholder={'08:00'}
                value={formik.values.startsAtTime}
                onAccept={(value) =>
                  formik.setFieldValue('startsAtTime', value)
                }
                onBlur={formik.handleBlur}
                error={startsAtInvalid}
              />
            </FlexBox>
            <FormHelperText>
              {startsAtInvalid ? t('ShiftForm.errors.startsAtRequired') : ' '}
            </FormHelperText>
          </FormControl>
          <FormControl error={endsAtInvalid}>
            <FlexBox>
              <Box sx={{ flexGrow: 1 }}>
                <DatePicker
                  label={t('labels.endsAt')}
                  name="endsAtDate"
                  required
                  value={formik.values.endsAtDate}
                  error={endsAtInvalid}
                  onChange={(value) =>
                    formik.setFieldValue('endsAtDate', value)
                  }
                  onBlur={formik.handleBlur}
                  fullWidth
                />
              </Box>
              <MaskedTextField
                name="endsAtTime"
                sx={{ width: '100px' }}
                mask={'00:00'}
                placeholder={'08:00'}
                value={formik.values.endsAtTime}
                onAccept={(value) => formik.setFieldValue('endsAtTime', value)}
                onBlur={formik.handleBlur}
                error={endsAtInvalid}
              />
            </FlexBox>
            <FormHelperText>
              {endsAtInvalid ? t('ShiftForm.errors.endsAtRequired') : ' '}
            </FormHelperText>
          </FormControl>
          <FormControl required error={hasError(formik, 'requiredHeadcount')}>
            <InputLabel>{t('labels.requiredHeadcount')}</InputLabel>
            <MaskedTextField
              label={t('labels.requiredHeadcount')}
              name="requiredHeadcount"
              mask={'00'}
              value={String(formik.values.requiredHeadcount)}
              onAccept={(value) =>
                formik.setFieldValue('requiredHeadcount', Number(value))
              }
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
        <Button
          type="submit"
          form={FORM_ID}
          variant="contained"
          disabled={isPending}
        >
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
