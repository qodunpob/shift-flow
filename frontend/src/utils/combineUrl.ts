export const combineUrl = (
  url: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: Record<string, any> = {},
): string => {
  const searchParams = new URLSearchParams(params);
  if (searchParams.size > 0) {
    return url.indexOf('?') > -1
      ? `${url}&${searchParams.toString()}`
      : `${url}?${searchParams.toString()}`;
  }
  return url;
};
