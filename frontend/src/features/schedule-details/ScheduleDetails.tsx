'use client';

import React from 'react';
import { TimeSheet } from '@/components/time-sheet/TimeSheet';
import { Schedule, Shift } from '@/lib/api/types';
import { Alert, AlertTitle, Typography } from '@mui/material';
import { scheduleRange } from '@/utils/scheduleRange';
import { useLocale, useTranslations } from 'next-intl';
import { ScheduleToolbar } from '@/components/schedule-toolbar/ScheduleToolbar';
import { FlexBox } from '@/components/box/box';
import { ScheduleStatusChip } from '@/components/schedule-status-chip/ScheduleStatusChip';
import { isManager, isMine } from '@/utils/user';
import { useCurrentUser } from '@/providers/CurrentUserProvider';

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
  const currentUser = useCurrentUser();
  const isScheduleOwner =
    isManager(currentUser.roles) && isMine(schedule.createdBy, currentUser.id);
  const isRejectionReasonVisible =
    isScheduleOwner &&
    schedule.status === 'REJECTED' &&
    schedule.rejectionReason;

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
      {isRejectionReasonVisible && (
        <Alert variant="filled" severity="warning">
          <AlertTitle>{t('labels.rejectionReason')}</AlertTitle>
          {schedule.rejectionReason}
        </Alert>
      )}
      <ScheduleToolbar schedule={schedule} />
      <TimeSheet schedule={schedule} shifts={shifts} />
    </>
  );
};
