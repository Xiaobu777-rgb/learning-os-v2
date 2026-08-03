import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { LessonView } from "@/components/lesson-view";
import { getLessonBySlug } from "@/lib/curriculum";
import { getSessionUserId } from "@/lib/session";
import { getCurrentUser } from "@/lib/users";

type Context = { params: Promise<{ slug: string }> };

export default async function LessonPage({ params }: Context) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const { slug } = await params;
  const [user, lesson] = await Promise.all([getCurrentUser(userId), getLessonBySlug(userId, slug)]);
  if (!lesson.ok) notFound();
  return <AppShell userHandle={user?.handle ?? "当前用户"} activeNav="学习"><LessonView lesson={lesson.data} /></AppShell>;
}
