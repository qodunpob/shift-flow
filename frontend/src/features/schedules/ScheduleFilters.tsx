'use client';

import React from 'react';
import {
  FormControlLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Switch,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { FlexBox } from '@/components/box/box';
import {
  useMineFilter,
  usePage,
  useStatusFilter,
} from '@/hooks/useSearchParams';
import { ScheduleStatus } from '@/lib/api/types';
import { scheduleStatuses } from '@/constants/common';

export interface ScheduleFiltersProps {
  isMineFilterVisible?: boolean;
}

export const ScheduleFilters: React.FC<ScheduleFiltersProps> = ({
  isMineFilterVisible,
}) => {
  const t = useTranslations('SchedulesPage.filters');
  const tStatus = useTranslations('Schedule.status');
  const [, setPage] = usePage();
  const [status, setStatus] = useStatusFilter();
  const [mine, setMine] = useMineFilter();

  const handleStatusChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    void setStatus(value === '' ? null : (value as ScheduleStatus));
    void setPage(1);
  };

  const handleMineChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    void setMine(event.target.checked);
    void setPage(1);
  };

  return (
    <FlexBox>
      <Select
        size="small"
        displayEmpty
        value={status ?? ''}
        onChange={handleStatusChange}
      >
        <MenuItem value="">{t('allStatuses')}</MenuItem>
        {scheduleStatuses.map((value) => (
          <MenuItem key={value} value={value}>
            {tStatus(value)}
          </MenuItem>
        ))}
      </Select>
      {isMineFilterVisible && (
        <FormControlLabel
          control={<Switch checked={mine} onChange={handleMineChange} />}
          label={t('mine')}
        />
      )}
    </FlexBox>
  );
};
