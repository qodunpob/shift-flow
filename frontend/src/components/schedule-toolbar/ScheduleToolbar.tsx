'use client';

import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useLocale, useTranslations } from 'next-intl';
import { ShiftFormModal } from '@/features/shift-form/ShiftFormModal';
import { ScheduleFormModal } from '@/features/schedule-form/ScheduleFormModal';
import { useEditScheduleAction } from '@/features/schedule-actions/useEditScheduleAction';
import { useDeleteScheduleAction } from '@/features/schedule-actions/useDeleteScheduleAction';
import { useScheduleStatusActions } from '@/features/schedule-actions/useScheduleStatusActions';
import { useApproveScheduleAction } from '@/features/schedule-actions/useApproveScheduleAction';
import { useRejectScheduleAction } from '@/features/schedule-actions/useRejectScheduleAction';
import { RejectScheduleDialog } from '@/features/schedule-actions/RejectScheduleDialog';
import { formatScheduleIdentity } from '@/features/schedule-actions/scheduleIdentity';
import { isScheduleEditable } from '@/features/schedule-actions/isScheduleEditable';
import { FlexBox } from '@/components/box/box';
import { useCurrentUser } from '@/providers/CurrentUserProvider';
import { useSchedule } from '@/features/schedule-details/ScheduleProvider';
import { isApprover, isMine } from '@/utils/user';
import { useRouter } from '@/i18n/navigation';
import { routes } from '@/routes';

export const ScheduleToolbar: React.FC = () => {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const schedule = useSchedule();
  const [openShiftFormModal, setOpenShiftFormModal] = useState(false);

  const isScheduleOwner = isMine(schedule, currentUser);
  const isScheduleApprover =
    isApprover(currentUser.roles) && schedule.status === 'AWAITING_APPROVAL';

  const refresh = () => router.refresh();
  const goToScheduleList = () => router.push(routes.schedules);

  const identity = formatScheduleIdentity(schedule, locale);
  const editable = isScheduleEditable(schedule.status);

  const edit = useEditScheduleAction();
  const del = useDeleteScheduleAction(schedule.id, identity, goToScheduleList);
  const statusActions = useScheduleStatusActions(
    schedule.id,
    schedule.status,
    identity,
    refresh,
  );
  const approveAction = useApproveScheduleAction(
    schedule.id,
    identity,
    refresh,
  );
  const rejectAction = useRejectScheduleAction(schedule.id, refresh);

  if (!isScheduleOwner && !isScheduleApprover) {
    return null;
  }

  return (
    <>
      <FlexBox justifyContent="space-between">
        <Box>
          {isScheduleOwner && (
            <Button
              variant="contained"
              onClick={() => setOpenShiftFormModal(true)}
            >
              {t('ScheduleDetailsPage.createShift')}
            </Button>
          )}
        </Box>
        <FlexBox>
          {isScheduleOwner && editable && (
            <Button
              variant="outlined"
              endIcon={<DeleteOutlineOutlinedIcon />}
              color="warning"
              onClick={del.requestDelete}
            >
              {t('ScheduleActions.delete')}
            </Button>
          )}
          {isScheduleOwner && editable && (
            <Button
              variant="outlined"
              endIcon={<EditIcon />}
              onClick={edit.open}
            >
              {t('ScheduleActions.edit')}
            </Button>
          )}
          {isScheduleOwner &&
            statusActions.actions.map((action) => (
              <Button
                key={action.key}
                variant="contained"
                onClick={action.request}
              >
                {action.label}
              </Button>
            ))}

          {isScheduleApprover && (
            <Button
              variant="outlined"
              color="warning"
              onClick={rejectAction.requestReject}
            >
              {t('ScheduleActions.reject')}
            </Button>
          )}
          {isScheduleApprover && (
            <Button variant="contained" onClick={approveAction.requestApprove}>
              {t('ScheduleActions.approve')}
            </Button>
          )}
        </FlexBox>
      </FlexBox>

      {isScheduleOwner && (
        <ShiftFormModal
          mode="create"
          open={openShiftFormModal}
          onClose={() => setOpenShiftFormModal(false)}
          scheduleId={schedule.id}
          timeZone={schedule.timeZone}
        />
      )}

      {edit.isOpen && (
        <ScheduleFormModal
          mode="edit"
          schedule={schedule}
          open
          onClose={edit.close}
          resetFiltersAndPage={refresh}
        />
      )}

      <RejectScheduleDialog
        open={rejectAction.isConfirming}
        scheduleIdentity={identity}
        rejectionReason={rejectAction.rejectionReason}
        onRejectionReasonChange={rejectAction.setRejectionReason}
        onConfirm={rejectAction.confirm}
        onCancel={rejectAction.cancel}
        isPending={rejectAction.isPending}
        canConfirm={rejectAction.canConfirm}
      />
    </>
  );
};
