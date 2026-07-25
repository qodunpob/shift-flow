import React from 'react';
import { useTranslations } from 'next-intl';
import { Chip, ChipProps } from '@mui/material';
import { ScheduleStatus } from '@/lib/api/types';

export interface ScheduleStatusProps {
  status: ScheduleStatus;
}

const statusToColor: Record<ScheduleStatus, ChipProps['color']> = {
  DRAFT: 'default',
  IN_REVIEW: 'secondary',
  AWAITING_APPROVAL: 'info',
  APPROVED: 'success',
  REJECTED: 'warning',
};

export const ScheduleStatusChip: React.FC<ScheduleStatusProps> = ({
  status,
}) => {
  const t = useTranslations('Schedule.status');

  return <Chip label={t(status)} color={statusToColor[status]} />;
};
