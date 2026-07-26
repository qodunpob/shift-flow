import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '@/lib/errors/ApiError';
import {
  usePublishScheduleMutation,
  useSubmitForApprovalScheduleMutation,
  useUnpublishScheduleMutation,
  useWithdrawScheduleMutation,
} from '@/features/schedules/api/client-transition';
import { ScheduleStatus } from '@/lib/api/types';
import { useConfirmDialog } from '@/providers/ConfirmDialogProvider';

export type StatusActionKey =
  'publish' | 'unpublish' | 'submitForApproval' | 'withdraw';

// Owner-facing transitions only (actor = OwnerManager in the backend's
// schedule-lifecycle.ts) - Approve/Reject are Approver-only and this menu
// only ever renders for schedules the current user owns, so those never
// apply here.
const OWNER_ACTIONS_BY_STATUS: Record<ScheduleStatus, StatusActionKey[]> = {
  DRAFT: ['publish'],
  IN_REVIEW: ['unpublish', 'submitForApproval'],
  AWAITING_APPROVAL: ['withdraw'],
  APPROVED: [],
  REJECTED: ['submitForApproval'],
};

export const useScheduleStatusActions = (
  scheduleId: string,
  status: ScheduleStatus,
  identity: string,
  resetFiltersAndPage: () => void,
) => {
  const t = useTranslations();
  const { confirm } = useConfirmDialog();

  const mutationFor = {
    publish: usePublishScheduleMutation(),
    unpublish: useUnpublishScheduleMutation(),
    submitForApproval: useSubmitForApprovalScheduleMutation(),
    withdraw: useWithdrawScheduleMutation(),
  };

  const isPending = Object.values(mutationFor).some((m) => m.isPending);

  const requestAction = (key: StatusActionKey) => {
    confirm({
      title: t(`ScheduleActions.confirm.${key}.title`),
      description: t(`ScheduleActions.confirm.${key}.description`),
      identity,
      confirmLabel: t(`ScheduleActions.confirm.${key}.confirmLabel`),
      onConfirm: () =>
        new Promise<void>((resolve) => {
          mutationFor[key].mutate(scheduleId, {
            onSuccess: () => {
              toast.success(t(`ScheduleActions.success.${key}`));
              resetFiltersAndPage();
              resolve();
            },
            onError: (error) => {
              toast.error(
                error instanceof ApiError &&
                  error.statusCode === StatusCodes.CONFLICT
                  ? t('commonErrors.conflict')
                  : t('commonErrors.generic'),
              );
              resolve();
            },
          });
        }),
    });
  };

  const actions = OWNER_ACTIONS_BY_STATUS[status].map((key) => ({
    key,
    label: t(`ScheduleActions.${key}`),
    request: () => requestAction(key),
  }));

  return { actions, isPending };
};
