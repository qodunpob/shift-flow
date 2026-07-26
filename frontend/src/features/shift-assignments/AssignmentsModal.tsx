'use client';

import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
} from '@mui/material';
import { DateTime } from 'luxon';
import { useLocale, useTranslations } from 'next-intl';
import { FlexBox } from '@/components/box/box';
import { UserAvatar } from '@/components/user-avatar/UserAvatar';
import { dateFormat } from '@/constants/dates';
import { Employee, Shift } from '@/lib/api/types';
import { useCurrentUser } from '@/providers/CurrentUserProvider';
import { isManager, isMine } from '@/utils/user';
import { AssignEmployeeButton } from '@/features/shift-assignments/AssignEmployeeButton';

export interface AssignmentsModalProps {
  shift: Shift;
  timeZone: string;
  scheduleCreatedBy: string;
  onClose: () => void;
}

export const AssignmentsModal: React.FC<AssignmentsModalProps> = ({
  shift,
  timeZone,
  scheduleCreatedBy,
  onClose,
}) => {
  const t = useTranslations();
  const locale = useLocale();
  const currentUser = useCurrentUser();

  const canAssign =
    isManager(currentUser.roles) &&
    isMine(scheduleCreatedBy, currentUser.id) &&
    shift.spotsRemaining > 0;

  const format = dateFormat(locale).shiftBoundaryDateTime;
  const startsAt = DateTime.fromISO(shift.startsAt, { zone: timeZone });
  const endsAt = DateTime.fromISO(shift.endsAt, { zone: timeZone });

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('ShiftAssignments.title')}</DialogTitle>
      <DialogContent dividers>
        <FlexBox direction="column" alignItems="stretch" gap={1}>
          <Typography variant="body1">
            {startsAt.toFormat(format)} – {endsAt.toFormat(format)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('labels.requiredHeadcount')}: {shift.requiredHeadcount}
          </Typography>
        </FlexBox>

        <FlexBox justifyContent="space-between" sx={{ mt: 3, mb: 1 }}>
          <Typography variant="subtitle2">
            {t('ShiftAssignments.assigned')}
          </Typography>
          {canAssign && <AssignEmployeeButton shiftId={shift.id} />}
        </FlexBox>
        {shift.assignments.length > 0 ? (
          <FlexBox gap={2} sx={{ flexWrap: 'wrap' }}>
            {shift.assignments.map((assignment) => (
              <EmployeeChip
                key={assignment.id}
                employee={assignment.employee}
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
                <EmployeeChip key={proposal.id} employee={proposal.employee} />
              ))}
            </FlexBox>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const EmployeeChip: React.FC<{ employee: Employee }> = ({ employee }) => (
  <FlexBox gap={1}>
    <UserAvatar user={employee} />
    <Typography variant="body2">
      {employee.firstName} {employee.lastName}
    </Typography>
  </FlexBox>
);
