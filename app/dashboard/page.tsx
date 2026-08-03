import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TodayCockpit } from "@/components/today-cockpit";
import { getHomeData } from "@/lib/home";
import { getSessionUserId } from "@/lib/session";

export default async function DashboardPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const data = await getHomeData(userId);
  if (!data.user) redirect("/login");
  if (!data.user.onboarding_completed) redirect("/onboarding");
  return <AppShell userHandle={data.user.handle} activeNav="Home"><TodayCockpit {...data} /></AppShell>;
}
