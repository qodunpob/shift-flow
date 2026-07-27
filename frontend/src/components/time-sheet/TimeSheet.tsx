'use client';
import React, { useMemo, useState } from 'react';
import { Box, lighten, styled } from '@mui/material';
import { FlexBox } from '@/components/box/box';
import { DateTime } from 'luxon';
import { Shift } from '@/lib/api/types';
import { useLocale } from 'next-intl';
import { dateFormat } from '@/constants/dates';
import { AssignmentsModal } from '@/features/shift-assignments/AssignmentsModal';
import { ShiftView } from '@/components/time-sheet/ShiftView';
import { useSchedule } from '@/features/schedule-details/ScheduleProvider';

export interface TimeSheetProps {
  shifts: Shift[];
}

export const columnWidth = 160;
export const dayLabelHeight = 40;
export const cellHeight = 60;
const hourCellClassName = 'time-sheet-hour-cell';

export const TimeSheet: React.FC<TimeSheetProps> = ({ shifts }) => {
  const schedule = useSchedule();
  const locale = useLocale();
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const selectedShift =
    shifts.find((shift) => shift.id === selectedShiftId) ?? null;

  const scheduleStartsAt = useMemo(
    () => DateTime.fromISO(schedule.startsAt, { zone: schedule.timeZone }),
    [schedule.startsAt, schedule.timeZone],
  );

  const hourLabels = useMemo(() => {
    const labels = [<DayLabelCell key={`hour-label-empty`} />];
    for (let h = 0; h < 24; h++) {
      labels.push(
        <HourLabelCell key={`hour-label-${h}`}>{`${h}:00`}</HourLabelCell>,
      );
    }
    return labels;
  }, []);

  const dayColumns = useMemo(() => {
    const scheduleEndsAt = DateTime.fromISO(schedule.endsAt, {
      zone: schedule.timeZone,
    });
    const days = Math.ceil(scheduleEndsAt.diff(scheduleStartsAt, 'days').days);

    const columns = [];
    for (let d = 0; d < days; d++) {
      const hourCells = [
        <DayLabelCell key={`day-label-${d}`}>
          {scheduleStartsAt
            .plus({ days: d })
            .toFormat(dateFormat(locale).timeSheetColumn)}
        </DayLabelCell>,
      ];
      for (let h = 0; h < 24; h++) {
        hourCells.push(
          <HourCell
            className={hourCellClassName}
            key={`hour-cell-${d}-${h}`}
          />,
        );
      }
      columns.push(<DayColumn key={`day-column-${d}`}>{hourCells}</DayColumn>);
    }
    return columns;
  }, [locale, schedule.endsAt, schedule.timeZone, scheduleStartsAt]);

  const renderedShifts = useMemo(
    () =>
      shifts.map((shift) =>
        renderShift({
          shift,
          scheduleStartsAt,
          locale,
          timeZone: schedule.timeZone,
          onClick: () => setSelectedShiftId(shift.id),
        }),
      ),
    [shifts, scheduleStartsAt, locale, schedule.timeZone],
  );

  return (
    <>
      <FlexBox gap={0}>
        <HourLabelColumn>{hourLabels}</HourLabelColumn>
        <TimeSheetBody>
          {renderedShifts}
          {dayColumns}
        </TimeSheetBody>
      </FlexBox>
      {selectedShift && (
        <AssignmentsModal
          shift={selectedShift}
          onClose={() => setSelectedShiftId(null)}
        />
      )}
    </>
  );
};

export interface RenderShiftArgs {
  shift: Shift;
  scheduleStartsAt: DateTime;
  locale: string;
  timeZone: string;
  onClick: () => void;
}

interface ShiftSector {
  top: number;
  left?: number;
  bottom?: number;
  height?: number;
}

export const renderShift = ({
  shift,
  scheduleStartsAt,
  locale,
  timeZone,
  onClick,
}: RenderShiftArgs) => {
  const startsAt = DateTime.fromISO(shift.startsAt, { zone: timeZone });
  const startDay = startsAt.startOf('day');
  const endsAt = DateTime.fromISO(shift.endsAt, { zone: timeZone });
  const endDay = endsAt.startOf('day');

  const days = Math.ceil(endDay.diff(startDay, 'days').days);
  // One filler sector per calendar day strictly between the first and last
  // day - each gets its own object (never .fill(), which would give every
  // slot the same reference and have the `left` assignment below mutate a
  // single shared object instead of positioning each day's column).
  const sectors: ShiftSector[] =
    days > 1
      ? Array.from({ length: days - 1 }, () => ({
          top: dayLabelHeight,
          bottom: 0,
        }))
      : [];

  if (days > 0) {
    const top = dayLabelHeight + startsAt.hour * cellHeight + startsAt.minute;
    const height = endsAt.hour * cellHeight + endsAt.minute;
    sectors.unshift({ top, bottom: 0 });
    sectors.push({ top: dayLabelHeight, height });
  } else {
    const top = dayLabelHeight + startsAt.hour * cellHeight + startsAt.minute;
    const height =
      dayLabelHeight + endsAt.hour * cellHeight + endsAt.minute - top;
    sectors.push({ top, height });
  }

  const diffFromBeginning = Math.floor(
    startDay.diff(scheduleStartsAt, 'days').days,
  );
  for (let i = 0; i < sectors.length; i++) {
    sectors[i].left = (diffFromBeginning + i) * columnWidth;
  }

  const timeLabelFormat =
    days > 0
      ? dateFormat(locale).shiftBoundaryDateTime
      : dateFormat(locale).shiftBoundaryTime;
  const timeLabel =
    startsAt.toFormat(timeLabelFormat) +
    ' – ' +
    endsAt.toFormat(timeLabelFormat);

  return sectors.map((sector, index) => (
    <ShiftBox key={`shift-${shift.id}-${index}`} sx={sector} onClick={onClick}>
      <ShiftView timeLabel={timeLabel} shift={shift} />
    </ShiftBox>
  ));
};

const TimeSheetBody = styled(FlexBox)(() => ({
  position: 'relative',
  gap: 0,
  overflowX: 'auto',
}));

const HourCell = styled(Box)(({ theme }) => ({
  height: cellHeight,
  borderWidth: 0,
  borderStyle: 'solid',
  borderColor: (theme.vars || theme).palette.divider,
  borderTopWidth: 1,
  borderLeftWidth: 1,
  '&:last-child': {
    borderBottomWidth: 1,
  },
}));

const DayColumn = styled(Box)(() => ({
  width: columnWidth,
  flexShrink: 0,
  flexGrow: 0,
  [`&:last-child .${hourCellClassName}`]: {
    borderRightWidth: 1,
  },
}));

const HourLabelCell = styled(FlexBox)(() => ({
  alignItems: 'center',
  justifyContent: 'center',
  height: cellHeight,
}));

const HourLabelColumn = styled(Box)(({ theme }) => ({
  width: theme.spacing(10),
  flexShrink: 0,
  flexGrow: 0,
}));

const DayLabelCell = styled(FlexBox)(() => ({
  alignItems: 'center',
  justifyContent: 'center',
  width: columnWidth,
  height: dayLabelHeight,
}));

const ShiftBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  position: 'absolute',
  width: columnWidth,
  overflow: 'hidden',
  color: theme.palette.primary.contrastText,
  backgroundColor: theme.palette.primary.main,
  transition: 'background-color 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: lighten(theme.palette.primary.main, 0.25),
  },
}));
