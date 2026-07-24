'use client';

import React from 'react';
import { ScheduleList } from '@/components/schedule-list/ScheduleList';
import { PaginatedSchedules } from '@/lib/api/type-aliases';
import { usePage } from '@/hooks/useSearchParams';
import { Pagination } from '@mui/material';
import { FlexBox } from '@/components/box/box';

export interface SchedulesProps {
  schedules: PaginatedSchedules;
}

export const Schedules: React.FC<SchedulesProps> = ({ schedules }) => {
  const [page, setPage] = usePage();
  return (
    <>
      <ScheduleList items={schedules.items} />
      {schedules.meta.total > 1 && (
        <FlexBox justifyContent="center">
          <Pagination
            count={schedules.meta.totalPages}
            page={page}
            onChange={(e, nextPage) => setPage(nextPage)}
          />
        </FlexBox>
      )}
    </>
  );
};
