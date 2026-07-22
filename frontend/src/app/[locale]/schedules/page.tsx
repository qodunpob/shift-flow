import { Container, Typography } from '@mui/material'
import { getTranslations } from 'next-intl/server'
import { getCurrentUser } from '@/lib/api/users'
import { AppShell } from '@/components/app-shell/AppShell'

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getCurrentUser();
  const { page = "1" } = await searchParams;
  const t = await getTranslations("SchedulesPage");

  return (
    <AppShell user={user}>
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1">
        {t("title")}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t("page", { page })}
      </Typography>
    </Container>
    </AppShell>
  );
}
