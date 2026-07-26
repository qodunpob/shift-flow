import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import { useRejectScheduleMutation } from '@/features/schedules/api/client-transition';

export const useRejectScheduleAction = (
  scheduleId: string,
  onSuccess: () => void,
) => {
  const t = useTranslations();
  const [isConfirming, setIsConfirming] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const { mutate, isPending } = useRejectScheduleMutation();

  const reset = () => {
    setIsConfirming(false);
    setRejectionReason('');
  };

  const confirm = () => {
    mutate(
      { scheduleId, rejectionReason },
      {
        onSuccess: () => {
          toast.success(t('ScheduleActions.success.reject'));
          onSuccess();
          reset();
        },
        onError: () => {
          toast.error(t('commonErrors.generic'));
          setIsConfirming(false);
        },
      },
    );
  };

  return {
    isConfirming,
    rejectionReason,
    setRejectionReason,
    canConfirm: rejectionReason.trim().length > 0,
    requestReject: () => setIsConfirming(true),
    cancel: reset,
    confirm,
    isPending,
  };
};
