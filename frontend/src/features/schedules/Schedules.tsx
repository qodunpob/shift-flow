import React from 'react';
import { ScheduleList } from '@/components/schedule-list/ScheduleList';
import { PaginatedSchedules } from '@/lib/api/type-aliases';

export interface SchedulesProps {
  schedules: PaginatedSchedules;
}

export const Schedules: React.FC<SchedulesProps> = ({ schedules }) => {
  return <ScheduleList items={schedules.items} />;
};
