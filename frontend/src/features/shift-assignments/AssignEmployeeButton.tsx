'use client';

import React, { useState } from 'react';
import { Button, Menu, MenuItem } from '@mui/material';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import { StatusCodes } from 'http-status-codes';
import { useRouter } from '@/i18n/navigation';
import { ApiError } from '@/lib/errors/ApiError';
import {
  useAvailableEmployeesQuery,
  useCreateAssignmentMutation,
} from '@/features/shift-assignments/api/client';

export interface AssignEmployeeButtonProps {
  shiftId: string;
}

export const AssignEmployeeButton: React.FC<AssignEmployeeButtonProps> = ({
  shiftId,
}) => {
  const t = useTranslations();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = !!anchorEl;

  const { data: availableEmployees, isLoading } = useAvailableEmployeesQuery(
    shiftId,
    open,
  );
  const { mutate: createAssignment, isPending } =
    useCreateAssignmentMutation(shiftId);

  const closeMenu = () => setAnchorEl(null);

  const handleAssign = (employeeId: string) => {
    closeMenu();
    createAssignment(
      { employeeId },
      {
        onSuccess: () => {
          toast.success(t('ShiftAssignments.assignSuccess'));
          router.refresh();
        },
        onError: (error) => {
          const isConflict =
            error instanceof ApiError &&
            error.statusCode === StatusCodes.CONFLICT;
          toast.error(
            isConflict ? t('commonErrors.conflict') : t('commonErrors.generic'),
          );
        },
      },
    );
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        disabled={isPending}
      >
        {t('ShiftAssignments.assign')}
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={closeMenu}>
        {isLoading && (
          <MenuItem disabled>{t('ShiftAssignments.loading')}</MenuItem>
        )}
        {!isLoading && availableEmployees?.length === 0 && (
          <MenuItem disabled>
            {t('ShiftAssignments.noAvailableEmployees')}
          </MenuItem>
        )}
        {availableEmployees?.map((employee) => (
          <MenuItem key={employee.id} onClick={() => handleAssign(employee.id)}>
            {employee.firstName} {employee.lastName}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
