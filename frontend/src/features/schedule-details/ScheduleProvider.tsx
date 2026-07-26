'use client';

import React, { createContext, useContext } from 'react';
import { Schedule } from '@/lib/api/types';

const ScheduleContext = createContext<Schedule | null>(null);

export interface ScheduleProviderProps {
  schedule: Schedule;
  children: React.ReactNode;
}

export const ScheduleProvider: React.FC<ScheduleProviderProps> = ({
  schedule,
  children,
}) => (
  <ScheduleContext.Provider value={schedule}>
    {children}
  </ScheduleContext.Provider>
);

export const useSchedule = (): Schedule => {
  const schedule = useContext(ScheduleContext);
  if (!schedule) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return schedule;
};
