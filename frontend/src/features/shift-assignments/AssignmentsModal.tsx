'use client';

import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import { DateTime } from 'luxon';
import { useLocale, useTranslations } from 'next-intl';
import { FlexBox } from '@/components/box/box';
import { dateFormat } from '@/constants/dates';
import { CurrentUser, Employee, Shift } from '@/lib/api/types';
import { useCurrentUser } from '@/providers/CurrentUserProvider';
import { useSchedule } from '@/features/schedule-details/ScheduleProvider';
import { isEmployee } from '@/utils/user';
import { AssignEmployeeButton } from '@/features/shift-assignments/AssignEmployeeButton';
import { ProposeButton } from '@/features/shift-assignments/ProposeButton';
import { EmployeeChip } from '@/components/employee-chip/EmployeeChip';
import EditIcon from '@mui/icons-material/Edit';
import { useAssignmentHandlers } from '@/features/shift-assignments/useAssignmentHandlers';
import { canEdit, isEditable } from '@/utils/scheduleState';
import { ShiftFormModal } from '@/features/shift-form/ShiftFormModal';
import { useDeleteShift } from '@/features/shift-assignments/useDeleteShit';

export interface AssignmentsModalProps {
  shift: Shift;
  onClose: () => void;
}

export const AssignmentsModal: React.FC<AssignmentsModalProps> = ({
  shift,
  onClose,
}) => {
  const t = useTranslations();
  const locale = useLocale();
  const currentUser = useCurrentUser();
  const schedule = useSchedule();
  const [isEditingShift, setIsEditingShift] = useState(false);

  const canAssign = canEdit(schedule, currentUser) && shift.spotsRemaining > 0;
  const canPropose =
    isEditable(schedule) &&
    isEmployee(currentUser.roles) &&
    !isAlreadyInvolved(shift, currentUser);

  const { handleRemoveAssignment, handleRemoveProposal, handleAcceptProposal } =
    useAssignmentHandlers(t);

  const format = dateFormat(locale).shiftBoundaryDateTime;
  const startsAt = DateTime.fromISO(shift.startsAt, {
    zone: schedule.timeZone,
  });
  const endsAt = DateTime.fromISO(shift.endsAt, { zone: schedule.timeZone });
  const label = `${startsAt.toFormat(format)} – ${endsAt.toFormat(format)}`;
  const del = useDeleteShift(shift.id, label, onClose);

  if (isEditingShift) {
    return (
      <ShiftFormModal
        mode="edit"
        shift={shift}
        timeZone={schedule.timeZone}
        open
        onClose={() => setIsEditingShift(false)}
      />
    );
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('ShiftAssignments.title')}</DialogTitle>
      <DialogContent dividers>
        <FlexBox direction="column" alignItems="stretch" gap={1}>
          <Typography variant="body1">{label}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('labels.requiredHeadcount')}: {shift.requiredHeadcount}
          </Typography>
        </FlexBox>

        <FlexBox justifyContent="space-between" sx={{ mt: 3, mb: 1 }}>
          <Typography variant="subtitle2">
            {t('ShiftAssignments.assigned')}
          </Typography>
        </FlexBox>
        {shift.assignments.length > 0 ? (
          <FlexBox gap={2} sx={{ flexWrap: 'wrap' }}>
            {shift.assignments.map((assignment) => (
              <AssignmentEmployeeChip
                key={assignment.id}
                employee={assignment.employee}
                onRemove={
                  canEdit(schedule, currentUser)
                    ? () => handleRemoveAssignment(assignment.id)
                    : undefined
                }
              />
            ))}
          </FlexBox>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t('ShiftAssignments.noneAssigned')}
          </Typography>
        )}

        {shift.proposals.length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
              {t('ShiftAssignments.proposals')}
            </Typography>
            <FlexBox gap={2} sx={{ flexWrap: 'wrap' }}>
              {shift.proposals.map((proposal) => (
                <AssignmentEmployeeChip
                  key={proposal.id}
                  employee={proposal.employee}
                  onRemove={
                    proposal.employeeId === currentUser.id
                      ? () => handleRemoveProposal(proposal.id)
                      : undefined
                  }
                  onAccept={
                    canEdit(schedule, currentUser)
                      ? () => handleAcceptProposal(proposal.id)
                      : undefined
                  }
                />
              ))}
            </FlexBox>
          </>
        )}
      </DialogContent>
      <DialogActions>
        {canEdit(schedule, currentUser) && (
          <FlexBox sx={{ flexGrow: 1 }}>
            <Button
              variant="outlined"
              color="warning"
              endIcon={<DeleteOutlineOutlinedIcon />}
              onClick={del.requestDelete}
              disabled={del.isPending}
            >
              {t('common.delete')}
            </Button>
            <Button
              variant="outlined"
              endIcon={<EditIcon />}
              onClick={() => setIsEditingShift(true)}
            >
              {t('common.edit')}
            </Button>
          </FlexBox>
        )}
        {canAssign && <AssignEmployeeButton shiftId={shift.id} />}
        {canPropose && <ProposeButton shiftId={shift.id} />}
        <Button onClick={onClose} variant="outlined">
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const isAlreadyInvolved = (shift: Shift, user: Pick<CurrentUser, 'id'>) =>
  shift.assignments.some((assignment) => assignment.employeeId === user.id) ||
  shift.proposals.some((proposal) => proposal.employeeId === user.id);

const AssignmentEmployeeChip: React.FC<{
  employee: Employee;
  onRemove?: () => void;
  onAccept?: () => void;
}> = ({ employee, onRemove, onAccept }) => {
  const t = useTranslations();

  return (
    <FlexBox
      gap={1}
      sx={{ '&:hover .assignment-action-button': { opacity: 1 } }}
    >
      <EmployeeChip employee={employee} />
      {onAccept && (
        <IconButton
          className="assignment-action-button"
          size="small"
          aria-label={t('ShiftAssignments.accept')}
          onClick={onAccept}
          sx={{ opacity: 0, transition: 'opacity 0.15s ease' }}
        >
          <CheckOutlinedIcon fontSize="small" />
        </IconButton>
      )}
      {onRemove && (
        <IconButton
          className="assignment-action-button"
          size="small"
          aria-label={t('ShiftAssignments.remove')}
          onClick={onRemove}
          sx={{ opacity: 0, transition: 'opacity 0.15s ease' }}
        >
          <DeleteOutlineOutlinedIcon fontSize="small" />
        </IconButton>
      )}
    </FlexBox>
  );
};
