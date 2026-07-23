import React from 'react';
import { Schedule } from '@/lib/api/type-aliases';
import { ScheduleCard } from '@/components/schedule-card/ScheduleCard';
import { Stack } from '@mui/material';

export interface ScheduleListProps {
  items: Schedule[];
}

export const ScheduleList: React.FC<ScheduleListProps> = ({ items }) => {
  return (
    <Stack spacing={2}>
      {items.map((item) => (
        <ScheduleCard key={item.id} schedule={item} />
      ))}
    </Stack>
  );
};
