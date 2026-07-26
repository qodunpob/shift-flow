'use client';
import React, { useMemo } from 'react';
import { Box, lighten, styled } from '@mui/material';
import { FlexBox } from '@/components/box/box';
import { DateTime } from 'luxon';
import { Schedule, Shift } from '@/lib/api/types';
import { useLocale } from 'next-intl';
import { dateFormat } from '@/constants/dates';

export interface TimeSheetProps {
  schedule: Pick<Schedule, 'startsAt' | 'endsAt'>;
  shifts: Shift[];
}

const columnWidth = 160;
const dayLabelHeight = 40;
const cellHeight = 60;
const hourCellClassName = 'time-sheet-hour-cell';

export const TimeSheet: React.FC<TimeSheetProps> = ({ schedule, shifts }) => {
  const locale = useLocale();
  console.log('shifts', shifts);

  const scheduleStartsAt = useMemo(
    () => DateTime.fromISO(schedule.startsAt),
    [schedule.startsAt],
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
    const scheduleEndsAt = DateTime.fromISO(schedule.endsAt);
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
  }, [locale, schedule.endsAt, scheduleStartsAt]);

  const renderedShifts = useMemo(
    () => shifts.map((shift) => renderShift(shift, scheduleStartsAt)),
    [shifts, scheduleStartsAt],
  );

  return (
    <FlexBox gap={0}>
      <HourLabelColumn>{hourLabels}</HourLabelColumn>
      <TimeSheetBody>
        {renderedShifts}
        {dayColumns}
      </TimeSheetBody>
    </FlexBox>
  );
};

const renderShift = (shift: Shift, scheduleStartsAt: DateTime) => {
  const startsAt = DateTime.fromISO(shift.startsAt);
  const endsAt = DateTime.fromISO(shift.endsAt);

  const days = Math.ceil(endsAt.diff(startsAt, 'days').days);

  const sectors =
    days > 2 ? new Array(days - 2).fill({ top: 0, bottom: 0 }) : [];

  if (days > 1) {
    const top = dayLabelHeight + startsAt.hour * cellHeight + startsAt.minute;
    const height = dayLabelHeight + endsAt.hour * cellHeight + endsAt.minute;
    sectors.unshift({ top, bottom: 0 });
    sectors.push({ top: 0, height });
  } else {
    const top = dayLabelHeight + startsAt.hour * cellHeight + startsAt.minute;
    const height =
      dayLabelHeight + endsAt.hour * cellHeight + endsAt.minute - top;
    sectors.push({ top, height });
  }

  const diffFromBeginning = Math.floor(
    startsAt.diff(scheduleStartsAt, 'days').days,
  );
  console.log(diffFromBeginning);
  for (let i = 0; i < sectors.length; i++) {
    sectors[i].left = (diffFromBeginning + i) * columnWidth;
  }

  return sectors.map((sector, index) => (
    <ShiftBox key={`shift-${shift.id}-${index}`} sx={sector} />
  ));
};

const TimeSheetBody = styled(FlexBox)(({ theme }) => ({
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

const DayColumn = styled(Box)(({ theme }) => ({
  width: columnWidth,
  flexShrink: 0,
  flexGrow: 0,
  [`&:last-child .${hourCellClassName}`]: {
    borderRightWidth: 1,
  },
}));

const HourLabelCell = styled(FlexBox)(({ theme }) => ({
  alignItems: 'center',
  justifyContent: 'center',
  height: cellHeight,
}));

const HourLabelColumn = styled(Box)(({ theme }) => ({
  width: theme.spacing(10),
  flexShrink: 0,
  flexGrow: 0,
}));

const DayLabelCell = styled(FlexBox)(({ theme }) => ({
  alignItems: 'center',
  justifyContent: 'center',
  width: columnWidth,
  height: dayLabelHeight,
}));

const ShiftBox = styled(Box)(({ theme }) => ({
  position: 'absolute',
  width: columnWidth,
  backgroundColor: theme.palette.primary.main,
  transition: 'background-color 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: lighten(theme.palette.primary.main, 0.25),
  },
}));
