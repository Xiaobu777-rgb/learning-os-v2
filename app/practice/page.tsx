import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PracticeWorkspace } from "@/components/practice-workspace";
import { getSessionUserId } from "@/lib/session";
import { getCurrentUser } from "@/lib/users";

type Context = { searchParams?: Promise<{ mode?: string }> };

export default async function PracticePage({ searchParams }: Context) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const user = await getCurrentUser(userId);
  const params = await searchParams;
  const requested = params?.mode;
  const mode = requested === "usage" || requested === "en2cn" || requested === "spelling" || requested === "review" ? requested : "cn2en";
  return <AppShell userHandle={user?.handle ?? "当前用户"} activeNav="练习"><PracticeWorkspace initialMode={mode} /></AppShell>;
}
