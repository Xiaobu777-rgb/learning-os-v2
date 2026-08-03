import { NextResponse } from "next/server";
import { getLessonBySlug, saveLessonItemFeedback } from "@/lib/curriculum";
import { recordLearningFeedback } from "@/lib/learning";
import { getSessionUserId } from "@/lib/session";

type Context = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: Context) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { slug } = await context.params;
  const lesson = await getLessonBySlug(userId, slug);
  if (!lesson.ok) return NextResponse.json({ error: lesson.error }, { status: lesson.status ?? 500 });
  const body = await request.json().catch(() => null);
  const item = lesson.data.items.find((entry) => entry.id === String(body?.itemId ?? ""));
  const feedback = body?.feedback === "known" || body?.feedback === "uncertain" || body?.feedback === "unknown" ? body.feedback : null;
  if (!item || !feedback) return NextResponse.json({ error: "学习反馈不完整" }, { status: 400 });
  const saved = await saveLessonItemFeedback({ userId, itemId: item.id, feedback });
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: saved.status });
  if (item.system_dictionary_id) {
    const dictionary = await recordLearningFeedback({ userId, dictionaryId: item.system_dictionary_id, activityType: "learn", feedback, response: item.content_en });
    if (!dictionary.ok) return NextResponse.json({ error: dictionary.error }, { status: dictionary.status });
  }
  return NextResponse.json(saved.data);
}
