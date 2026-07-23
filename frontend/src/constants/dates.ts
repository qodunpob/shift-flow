export interface DateFormatMap {
  scheduleBoundaryDate: string;
}

export const dateFormatMap: Record<string, DateFormatMap> = {
  fallback: {
    scheduleBoundaryDate: 'MM.dd',
  },
};

export const dateFormat = (locale: string) =>
  dateFormatMap[locale] ?? dateFormatMap.fallback;
