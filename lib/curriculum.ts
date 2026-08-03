import { getSupabaseAdminClient } from "@/lib/supabase";

export type LessonItem = {
  id: string;
  lesson_id: string;
  item_type: "word" | "phrase" | "sentence" | "scenario";
  content_en: string;
  meaning_zh: string;
  part_of_speech: string | null;
  level: string;
  example_en: string | null;
  example_zh: string | null;
  prompt_zh: string | null;
  answer_en: string | null;
  system_dictionary_id: string | null;
  sort_order: number;
};

export type LessonSummary = {
  id: string;
  slug: string;
  title: string;
  objective: string;
  estimated_minutes: number;
  sort_order: number;
  theme_id: string;
  theme_title: string;
  stage_id: string;
  stage_title: string;
  progress_percent: number;
  status: "not_started" | "in_progress" | "completed";
};

export type LessonDetail = LessonSummary & { items: LessonItem[] };

export async function getLearningPath(userId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false as const, error: "课程数据暂不可用" };

  const [stages, themes, lessons, progress] = await Promise.all([
    supabase.from("learning_stages").select("id, code, title, description, sort_order").order("sort_order"),
    supabase.from("learning_themes").select("id, stage_id, code, title, description, sort_order").order("sort_order"),
    supabase.from("lessons").select("id, theme_id, slug, title, objective, estimated_minutes, sort_order").order("sort_order"),
    supabase.from("lesson_progress").select("lesson_id, status, progress_percent").eq("user_id", userId)
  ]);

  if (stages.error || themes.error || lessons.error || progress.error) return { ok: false as const, error: "读取学习路线失败" };
  const stageMap = new Map((stages.data ?? []).map((stage) => [stage.id, stage]));
  const themeMap = new Map((themes.data ?? []).map((theme) => [theme.id, theme]));
  const progressMap = new Map((progress.data ?? []).map((item) => [item.lesson_id, item]));
  const entries = (lessons.data ?? []).map((lesson) => {
    const theme = themeMap.get(lesson.theme_id);
    const stage = theme ? stageMap.get(theme.stage_id) : null;
    const saved = progressMap.get(lesson.id);
    return {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      objective: lesson.objective,
      estimated_minutes: lesson.estimated_minutes,
      sort_order: lesson.sort_order,
      theme_id: lesson.theme_id,
      theme_title: theme?.title ?? "学习主题",
      stage_id: theme?.stage_id ?? "",
      stage_title: stage?.title ?? "基础交流",
      progress_percent: saved?.progress_percent ?? 0,
      status: (saved?.status ?? "not_started") as LessonSummary["status"]
    } satisfies LessonSummary;
  });

  return { ok: true as const, data: { stages: stages.data ?? [], themes: themes.data ?? [], lessons: entries } };
}

export async function getLessonBySlug(userId: string, slug: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false as const, error: "课程数据暂不可用" };
  const lesson = await supabase.from("lessons").select("id, theme_id, slug, title, objective, estimated_minutes, sort_order").eq("slug", slug).maybeSingle();
  if (lesson.error || !lesson.data) return { ok: false as const, status: 404, error: "找不到这节课" };
  const theme = await supabase.from("learning_themes").select("id, stage_id, title").eq("id", lesson.data.theme_id).single();
  if (theme.error || !theme.data) return { ok: false as const, status: 500, error: "读取课程主题失败" };
  const [stage, items, progress] = await Promise.all([
    supabase.from("learning_stages").select("id, title").eq("id", theme.data.stage_id).single(),
    supabase.from("lesson_items").select("*").eq("lesson_id", lesson.data.id).order("sort_order"),
    supabase.from("lesson_progress").select("status, progress_percent, current_item_order").eq("user_id", userId).eq("lesson_id", lesson.data.id).maybeSingle()
  ]);
  if (stage.error || items.error || progress.error) return { ok: false as const, status: 500, error: "读取课程内容失败" };
  return {
    ok: true as const,
    data: {
      ...lesson.data,
      theme_title: theme.data.title,
      stage_id: theme.data.stage_id,
      stage_title: stage.data?.title ?? "基础交流",
      progress_percent: progress.data?.progress_percent ?? 0,
      status: (progress.data?.status ?? "not_started") as LessonSummary["status"],
      items: (items.data ?? []) as LessonItem[]
    } satisfies LessonDetail
  };
}

export async function saveLessonProgress(input: { userId: string; lessonId: string; progressPercent: number; currentItemOrder: number; completed?: boolean }) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false as const, status: 503, error: "课程数据暂不可用" };
  const completed = input.completed || input.progressPercent >= 100;
  const result = await supabase.from("lesson_progress").upsert({
    user_id: input.userId,
    lesson_id: input.lessonId,
    status: completed ? "completed" : "in_progress",
    current_item_order: input.currentItemOrder,
    progress_percent: Math.min(100, Math.max(0, input.progressPercent)),
    started_at: new Date().toISOString(),
    completed_at: completed ? new Date().toISOString() : null,
    updated_at: new Date().toISOString()
  }, { onConflict: "user_id,lesson_id" }).select("status, progress_percent").single();
  if (result.error) return { ok: false as const, status: 500, error: "保存课程进度失败" };
  return { ok: true as const, data: result.data };
}

export async function saveLessonItemFeedback(input: { userId: string; itemId: string; feedback: "known" | "uncertain" | "unknown" }) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false as const, status: 503, error: "学习反馈暂不可用" };
  const existing = await supabase.from("lesson_item_feedback").select("seen_count, known_streak, reinforcement_count").eq("user_id", input.userId).eq("lesson_item_id", input.itemId).maybeSingle();
  if (existing.error) return { ok: false as const, status: 500, error: "读取学习反馈失败" };
  const seenCount = Number(existing.data?.seen_count ?? 0) + 1;
  const knownStreak = input.feedback === "known" ? Number(existing.data?.known_streak ?? 0) + 1 : 0;
  const reinforcementCount = Number(existing.data?.reinforcement_count ?? 0) + (input.feedback === "unknown" ? 1 : 0);
  const nextDays = input.feedback === "known" ? Math.min(14, Math.max(1, knownStreak * 2)) : input.feedback === "uncertain" ? 1 : 0;
  const result = await supabase.from("lesson_item_feedback").upsert({ user_id: input.userId, lesson_item_id: input.itemId, feedback_state: input.feedback, seen_count: seenCount, known_streak: knownStreak, reinforcement_count: reinforcementCount, next_review_at: new Date(Date.now() + nextDays * 86400000).toISOString(), last_feedback_at: new Date().toISOString() }, { onConflict: "user_id,lesson_item_id" }).select("feedback_state, known_streak, next_review_at").single();
  if (result.error) return { ok: false as const, status: 500, error: "保存学习反馈失败" };
  return { ok: true as const, data: result.data };
}

export async function getContinueLesson(userId: string) {
  const path = await getLearningPath(userId);
  if (!path.ok) return path;
  const lesson = path.data.lessons.find((item) => item.status === "in_progress") ?? path.data.lessons.find((item) => item.status !== "completed") ?? path.data.lessons[0];
  return { ok: true as const, data: lesson ?? null };
}
