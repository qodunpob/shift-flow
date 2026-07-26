import React from 'react';
import { ScheduleCard } from '@/components/schedule-card/ScheduleCard';
import { Stack } from '@mui/material';
import { Schedule } from '@/lib/api/types';

export interface ScheduleListProps {
  items: Schedule[];
  resetFiltersAndPage: () => void;
}

export const ScheduleList: React.FC<ScheduleListProps> = ({
  items,
  resetFiltersAndPage,
}) => {
  return (
    <Stack spacing={2}>
      {items.map((item) => (
        <ScheduleCard
          key={item.id}
          schedule={item}
          resetFiltersAndPage={resetFiltersAndPage}
        />
      ))}
    </Stack>
  );
};
