'use client';

import React, { useEffect, useState } from 'react';
import { ScheduleList } from '@/components/schedule-list/ScheduleList';
import {
  useMineFilter,
  usePage,
  useStatusFilter,
} from '@/hooks/useSearchParams';
import { Button, Pagination } from '@mui/material';
import { FlexBox } from '@/components/box/box';
import { useSchedulesQuery } from '@/features/schedules/api/client';
import {
  CurrentUser,
  PaginatedSchedules,
  ScheduleStatus,
} from '@/lib/api/types';
import { useTranslations } from 'next-intl';
import { CreateScheduleModal } from '@/features/create-schedule/CreateScheduleModal';
import { ScheduleFilters } from '@/features/schedules/ScheduleFilters';
import { isManager as getIsManager } from '@/utils/user';

export interface SchedulesProps {
  user: CurrentUser;
  schedules: PaginatedSchedules;
  page: number;
  status: ScheduleStatus | null;
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
  const [status, setStatus] = useStatusFilter();
  const [mine, setMine] = useMineFilter();
  const [isInitialMount, setIsInitialMount] = useState(true);

  useEffect(() => {
    // Disable the set-state-in-effect rule as this is an intentional pattern
    // to ensure initialData is only used on the first render
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsInitialMount(false);
  }, []);

  const isInitialFilter =
    page === initialPage && status === initialStatus && mine === initialMine;
  const { data: schedules = initialSchedules } = useSchedulesQuery(
    page,
    { status, mine },
    isInitialMount && isInitialFilter ? initialSchedules : undefined,
  );
  const t = useTranslations();
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const isManager = getIsManager(user.roles);

  const resetFiltersAndPage = () => {
    setPage(1);
    setStatus(null);
    setMine(false);
  };

  return (
    <>
      <FlexBox justifyContent="space-between">
        <ScheduleFilters isMineFilterVisible={isManager} />
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
          resetFiltersAndPage={resetFiltersAndPage}
        />
      )}
    </>
  );
};
