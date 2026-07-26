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
import { StatusCodes } from 'http-status-codes';
import { toast } from 'react-toastify';
import { DateRangePicker } from '@/components/date-range-picker/DateRangePicker';
import { useScheduleForm } from '@/features/schedule-form/useScheduleForm';
import { CreateScheduleFormValues } from '@/features/schedule-form/schema';
import {
  localDateToZonedInstant,
  zonedInstantToLocalDate,
} from '@/features/schedule-form/zonedDate';
import {
  useCreateScheduleMutation,
  useUpdateScheduleMutation,
} from '@/features/schedules/api/client';
import { ApiError } from '@/lib/errors/ApiError';
import { Schedule } from '@/lib/api/types';

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
): CreateScheduleFormValues => {
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
  const { mutate: createSchedule, isPending: isCreating } =
    useCreateScheduleMutation();
  const { mutate: updateSchedule, isPending: isUpdating } =
    useUpdateScheduleMutation();
  const isPending = isCreating || isUpdating;

  const formik = useScheduleForm((values) => {
    const input = {
      label: values.label,
      startsAt: localDateToZonedInstant(
        values.dates!.startsAt,
        values.timeZone,
      ),
      endsAt: localDateToZonedInstant(values.dates!.endsAt, values.timeZone),
      timeZone: values.timeZone,
    };

    const onSuccess = () => {
      toast.success(
        mode === 'create'
          ? t('CreateSchedule.success')
          : t('ScheduleActions.success.updated'),
      );
      // `formik` is fully assigned by the time this callback ever runs
      // (only after a later user submit), so this self-reference is safe
      // despite the React Compiler lint rule's static TDZ heuristic.
      // eslint-disable-next-line react-hooks/immutability
      formik.resetForm();
      resetFiltersAndPage();
      onClose();
    };
    const onError = (error: Error) => {
      toast.error(
        error instanceof ApiError && error.statusCode === StatusCodes.CONFLICT
          ? t('CreateSchedule.errors.overlap')
          : t('CreateSchedule.errors.generic'),
      );
    };

    if (mode === 'create') {
      createSchedule(input, { onSuccess, onError });
    } else {
      updateSchedule(
        { id: props.schedule.id, ...input },
        { onSuccess, onError },
      );
    }
  }, initialValuesFor(props));

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
