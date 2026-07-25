import React from 'react';
import { useTranslations } from 'next-intl';
import { Chip, ChipProps } from '@mui/material';
import { Schedule } from '@/lib/api/types';

export interface ScheduleStatusProps {
  status: Schedule['status'];
}

const statusToColor: Record<Schedule['status'], ChipProps['color']> = {
  DRAFT: 'default',
  IN_REVIEW: 'secondary',
  AWAITING_APPROVAL: 'info',
  APPROVED: 'success',
  REJECTED: 'warning',
};

export const ScheduleStatus: React.FC<ScheduleStatusProps> = ({ status }) => {
  const t = useTranslations('Schedule.status');

  return <Chip label={t(status)} color={statusToColor[status]} />;
};
