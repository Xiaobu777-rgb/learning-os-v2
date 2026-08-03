import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { getCurrentUser } from "@/lib/users";

export default async function HomePage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const user = await getCurrentUser(userId);
  redirect(user?.onboarding_completed ? "/dashboard" : "/onboarding");
}
