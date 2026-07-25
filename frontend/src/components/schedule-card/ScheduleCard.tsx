import React from 'react';
import { Card, CardContent, styled, Typography } from '@mui/material';
import { FlexBox } from '@/components/box/box';
import { ScheduleStatus } from '@/components/schedule-status/ScheduleStatus';
import { DateTime } from 'luxon';
import { dateFormat } from '@/constants/dates';
import { useLocale } from 'next-intl';
import { Schedule } from '@/lib/api/types';

export interface ScheduleCardProps {
  schedule: Schedule;
}

export const ScheduleCard: React.FC<ScheduleCardProps> = ({ schedule }) => {
  const locale = useLocale();
  const formatDate = (date: string) =>
    DateTime.fromISO(date).toFormat(dateFormat(locale).scheduleBoundaryDate);
  return (
    <StyledCard>
      <CardContent>
        <FlexBox justifyContent="space-between">
          <FlexBox alignItems="baseline">
            <Typography variant="subtitle2" component="div">
              {formatDate(schedule.startsAt)}
              {' – '}
              {formatDate(schedule.endsAt)}
            </Typography>
            <Typography variant="h5" component="div">
              {schedule.label}
            </Typography>
          </FlexBox>
          <ScheduleStatus status={schedule.status} />
        </FlexBox>
      </CardContent>
    </StyledCard>
  );
};

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: `calc(${theme.shape.borderRadius}px + 8px)`,
}));
