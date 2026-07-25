import React from 'react';
import { Card, CardContent, styled, Typography } from '@mui/material';
import { FlexBox } from '@/components/box/box';
import { ScheduleStatusChip } from '@/components/schedule-status-chip/ScheduleStatusChip';
import { useLocale } from 'next-intl';
import { Schedule } from '@/lib/api/types';
import Link from 'next/link';
import { routes } from '@/routes';
import { scheduleRange } from '@/utils/scheduleRange';

export interface ScheduleCardProps {
  schedule: Schedule;
}

export const ScheduleCard: React.FC<ScheduleCardProps> = ({ schedule }) => {
  const locale = useLocale();

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
                {scheduleRange(schedule, locale)}
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
