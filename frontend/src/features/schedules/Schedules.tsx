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
import { ScheduleFormModal } from '@/features/schedule-form/ScheduleFormModal';
import { ScheduleFilters } from '@/features/schedules/ScheduleFilters';
import { isManager } from '@/utils/user';

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
  const [openScheduleFormModal, setOpenScheduleFormModal] = useState(false);
  const isUserManager = isManager(user.roles);

  const resetFiltersAndPage = () => {
    void setPage(1);
    void setStatus(null);
    void setMine(false);
  };

  return (
    <>
      <FlexBox justifyContent="space-between">
        <ScheduleFilters isManager={isUserManager} />
        {isUserManager && (
          <Button
            variant="contained"
            onClick={() => setOpenScheduleFormModal(true)}
          >
            {t('common.create')}
          </Button>
        )}
      </FlexBox>
      <ScheduleList
        items={schedules.items}
        resetFiltersAndPage={resetFiltersAndPage}
      />
      {schedules.meta.totalPages > 1 && (
        <FlexBox justifyContent="center">
          <Pagination
            count={schedules.meta.totalPages}
            page={page}
            onChange={(e, nextPage) => setPage(nextPage)}
          />
        </FlexBox>
      )}
      {isUserManager && (
        <ScheduleFormModal
          mode="create"
          open={openScheduleFormModal}
          onClose={() => setOpenScheduleFormModal(false)}
          resetFiltersAndPage={resetFiltersAndPage}
        />
      )}
    </>
  );
};
