import {
  useAcceptProposalMutation,
  useDeleteAssignmentMutation,
  useDeleteProposalMutation,
} from '@/features/shift-assignments/api/client';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ApiError } from '@/lib/errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { toast } from 'react-toastify';

export const useAssignmentHandlers = (
  t: ReturnType<typeof useTranslations>,
) => {
  const router = useRouter();
  const { mutate: deleteAssignment } = useDeleteAssignmentMutation();
  const { mutate: deleteProposal } = useDeleteProposalMutation();
  const { mutate: acceptProposal } = useAcceptProposalMutation();

  const showMutationError = (error: Error) => {
    const isConflict =
      error instanceof ApiError && error.statusCode === StatusCodes.CONFLICT;
    toast.error(
      isConflict ? t('commonErrors.conflict') : t('commonErrors.generic'),
    );
  };

  const handleRemoveAssignment = (assignmentId: string) => {
    deleteAssignment(assignmentId, {
      onSuccess: () => {
        toast.success(t('ShiftAssignments.removeSuccess'));
        router.refresh();
      },
      onError: showMutationError,
    });
  };

  const handleRemoveProposal = (proposalId: string) => {
    deleteProposal(proposalId, {
      onSuccess: () => {
        toast.success(t('ShiftAssignments.proposalWithdrawn'));
        router.refresh();
      },
      onError: showMutationError,
    });
  };

  const handleAcceptProposal = (proposalId: string) => {
    acceptProposal(proposalId, {
      onSuccess: () => {
        toast.success(t('ShiftAssignments.proposalAccepted'));
        router.refresh();
      },
      onError: showMutationError,
    });
  };

  return {
    handleRemoveAssignment,
    handleRemoveProposal,
    handleAcceptProposal,
  };
};
