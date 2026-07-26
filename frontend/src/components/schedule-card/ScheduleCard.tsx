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
import { useCurrentUser } from '@/providers/CurrentUserProvider';
import { isMine } from '@/utils/user';
import { ScheduleActionsMenu } from '@/features/schedule-actions/ScheduleActionsMenu';

export interface ScheduleCardProps {
  schedule: Schedule;
  resetFiltersAndPage: () => void;
}

export const ScheduleCard: React.FC<ScheduleCardProps> = ({
  schedule,
  resetFiltersAndPage,
}) => {
  const locale = useLocale();
  const currentUser = useCurrentUser();
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
          <FlexBox alignItems="center">
            <ScheduleStatusChip status={schedule.status} />
            {isMine(schedule.createdBy, currentUser.id) && (
              <ScheduleActionsMenu
                schedule={schedule}
                resetFiltersAndPage={resetFiltersAndPage}
              />
            )}
          </FlexBox>
        </FlexBox>
      </CardContent>
    </StyledCard>
  );
};

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: `calc(${theme.shape.borderRadius}px + 8px)`,
}));
