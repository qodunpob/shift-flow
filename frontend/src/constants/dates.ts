export interface DateFormatMap {
  scheduleBoundaryDate: string;
  dateRangeInput: string;
  timeSheetColumn: string;
  shiftBoundaryTime: string;
  shiftBoundaryDateTime: string;
}

export const dateFormatMap: Record<string, DateFormatMap> = {
  fallback: {
    scheduleBoundaryDate: 'MM.dd',
    dateRangeInput: 'MM/dd/yyyy',
    timeSheetColumn: 'MM/dd',
    shiftBoundaryTime: 'HH:mm',
    shiftBoundaryDateTime: 'MM/dd HH:mm',
  },
};

export const dateFormat = (locale: string) =>
  dateFormatMap[locale] ?? dateFormatMap.fallback;
