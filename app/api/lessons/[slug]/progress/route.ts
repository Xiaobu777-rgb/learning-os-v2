import { NextResponse } from "next/server";
import { getLessonBySlug, saveLessonProgress } from "@/lib/curriculum";
import { getSessionUserId } from "@/lib/session";

type Context = { params: Promise<{ slug: string }> };

export async function PATCH(request: Request, context: Context) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { slug } = await context.params;
  const lesson = await getLessonBySlug(userId, slug);
  if (!lesson.ok) return NextResponse.json({ error: lesson.error }, { status: lesson.status ?? 500 });
  const body = await request.json().catch(() => null);
  const progressPercent = Number(body?.progressPercent ?? 0);
  const currentItemOrder = Number(body?.currentItemOrder ?? 0);
  const result = await saveLessonProgress({ userId, lessonId: lesson.data.id, progressPercent, currentItemOrder, completed: Boolean(body?.completed) });
  return NextResponse.json(result.ok ? result.data : { error: result.error }, { status: result.ok ? 200 : result.status });
}
