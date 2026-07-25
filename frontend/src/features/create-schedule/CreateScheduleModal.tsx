'use client';

import React, { useState } from 'react';
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
import { DateRange } from '@/components/date-range-picker/utils';

export interface CreateScheduleProps {
  open: boolean;
  onClose: () => void;
}

export const CreateScheduleModal: React.FC<CreateScheduleProps> = ({
  open,
  onClose,
}) => {
  const t = useTranslations();
  const timeZones = Intl.supportedValuesOf('timeZone');
  console.log('timeZones', timeZones);
  // Temporary local state until this form is wired up to Formik.
  const [dates, setDates] = useState<DateRange | null>(null);
  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>{t('CreateSchedule.title')}</DialogTitle>
      <DialogContent dividers>
        <Stack component="form" spacing={2}>
          <FormControl>
            <TextField label={t('labels.label')} />
          </FormControl>
          <DateRangePicker
            label={t('labels.dates')}
            name="dates"
            required
            value={dates}
            onChange={setDates}
          />
          <FormControl required>
            <Autocomplete
              options={timeZones}
              // value={timeZone}
              // onChange={(_, value) => setTimeZone(value ?? 'UTC')}
              renderInput={(params) => (
                <TextField {...params} label={t('labels.timeZone')} />
              )}
            />
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="contained">
          {t('common.create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
