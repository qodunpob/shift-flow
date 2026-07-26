'use client';

import React, { useState } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useLocale, useTranslations } from 'next-intl';
import { Schedule } from '@/lib/api/types';
import { ScheduleFormModal } from '@/features/schedule-form/ScheduleFormModal';
import { useEditScheduleAction } from '@/features/schedule-actions/useEditScheduleAction';
import { useDeleteScheduleAction } from '@/features/schedule-actions/useDeleteScheduleAction';
import { useScheduleStatusActions } from '@/features/schedule-actions/useScheduleStatusActions';
import { ConfirmScheduleActionDialog } from '@/features/schedule-actions/ConfirmScheduleActionDialog';
import { formatScheduleIdentity } from '@/features/schedule-actions/scheduleIdentity';
import { isScheduleEditable } from '@/features/schedule-actions/isScheduleEditable';

export interface ScheduleActionsMenuProps {
  schedule: Schedule;
  resetFiltersAndPage: () => void;
}

export const ScheduleActionsMenu: React.FC<ScheduleActionsMenuProps> = ({
  schedule,
  resetFiltersAndPage,
}) => {
  const t = useTranslations();
  const locale = useLocale();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const edit = useEditScheduleAction();
  const del = useDeleteScheduleAction(schedule.id, resetFiltersAndPage);
  const statusActions = useScheduleStatusActions(
    schedule.id,
    schedule.status,
    resetFiltersAndPage,
  );

  const identity = formatScheduleIdentity(schedule, locale);
  const editable = isScheduleEditable(schedule.status);
  const closeMenu = () => setAnchorEl(null);

  // Nothing to show at all - only ever true for APPROVED (0 status actions,
  // not editable). AWAITING_APPROVAL still has Withdraw, so its menu stays.
  if (!editable && statusActions.actions.length === 0) {
    return null;
  }

  return (
    <>
      <IconButton
        aria-label={t('ScheduleActions.menu')}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={closeMenu}>
        {editable && (
          <MenuItem
            onClick={() => {
              edit.open();
              closeMenu();
            }}
          >
            {t('ScheduleActions.edit')}
          </MenuItem>
        )}
        {statusActions.actions.map((action) => (
          <MenuItem
            key={action.key}
            onClick={() => {
              action.request();
              closeMenu();
            }}
          >
            {action.label}
          </MenuItem>
        ))}
        {editable && (
          <MenuItem
            onClick={() => {
              del.requestDelete();
              closeMenu();
            }}
          >
            {t('ScheduleActions.delete')}
          </MenuItem>
        )}
      </Menu>

      {edit.isOpen && (
        <ScheduleFormModal
          mode="edit"
          schedule={schedule}
          open
          onClose={edit.close}
          resetFiltersAndPage={resetFiltersAndPage}
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
    </>
  );
};
