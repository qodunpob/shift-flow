'use client';

import React, { useState } from 'react';
import { Button } from '@mui/material';
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
import { ConfirmScheduleActionDialog } from '@/features/schedule-actions/ConfirmScheduleActionDialog';
import { RejectScheduleDialog } from '@/features/schedule-actions/RejectScheduleDialog';
import { formatScheduleIdentity } from '@/features/schedule-actions/scheduleIdentity';
import { isScheduleEditable } from '@/features/schedule-actions/isScheduleEditable';
import { FlexBox } from '@/components/box/box';
import { Schedule } from '@/lib/api/types';
import { useCurrentUser } from '@/providers/CurrentUserProvider';
import { isApprover, isManager, isMine } from '@/utils/user';
import { useRouter } from '@/i18n/navigation';
import { routes } from '@/routes';

export interface ScheduleToolbarProps {
  schedule: Schedule;
}

export const ScheduleToolbar: React.FC<ScheduleToolbarProps> = ({
  schedule,
}) => {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const [openShiftFormModal, setOpenShiftFormModal] = useState(false);

  const isScheduleOwner =
    isManager(currentUser.roles) && isMine(schedule.createdBy, currentUser.id);
  const isScheduleApprover =
    isApprover(currentUser.roles) && schedule.status === 'AWAITING_APPROVAL';

  const refresh = () => router.refresh();
  const goToScheduleList = () => router.push(routes.schedules);

  const edit = useEditScheduleAction();
  const del = useDeleteScheduleAction(schedule.id, goToScheduleList);
  const statusActions = useScheduleStatusActions(
    schedule.id,
    schedule.status,
    refresh,
  );
  const approveAction = useApproveScheduleAction(schedule.id, refresh);
  const rejectAction = useRejectScheduleAction(schedule.id, refresh);

  const identity = formatScheduleIdentity(schedule, locale);
  const editable = isScheduleEditable(schedule.status);

  if (!isScheduleOwner && !isScheduleApprover) {
    return null;
  }

  return (
    <>
      <FlexBox justifyContent="space-between">
        {isScheduleOwner && (
          <Button
            variant="contained"
            onClick={() => setOpenShiftFormModal(true)}
          >
            {t('ScheduleDetailsPage.createShift')}
          </Button>
        )}
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
            <Button variant="contained" onClick={approveAction.requestApprove}>
              {t('ScheduleActions.approve')}
            </Button>
          )}
          {isScheduleApprover && (
            <Button
              variant="outlined"
              color="warning"
              onClick={rejectAction.requestReject}
            >
              {t('ScheduleActions.reject')}
            </Button>
          )}
        </FlexBox>
      </FlexBox>

      {isScheduleOwner && (
        <ShiftFormModal
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

      <ConfirmScheduleActionDialog
        open={del.isConfirming}
        title={t('ScheduleActions.confirm.delete.title')}
        description={t('ScheduleActions.confirm.delete.description')}
        scheduleIdentity={identity}
        confirmLabel={t('ScheduleActions.confirm.delete.confirmLabel')}
        cancelLabel={t('common.cancel')}
        onConfirm={del.confirm}
        onCancel={del.cancel}
        isPending={del.isPending}
      />

      <ConfirmScheduleActionDialog
        open={!!statusActions.pendingAction}
        title={
          statusActions.pendingAction
            ? t(
                `ScheduleActions.confirm.${statusActions.pendingAction.key}.title`,
              )
            : ''
        }
        description={
          statusActions.pendingAction
            ? t(
                `ScheduleActions.confirm.${statusActions.pendingAction.key}.description`,
              )
            : ''
        }
        scheduleIdentity={identity}
        confirmLabel={
          statusActions.pendingAction
            ? t(
                `ScheduleActions.confirm.${statusActions.pendingAction.key}.confirmLabel`,
              )
            : ''
        }
        cancelLabel={t('common.cancel')}
        onConfirm={statusActions.confirm}
        onCancel={statusActions.cancel}
        isPending={statusActions.isPending}
      />

      <ConfirmScheduleActionDialog
        open={approveAction.isConfirming}
        title={t('ScheduleActions.confirm.approve.title')}
        description={t('ScheduleActions.confirm.approve.description')}
        scheduleIdentity={identity}
        confirmLabel={t('ScheduleActions.confirm.approve.confirmLabel')}
        cancelLabel={t('common.cancel')}
        onConfirm={approveAction.confirm}
        onCancel={approveAction.cancel}
        isPending={approveAction.isPending}
      />

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
