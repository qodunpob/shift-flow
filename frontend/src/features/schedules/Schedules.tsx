'use client';

import React, { useState } from 'react';
import { ScheduleList } from '@/components/schedule-list/ScheduleList';
import {
  useMineFilter,
  usePage,
  useStatusFilter,
} from '@/hooks/useSearchParams';
import { Button, Pagination } from '@mui/material';
import { FlexBox } from '@/components/box/box';
import { useSchedulesQuery } from '@/features/schedules/api/client';
import { CurrentUser, PaginatedSchedules, Schedule } from '@/lib/api/types';
import { useTranslations } from 'next-intl';
import { CreateScheduleModal } from '@/features/create-schedule/CreateScheduleModal';
import { ScheduleFilters } from '@/features/schedules/ScheduleFilters';
import { isManager as getIsManager } from '@/utils/user';

export interface SchedulesProps {
  user: CurrentUser;
  schedules: PaginatedSchedules;
  page: number;
  status: Schedule['status'] | null;
  mine: boolean;
}

export const Schedules: React.FC<SchedulesProps> = ({
  user,
  schedules: initialSchedules,
  page: initialPage,
  status: initialStatus,
  mine: initialMine,
}) => {
  const [page, setPage] = usePage();
  const [status] = useStatusFilter();
  const [mine] = useMineFilter();
  const isInitialFilter =
    page === initialPage && status === initialStatus && mine === initialMine;
  const { data: schedules = initialSchedules } = useSchedulesQuery(
    page,
    { status, mine },
    isInitialFilter ? initialSchedules : undefined,
  );
  const t = useTranslations();
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const isManager = getIsManager(user.roles);

  return (
    <>
      <FlexBox justifyContent="space-between">
        <ScheduleFilters />
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
