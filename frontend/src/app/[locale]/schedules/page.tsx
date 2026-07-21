import { Container, Typography } from "@mui/material";
import { getTranslations } from "next-intl/server";

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page = "1" } = await searchParams;
  const t = await getTranslations("SchedulesPage");

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1">
        {t("title")}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t("page", { page })}
      </Typography>
    </Container>
  );
}
