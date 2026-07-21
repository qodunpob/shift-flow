import { redirect } from "next/navigation";
import { DEFAULT_ROUTE } from "@/routes";

export default function Home() {
  redirect(DEFAULT_ROUTE);
}
