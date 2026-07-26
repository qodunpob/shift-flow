import { Typography } from '@mui/material';
import { Shift } from '@/lib/api/types';
import React from 'react';
import { FlexBox } from '@/components/box/box';
import { UserAvatar } from '@/components/user-avatar/UserAvatar';

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
      <FlexBox>
        <Typography variant="body2" component="div">
          req: {shift.requiredHeadcount}
        </Typography>
        <Typography variant="body2" component="div">
          rem: {shift.spotsRemaining}
        </Typography>
      </FlexBox>
      <FlexBox gap={0.5} sx={{ my: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
        {shift.assignments.map(({ employee }) => (
          <UserAvatar key={employee.id} user={employee} size="small" />
        ))}
      </FlexBox>
    </>
  );
};
