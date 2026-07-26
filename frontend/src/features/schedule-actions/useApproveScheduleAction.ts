import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import { useApproveScheduleMutation } from '@/features/schedules/api/client-transition';
import { useConfirmDialog } from '@/providers/ConfirmDialogProvider';

export const useApproveScheduleAction = (
  scheduleId: string,
  identity: string,
  onSuccess: () => void,
) => {
  const t = useTranslations();
  const { confirm } = useConfirmDialog();
  const { mutate, isPending } = useApproveScheduleMutation();

  const requestApprove = () => {
    confirm({
      title: t('ScheduleActions.confirm.approve.title'),
      description: t('ScheduleActions.confirm.approve.description'),
      identity,
      confirmLabel: t('ScheduleActions.confirm.approve.confirmLabel'),
      onConfirm: () =>
        new Promise<void>((resolve) => {
          mutate(scheduleId, {
            onSuccess: () => {
              toast.success(t('ScheduleActions.success.approve'));
              onSuccess();
              resolve();
            },
            onError: () => {
              toast.error(t('commonErrors.generic'));
              resolve();
            },
          });
        }),
    });
  };

  return { requestApprove, isPending };
};
