import { Button } from '@mui/material';
import { ShiftFormModal } from '@/features/shift-form/ShiftFormModal';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { FlexBox } from '@/components/box/box';

export const ScheduleToolbar = () => {
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
      />
    </>
  );
};
