export interface DateFormatMap {
  scheduleBoundaryDate: string;
  dateRangeInput: string;
  timeSheetColumn: string;
}

export const dateFormatMap: Record<string, DateFormatMap> = {
  fallback: {
    scheduleBoundaryDate: 'MM.dd',
    dateRangeInput: 'MM/dd/yyyy',
    timeSheetColumn: 'MM/dd',
  },
};

export const dateFormat = (locale: string) =>
  dateFormatMap[locale] ?? dateFormatMap.fallback;
