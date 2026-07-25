import 'client-only';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetchFromClient } from '@/lib/api/client/apiFetch';
import { schedulesQueryPrefix } from '@/features/schedules/api/client';
import { PaginatedSchedules, ScheduleStatus } from '@/lib/api/types';

const schedulesQueryFilter = { queryKey: schedulesQueryPrefix } as const;

type TransitionContext = {
  previousQueries: [readonly unknown[], PaginatedSchedules | undefined][];
};

type ActionType =
  | 'publish'
  | 'submit-for-approval'
  | 'unpublish'
  | 'withdraw'
  | 'approve'
  | 'reject';

const useTransition = (
  action: ActionType,
  optimisticStatus: ScheduleStatus,
) => {
  const queryClient = useQueryClient();

  return useMutation<unknown, unknown, string, TransitionContext>({
    mutationFn: (scheduleId: string) =>
      apiFetchFromClient(`/schedules/${scheduleId}/${action}`, {
        method: 'POST',
      }),
    onMutate: async (scheduleId: string) => {
      await queryClient.cancelQueries(schedulesQueryFilter);

      const previousQueries =
        queryClient.getQueriesData<PaginatedSchedules>(schedulesQueryFilter);

      previousQueries.forEach(([queryKey, data]) => {
        if (!data) return;
        queryClient.setQueryData<PaginatedSchedules>(queryKey, {
          ...data,
          items: data.items.map((schedule) =>
            schedule.id === scheduleId
              ? { ...schedule, status: optimisticStatus }
              : schedule,
          ),
        });
      });

      return { previousQueries };
    },
    onError: (_error, _scheduleId, context) => {
      context?.previousQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries(schedulesQueryFilter);
    },
  });
};

export const usePublishScheduleMutation = () =>
  useTransition('publish', 'IN_REVIEW');

export const useUnpublishScheduleMutation = () =>
  useTransition('unpublish', 'DRAFT');

export const useSubmitForApprovalScheduleMutation = () =>
  useTransition('submit-for-approval', 'AWAITING_APPROVAL');

export const useWithdrawScheduleMutation = () =>
  useTransition('withdraw', 'IN_REVIEW');

export const useApproveScheduleMutation = () =>
  useTransition('approve', 'APPROVED');

export const useRejectScheduleMutation = () =>
  useTransition('reject', 'REJECTED');
