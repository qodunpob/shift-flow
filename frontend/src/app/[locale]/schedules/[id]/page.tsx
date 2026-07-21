import { Container, Typography } from "@mui/material";
import { getTranslations } from "next-intl/server";

export default async function ScheduleDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("ScheduleDetailsPage");

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1">
        {t("title", { id })}
      </Typography>
    </Container>
  );
}
