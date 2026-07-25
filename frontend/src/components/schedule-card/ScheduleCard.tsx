import React from 'react';
import { Card, CardContent, styled, Typography } from '@mui/material';
import { FlexBox } from '@/components/box/box';
import { ScheduleStatusChip } from '@/components/schedule-status-chip/ScheduleStatusChip';
import { DateTime } from 'luxon';
import { dateFormat } from '@/constants/dates';
import { useLocale } from 'next-intl';
import { Schedule } from '@/lib/api/types';
import Link from 'next/link';
import { routes } from '@/routes';

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
          <Link href={routes.scheduleDetails(schedule.id)}>
            <FlexBox alignItems="baseline">
              <Typography
                variant={schedule.label ? 'subtitle2' : 'h5'}
                component="div"
              >
                {formatDate(schedule.startsAt)}
                {' – '}
                {formatDate(schedule.endsAt)}
              </Typography>
              {schedule.label && (
                <Typography variant="h5" component="div">
                  {schedule.label}
                </Typography>
              )}
            </FlexBox>
          </Link>
          <ScheduleStatusChip status={schedule.status} />
        </FlexBox>
      </CardContent>
    </StyledCard>
  );
};

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: `calc(${theme.shape.borderRadius}px + 8px)`,
}));
