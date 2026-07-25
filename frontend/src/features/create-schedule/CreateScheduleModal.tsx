'use client';

import React from 'react';
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Stack,
  TextField,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { DateRangePicker } from '@/components/date-range-picker/DateRangePicker';
import { useCreateScheduleForm } from '@/features/create-schedule/useCreateScheduleForm';

export interface CreateScheduleProps {
  open: boolean;
  onClose: () => void;
}

const FORM_ID = 'create-schedule-form';
const TIME_ZONES = Intl.supportedValuesOf('timeZone');

export const CreateScheduleModal: React.FC<CreateScheduleProps> = ({
  open,
  onClose,
}) => {
  const t = useTranslations();
  const formik = useCreateScheduleForm(() => {
    onClose();
  });

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>{t('CreateSchedule.title')}</DialogTitle>
      <DialogContent dividers>
        <Stack
          id={FORM_ID}
          component="form"
          spacing={2}
          onSubmit={formik.handleSubmit}
        >
          <FormControl>
            <TextField
              label={t('labels.label')}
              name="label"
              value={formik.values.label}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              helperText=" "
            />
          </FormControl>
          <DateRangePicker
            label={t('labels.dates')}
            name="dates"
            required
            value={formik.values.dates}
            onChange={(value) => formik.setFieldValue('dates', value)}
            onBlur={() => formik.setFieldTouched('dates', true)}
            error={!!(formik.touched.dates && formik.errors.dates)}
            helperText={
              formik.touched.dates && formik.errors.dates
                ? t('CreateSchedule.errors.datesRequired')
                : ' '
            }
          />
          <FormControl required>
            <Autocomplete
              options={TIME_ZONES}
              value={formik.values.timeZone || null}
              onChange={(_, selected) =>
                formik.setFieldValue('timeZone', selected ?? '')
              }
              onBlur={() => formik.setFieldTouched('timeZone', true)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('labels.timeZone')}
                  error={!!(formik.touched.timeZone && formik.errors.timeZone)}
                  helperText={
                    formik.touched.timeZone && formik.errors.timeZone
                      ? t('CreateSchedule.errors.timeZoneRequired')
                      : ' '
                  }
                />
              )}
            />
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          {t('common.cancel')}
        </Button>
        <Button type="submit" form={FORM_ID} variant="contained">
          {t('common.create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
