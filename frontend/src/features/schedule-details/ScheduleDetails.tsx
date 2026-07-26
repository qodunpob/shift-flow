'use client';

import React from 'react';
import { TimeSheet } from '@/components/time-sheet/TimeSheet';
import { Schedule, Shift } from '@/lib/api/types';
import { Typography } from '@mui/material';
import { scheduleRange } from '@/utils/scheduleRange';
import { useLocale } from 'next-intl';

export interface ScheduleDetailsProps {
  schedule: Schedule;
  shifts: Shift[];
}

export const ScheduleDetails: React.FC<ScheduleDetailsProps> = ({
  schedule,
  shifts,
}) => {
  const locale = useLocale();
  return (
    <>
      <Typography variant="h6" component="div">
        {scheduleRange(schedule, locale)}
      </Typography>

      <TimeSheet schedule={schedule} shifts={shifts} />
    </>
  );
};
