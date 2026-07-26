import type { components } from '@/lib/api/schema';

export type CurrentUser = components['schemas']['UserResponseDto'];
export type PaginatedSchedules = components['schemas']['PaginatedSchedulesDto'];
export type Schedule = components['schemas']['ScheduleViewDto'];
export type CreatedSchedule = components['schemas']['ScheduleEntity'];
export type ScheduleStatus = Schedule['status'];
export type Shift = components['schemas']['ShiftBoardViewDto'];

export interface ApiFetchInit extends RequestInit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any>;
}
