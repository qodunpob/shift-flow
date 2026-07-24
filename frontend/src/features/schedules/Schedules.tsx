'use client';

import React from 'react';
import { ScheduleList } from '@/components/schedule-list/ScheduleList';
import { PaginatedSchedules } from '@/lib/api/type-aliases';
import { usePage } from '@/hooks/useSearchParams';
import { Pagination } from '@mui/material';
import { FlexBox } from '@/components/box/box';
import { useSchedulesQuery } from '@/features/schedules/useSchedulesQuery';

export interface SchedulesProps {
  schedules: PaginatedSchedules;
  page: number;
}

export const Schedules: React.FC<SchedulesProps> = ({
  schedules: initialSchedules,
  page: initialPage,
}) => {
  const [page, setPage] = usePage();
  const { data: schedules } = useSchedulesQuery(
    page,
    page === initialPage ? initialSchedules : undefined,
  ) as { data: PaginatedSchedules };

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
