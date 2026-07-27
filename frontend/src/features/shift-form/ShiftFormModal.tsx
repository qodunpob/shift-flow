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
import { zonedInstantToLocalDateTime } from '@/features/shift-form/zonedDateTime';
import { DatePicker } from '@/components/date-picker/DatePicker';
import { FlexBox } from '@/components/box/box';
import { MaskedTextField } from '@/components/masked-text-field/MaskedTextField';
import { hasError } from '@/utils/formikHelpers';
import { Shift } from '@/lib/api/types';
import { ShiftFormValues } from '@/features/shift-form/types';
import { ENDS_BEFORE_STARTS_ERROR } from '@/features/shift-form/validation-schema';

const FORM_ID = 'shift-form';

interface CommonProps {
  open: boolean;
  onClose: () => void;
  timeZone: string;
}

export type ShiftFormModalProps =
  | ({ mode: 'create'; scheduleId: string } & CommonProps)
  | ({ mode: 'edit'; shift: Shift } & CommonProps);

const initialValuesFor = (
  props: ShiftFormModalProps,
): ShiftFormValues | undefined => {
  if (props.mode !== 'edit') {
    return undefined;
  }
  const startsAt = zonedInstantToLocalDateTime(
    props.shift.startsAt,
    props.timeZone,
  );
  const endsAt = zonedInstantToLocalDateTime(
    props.shift.endsAt,
    props.timeZone,
  );
  return {
    startsAtDate: startsAt.date,
    startsAtTime: startsAt.time,
    endsAtDate: endsAt.date,
    endsAtTime: endsAt.time,
    requiredHeadcount: props.shift.requiredHeadcount,
  };
};

export const ShiftFormModal: React.FC<ShiftFormModalProps> = (props) => {
  const { mode, open, onClose, timeZone } = props;
  const t = useTranslations();
  const { onSubmit, isPending } = useShiftFormHandler({
    mode,
    scheduleId: mode === 'create' ? props.scheduleId : undefined,
    shiftId: mode === 'edit' ? props.shift.id : undefined,
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
    initialValuesFor(props),
  );

  const startsAtInvalid =
    hasError(formik, 'startsAtDate') || hasError(formik, 'startsAtTime');
  const endsAtInvalid =
    hasError(formik, 'endsAtDate') || hasError(formik, 'endsAtTime');
  const endsBeforeStarts =
    formik.errors.endsAtDate === ENDS_BEFORE_STARTS_ERROR;

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'create'
          ? t('ShiftForm.createTitle')
          : t('ShiftForm.editTitle')}
      </DialogTitle>
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
              {endsAtInvalid
                ? endsBeforeStarts
                  ? t('ShiftForm.errors.endsBeforeStarts')
                  : t('ShiftForm.errors.endsAtRequired')
                : ' '}
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
          {mode === 'create' ? t('common.create') : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
