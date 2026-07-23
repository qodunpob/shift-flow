import React from 'react';
import { Schedule } from '@/lib/api/type-aliases';
import { Card, CardContent, Typography } from '@mui/material';
import { FlexBox } from '@/components/box/box';
import { ScheduleStatus } from '@/components/schedule-status/ScheduleStatus';
import { format } from 'date-fns';
import { dateFormat } from '@/constants/dates';
import { useLocale } from 'next-intl';

export interface ScheduleCardProps {
  schedule: Schedule;
}

export const ScheduleCard: React.FC<ScheduleCardProps> = ({ schedule }) => {
  const locale = useLocale();
  return (
    <Card>
      <CardContent>
        <FlexBox justifyContent="space-between">
          <FlexBox alignItems="baseline">
            <Typography variant="subtitle2" component="div">
              {format(
                schedule.startsAt,
                dateFormat(locale).scheduleBoundaryDate,
              )}
              {' – '}
              {format(schedule.endsAt, dateFormat(locale).scheduleBoundaryDate)}
            </Typography>
            <Typography variant="h5" component="div">
              {schedule.label}
            </Typography>
          </FlexBox>
          <ScheduleStatus status={schedule.status} />
        </FlexBox>
      </CardContent>
    </Card>
  );
};
