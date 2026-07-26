import { useState } from 'react';
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

export type StatusActionKey =
  'publish' | 'unpublish' | 'submitForApproval' | 'withdraw';

// Owner-facing transitions only (actor = OwnerManager in the backend's
// schedule-lifecycle.ts) - Approve/Reject are Approver-only and this menu
// only ever renders for schedules the current user owns, so those never
// apply here.
const OWNER_ACTIONS_BY_STATUS: Record<ScheduleStatus, StatusActionKey[]> = {
  DRAFT: ['publish'],
  IN_REVIEW: ['submitForApproval', 'unpublish'],
  AWAITING_APPROVAL: ['withdraw'],
  APPROVED: [],
  REJECTED: ['submitForApproval'],
};

export const useScheduleStatusActions = (
  scheduleId: string,
  status: ScheduleStatus,
  resetFiltersAndPage: () => void,
) => {
  const t = useTranslations();
  const [pendingAction, setPendingAction] = useState<StatusActionKey | null>(
    null,
  );

  const mutationFor = {
    publish: usePublishScheduleMutation(),
    unpublish: useUnpublishScheduleMutation(),
    submitForApproval: useSubmitForApprovalScheduleMutation(),
    withdraw: useWithdrawScheduleMutation(),
  };

  const isPending = Object.values(mutationFor).some((m) => m.isPending);

  const actions = OWNER_ACTIONS_BY_STATUS[status].map((key) => ({
    key,
    label: t(`ScheduleActions.${key}`),
    request: () => setPendingAction(key),
  }));

  const confirm = () => {
    if (!pendingAction) return;
    const key = pendingAction;
    mutationFor[key].mutate(scheduleId, {
      onSuccess: () => {
        toast.success(t(`ScheduleActions.success.${key}`));
        resetFiltersAndPage();
        setPendingAction(null);
      },
      onError: (error) => {
        toast.error(
          error instanceof ApiError && error.statusCode === StatusCodes.CONFLICT
            ? t('commonErrors.conflict')
            : t('commonErrors.generic'),
        );
        setPendingAction(null);
      },
    });
  };

  return {
    actions,
    pendingAction: pendingAction
      ? { key: pendingAction, label: t(`ScheduleActions.${pendingAction}`) }
      : null,
    cancel: () => setPendingAction(null),
    confirm,
    isPending,
  };
};
