import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProfileSettings } from "@/components/profile-settings";
import { getSessionUserId } from "@/lib/session";
import { getCurrentUser } from "@/lib/users";

export default async function ProfilePage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const user = await getCurrentUser(userId);
  if (!user) redirect("/login");
  return <AppShell userHandle={user.handle} activeNav="Profile"><ProfileSettings user={user} /></AppShell>;
}
