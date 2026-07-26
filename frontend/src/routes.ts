export const routes = {
  login: '/login',
  schedules: '/schedules',
  scheduleDetails: (id: string) => `/schedules/${id}`,
} as const;

export const DEFAULT_ROUTE = routes.schedules;
