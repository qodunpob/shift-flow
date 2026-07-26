import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import { useDeleteScheduleMutation } from '@/features/schedules/api/client';
import { useConfirmDialog } from '@/providers/ConfirmDialogProvider';

export const useDeleteScheduleAction = (
  scheduleId: string,
  identity: string,
  resetFiltersAndPage: () => void,
) => {
  const t = useTranslations();
  const { confirm } = useConfirmDialog();
  const { mutate, isPending } = useDeleteScheduleMutation();

  const requestDelete = () => {
    confirm({
      title: t('ScheduleActions.confirm.delete.title'),
      description: t('ScheduleActions.confirm.delete.description'),
      identity,
      confirmLabel: t('ScheduleActions.confirm.delete.confirmLabel'),
      onConfirm: () =>
        new Promise<void>((resolve) => {
          mutate(scheduleId, {
            onSuccess: () => {
              toast.success(t('ScheduleActions.success.deleted'));
              resetFiltersAndPage();
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

  return { requestDelete, isPending };
};
