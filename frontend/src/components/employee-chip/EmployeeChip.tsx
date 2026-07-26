import { UserAvatar } from '@/components/user-avatar/UserAvatar';
import { Typography } from '@mui/material';
import React from 'react';
import { Employee } from '@/lib/api/types';
import { FlexBox } from '@/components/box/box';

export interface EmployeeChipProps {
  employee: Employee;
}

export const EmployeeChip: React.FC<EmployeeChipProps> = ({ employee }) => (
  <FlexBox gap={1}>
    <UserAvatar user={employee} />
    <Typography variant="body2">
      {employee.firstName} {employee.lastName}
    </Typography>
  </FlexBox>
);
