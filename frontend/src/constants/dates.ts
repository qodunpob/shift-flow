export interface DateFormatMap {
  scheduleBoundaryDate: string;
  dateRangeInput: string;
}

export const dateFormatMap: Record<string, DateFormatMap> = {
  fallback: {
    scheduleBoundaryDate: 'MM.dd',
    dateRangeInput: 'MM/dd/yyyy',
  },
};

export const dateFormat = (locale: string) =>
  dateFormatMap[locale] ?? dateFormatMap.fallback;
