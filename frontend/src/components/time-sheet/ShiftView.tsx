import { Typography } from '@mui/material';
import { Shift } from '@/lib/api/types';
import React from 'react';
import { FlexBox } from '@/components/box/box';
import { UserAvatar } from '@/components/user-avatar/UserAvatar';
import PeopleIcon from '@mui/icons-material/People';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

export interface ShiftViewProps {
  timeLabel: string;
  shift: Shift;
}

export const ShiftView: React.FC<ShiftViewProps> = ({ timeLabel, shift }) => {
  return (
    <>
      <Typography variant="subtitle2" component="div">
        {timeLabel}
      </Typography>
      <FlexBox alignItems="baseline">
        <FlexBox gap={1}>
          <PeopleIcon />
          <Typography variant="body2" component="div">
            {shift.requiredHeadcount}
          </Typography>
        </FlexBox>
        <FlexBox gap={1}>
          <TaskAltIcon />
          <Typography variant="body2" component="div">
            {shift.filledCount}
          </Typography>
        </FlexBox>
      </FlexBox>
      <FlexBox gap={0.5} sx={{ my: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
        {shift.assignments.map(({ employee }) => (
          <UserAvatar key={employee.id} user={employee} size="small" />
        ))}
      </FlexBox>
    </>
  );
};
