import React, { useState } from 'react';
import { Button } from '@mui/material';
import { ShiftFormModal } from '@/features/shift-form/ShiftFormModal';
import { useTranslations } from 'next-intl';
import { FlexBox } from '@/components/box/box';
import { Schedule } from '@/lib/api/types';

export interface ScheduleToolbarProps {
  schedule: Pick<Schedule, 'id' | 'timeZone'>;
}

export const ScheduleToolbar: React.FC<ScheduleToolbarProps> = ({
  schedule,
}) => {
  const t = useTranslations();
  const [openShiftFormModal, setOpenShiftFormModal] = useState(false);
  return (
    <>
      <FlexBox>
        <Button variant="contained" onClick={() => setOpenShiftFormModal(true)}>
          {t('ScheduleDetailsPage.createShift')}
        </Button>
      </FlexBox>
      <ShiftFormModal
        open={openShiftFormModal}
        onClose={() => setOpenShiftFormModal(false)}
        scheduleId={schedule.id}
        timeZone={schedule.timeZone}
      />
    </>
  );
};
