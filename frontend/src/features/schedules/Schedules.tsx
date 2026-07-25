'use client';

import React, { useState } from 'react';
import { ScheduleList } from '@/components/schedule-list/ScheduleList';
import { usePage } from '@/hooks/useSearchParams';
import { Button, Pagination } from '@mui/material';
import { FlexBox } from '@/components/box/box';
import { useSchedulesQuery } from '@/features/schedules/api/client';
import { PaginatedSchedules } from '@/lib/api/types';
import { useTranslations } from 'next-intl';
import { CreateScheduleModal } from '@/features/create-schedule/CreateScheduleModal';

export interface SchedulesProps {
  isManager: boolean;
  schedules: PaginatedSchedules;
  page: number;
}

export const Schedules: React.FC<SchedulesProps> = ({
  isManager,
  schedules: initialSchedules,
  page: initialPage,
}) => {
  const [page, setPage] = usePage();
  const { data: schedules = initialSchedules } = useSchedulesQuery(
    page,
    page === initialPage ? initialSchedules : undefined,
  );
  const t = useTranslations();
  const [openCreateModal, setOpenCreateModal] = useState(false);

  return (
    <>
      <FlexBox justifyContent="space-between">
        <div>Filters Placeholder</div>
        {isManager && (
          <Button variant="contained" onClick={() => setOpenCreateModal(true)}>
            {t('common.create')}
          </Button>
        )}
      </FlexBox>
      <ScheduleList items={schedules.items} />
      {schedules.meta.totalPages > 1 && (
        <FlexBox justifyContent="center">
          <Pagination
            count={schedules.meta.totalPages}
            page={page}
            onChange={(e, nextPage) => setPage(nextPage)}
          />
        </FlexBox>
      )}
      {isManager && (
        <CreateScheduleModal
          open={openCreateModal}
          onClose={() => setOpenCreateModal(false)}
        />
      )}
    </>
  );
};
