import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import { useDeleteScheduleMutation } from '@/features/schedules/api/client';

export const useDeleteScheduleAction = (
  scheduleId: string,
  resetFiltersAndPage: () => void,
) => {
  const t = useTranslations();
  const [isConfirming, setIsConfirming] = useState(false);
  const { mutate, isPending } = useDeleteScheduleMutation();

  const confirm = () => {
    mutate(scheduleId, {
      onSuccess: () => {
        toast.success(t('ScheduleActions.success.deleted'));
        resetFiltersAndPage();
        setIsConfirming(false);
      },
      onError: () => {
        toast.error(t('commonErrors.generic'));
        setIsConfirming(false);
      },
    });
  };

  return {
    isConfirming,
    requestDelete: () => setIsConfirming(true),
    cancel: () => setIsConfirming(false),
    confirm,
    isPending,
  };
};
