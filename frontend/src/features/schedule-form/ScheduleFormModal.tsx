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
import { useScheduleForm } from '@/features/schedule-form/useScheduleForm';
import { ScheduleFormValues } from '@/features/schedule-form/types';
import { zonedInstantToLocalDate } from '@/features/schedule-form/zonedDate';
import { unavailableDatesToDisabledMatcher } from '@/features/schedule-form/unavailableDates';
import { Schedule } from '@/lib/api/types';
import { useScheduleFormHandler } from '@/features/schedule-form/useScheduleFormHandler';
import { useUnavailableDatesQuery } from '@/features/schedules/api/client';
import { hasError } from '@/utils/formikHelpers';

interface CommonProps {
  open: boolean;
  onClose: () => void;
  resetFiltersAndPage: () => void;
}

export type ScheduleFormModalProps =
  | ({ mode: 'create' } & CommonProps)
  | ({ mode: 'edit'; schedule: Schedule } & CommonProps);

const FORM_ID = 'schedule-form';
const TIME_ZONES = Intl.supportedValuesOf('timeZone');

const initialValuesFor = (
  props: ScheduleFormModalProps,
): ScheduleFormValues => {
  if (props.mode === 'edit') {
    return {
      label: props.schedule.label ?? '',
      dates: {
        startsAt: zonedInstantToLocalDate(
          props.schedule.startsAt,
          props.schedule.timeZone,
        ),
        endsAt: zonedInstantToLocalDate(
          props.schedule.endsAt,
          props.schedule.timeZone,
        ),
      },
      timeZone: props.schedule.timeZone,
    };
  }
  return { label: '', dates: null, timeZone: '' };
};

export const ScheduleFormModal: React.FC<ScheduleFormModalProps> = (props) => {
  const { mode, open, onClose, resetFiltersAndPage } = props;
  const t = useTranslations();
  const { data: unavailableDates } = useUnavailableDatesQuery(open);
  const disabledDates = unavailableDatesToDisabledMatcher(
    unavailableDates ?? [],
    mode === 'edit' ? props.schedule.id : undefined,
  );
  const { onSubmit, isPending } = useScheduleFormHandler({
    mode,
    schedule: mode === 'edit' ? props.schedule : undefined,
    resetFiltersAndPage,
    onClose,
    t,
  });
  const formik = useScheduleForm(
    // `formik` is fully assigned by the time this callback ever runs
    // (only after a later user submit), so this self-reference is safe
    // despite the React Compiler lint rule's static TDZ heuristic.
    // eslint-disable-next-line react-hooks/immutability
    (values) => onSubmit(formik)(values),
    initialValuesFor(props),
  );

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'create'
          ? t('CreateSchedule.title')
          : t('CreateSchedule.editTitle')}
      </DialogTitle>
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
            error={hasError(formik, 'dates')}
            helperText={
              hasError(formik, 'dates')
                ? t('CreateSchedule.errors.datesRequired')
                : ' '
            }
            disabledDates={disabledDates}
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
                  error={hasError(formik, 'timeZone')}
                  helperText={
                    hasError(formik, 'timeZone')
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
