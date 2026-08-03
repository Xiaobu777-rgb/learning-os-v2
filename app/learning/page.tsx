import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { LearningPath } from "@/components/learning-path";
import { getLearningPath } from "@/lib/curriculum";
import { getSessionUserId } from "@/lib/session";
import { getCurrentUser } from "@/lib/users";

export default async function LearningPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const [user, path] = await Promise.all([getCurrentUser(userId), getLearningPath(userId)]);
  return <AppShell userHandle={user?.handle ?? "当前用户"} activeNav="学习"><LearningPath lessons={path.ok ? path.data.lessons : []} /></AppShell>;
}
