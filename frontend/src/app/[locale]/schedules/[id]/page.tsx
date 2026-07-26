import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell/AppShell';
import { getCurrentUserFromServer } from '@/lib/api/server/users';
import { ScheduleDetails } from '@/features/schedule-details/ScheduleDetails';
import {
  getScheduleFromServer,
  getShiftsFromServer,
} from '@/features/schedule-details/api/server';
import { scheduleRange } from '@/utils/scheduleRange';
import { DEFAULT_LOCALE } from '@/constants/common';
import { routes } from '@/routes';

export default async function ScheduleDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations();
  const [user, schedule, shifts] = await Promise.all([
    getCurrentUserFromServer(),
    getScheduleFromServer(id),
    getShiftsFromServer(id),
  ]);
  const label = schedule.label ?? scheduleRange(schedule, DEFAULT_LOCALE);
  return (
    <AppShell
      title={t('ScheduleDetailsPage.title', { label })}
      user={user}
      breadcrumbs={{
        route: routes.schedules,
        title: t('SchedulesPage.title'),
      }}
    >
      <ScheduleDetails schedule={schedule} shifts={shifts} />
    </AppShell>
  );
}
