import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import { useApproveScheduleMutation } from '@/features/schedules/api/client-transition';

export const useApproveScheduleAction = (
  scheduleId: string,
  onSuccess: () => void,
) => {
  const t = useTranslations();
  const [isConfirming, setIsConfirming] = useState(false);
  const { mutate, isPending } = useApproveScheduleMutation();

  const confirm = () => {
    mutate(scheduleId, {
      onSuccess: () => {
        toast.success(t('ScheduleActions.success.approve'));
        onSuccess();
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
    requestApprove: () => setIsConfirming(true),
    cancel: () => setIsConfirming(false),
    confirm,
    isPending,
  };
};
