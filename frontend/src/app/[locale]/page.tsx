import { redirect } from "@/i18n/navigation";
import { DEFAULT_ROUTE } from "@/routes";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: DEFAULT_ROUTE, locale });
}
