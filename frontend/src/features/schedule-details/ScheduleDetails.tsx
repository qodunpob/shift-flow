'use client';

import React from 'react';
import { TimeSheet } from '@/components/time-sheet/TimeSheet';
import { Schedule, Shift } from '@/lib/api/types';
import { Typography } from '@mui/material';
import { scheduleRange } from '@/utils/scheduleRange';
import { useLocale, useTranslations } from 'next-intl';
import { ScheduleToolbar } from '@/components/schedule-toolbar/ScheduleToolbar';
import { FlexBox } from '@/components/box/box';
import { ScheduleStatusChip } from '@/components/schedule-status-chip/ScheduleStatusChip';

export interface ScheduleDetailsProps {
  schedule: Schedule;
  shifts: Shift[];
}

export const ScheduleDetails: React.FC<ScheduleDetailsProps> = ({
  schedule,
  shifts,
}) => {
  const locale = useLocale();
  const t = useTranslations();

  return (
    <>
      <FlexBox>
        <Typography variant="h6" component="div">
          {scheduleRange(schedule, locale)}
        </Typography>
        <Typography variant="body2" component="div" sx={{ flexGrow: 1 }}>
          ({t('labels.timeZone')}: {schedule.timeZone})
        </Typography>
        <ScheduleStatusChip status={schedule.status} />
      </FlexBox>
      <ScheduleToolbar schedule={schedule} />
      <TimeSheet schedule={schedule} shifts={shifts} />
    </>
  );
};
