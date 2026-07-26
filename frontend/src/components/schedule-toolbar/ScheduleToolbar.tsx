import { Box, Button } from '@mui/material';
import { ShiftFormModal } from '@/features/shift-form/ShiftFormModal';
import { useTranslations } from 'next-intl';

export const ScheduleToolbar = () => {
  const t = useTranslations();
  return (
    <>
      <Box>
        <Button variant="contained">
          {t('ScheduleDetailsPage.createShift')}
        </Button>
      </Box>
      <ShiftFormModal />
    </>
  );
};
