import { useTranslations } from 'next-intl';
import { useConfirmDialog } from '@/providers/ConfirmDialogProvider';
import { useDeleteShiftMutation } from '@/features/schedule-details/api/client';
import { toast } from 'react-toastify';
import { ApiError } from '@/lib/errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { useRouter } from '@/i18n/navigation';

export const useDeleteShift = (
  shiftId: string,
  identity: string,
  onClose: () => void,
) => {
  const router = useRouter();
  const t = useTranslations();
  const { confirm } = useConfirmDialog();
  const { mutate, isPending } = useDeleteShiftMutation();

  const requestDelete = () => {
    confirm({
      title: t('ShiftActions.confirm.delete.title'),
      description: t('ShiftActions.confirm.delete.description'),
      identity,
      confirmLabel: t('ShiftActions.confirm.delete.confirmLabel'),
      onConfirm: () =>
        new Promise<void>((resolve) =>
          mutate(shiftId, {
            onSuccess: () => {
              toast.success(t('ShiftForm.deleteSuccess'));
              router.refresh();
              onClose();
              resolve();
            },
            onError: (error) => {
              const isConflict =
                error instanceof ApiError &&
                error.statusCode === StatusCodes.CONFLICT;
              toast.error(
                isConflict
                  ? t('commonErrors.conflict')
                  : t('commonErrors.generic'),
              );
              resolve();
            },
          }),
        ),
    });
  };

  return { requestDelete, isPending };
};
