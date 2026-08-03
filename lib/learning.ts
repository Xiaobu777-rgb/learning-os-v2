import { getSupabaseAdminClient } from "@/lib/supabase";
import type { SystemDictionaryEntry } from "@/lib/dictionary";

export type LearningCard = SystemDictionaryEntry & {
  status: "new" | "learning" | "mastered";
  times_seen: number;
  correct_count: number;
  incorrect_count: number;
  next_review_at: string | null;
};

export type LearningStats = {
  total: number;
  started: number;
  mastered: number;
  correct: number;
  incorrect: number;
  streak: number;
};

export async function getNextLearningCard(userId: string, mode: "learn" | "practice" | "review" = "learn") {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return fail<LearningCard>(503, "Supabase 环境变量未配置，请先运行数据库迁移并设置环境变量");

  const statuses = await supabase.from("user_dictionary_status").select("system_dictionary_id, status, times_seen, correct_count, incorrect_count, next_review_at").eq("user_id", userId);
  if (statuses.error) return fail<LearningCard>(500, `读取掌握状态失败：${statuses.error.message}`);
  const statusMap = new Map((statuses.data ?? []).map((row) => [row.system_dictionary_id as string, row]));

  let entriesQuery = supabase.from("system_dictionary").select("*").order("frequency_rank", { ascending: true, nullsFirst: false }).limit(160);
  if (mode === "review") entriesQuery = entriesQuery.lte("frequency_rank", 2000);
  const entries = await entriesQuery;
  if (entries.error) return fail<LearningCard>(500, `读取训练词条失败：${entries.error.message}`);

  const now = Date.now();
  const candidates = (entries.data ?? []).filter((entry) => {
    const status = statusMap.get(entry.id as string);
    if (!status) return mode !== "review";
    if (mode === "learn") return status.status !== "mastered";
    if (mode === "practice") return status.status !== "mastered";
    return status.next_review_at ? new Date(status.next_review_at).getTime() <= now : status.status !== "mastered";
  });
  const entry = candidates[0] ?? (mode === "review" ? null : entries.data?.[0]);
  if (!entry) return { ok: true as const, data: null };
  const status = statusMap.get(entry.id as string);
  return {
    ok: true as const,
    data: {
      ...(entry as SystemDictionaryEntry),
      status: (status?.status ?? "new") as LearningCard["status"],
      times_seen: status?.times_seen ?? 0,
      correct_count: status?.correct_count ?? 0,
      incorrect_count: status?.incorrect_count ?? 0,
      next_review_at: (status?.next_review_at as string | null) ?? null
    }
  };
}

export async function recordTrainingResult(input: {
  userId: string;
  dictionaryId: string;
  activityType: "learn" | "practice" | "review";
  result: "correct" | "incorrect" | "skipped";
  response?: string;
}) {
  const feedback = input.result === "correct" ? "known" : input.result === "skipped" ? "uncertain" : "unknown";
  return recordLearningFeedback({ ...input, feedback });
}

export async function recordLearningFeedback(input: {
  userId: string;
  dictionaryId: string;
  activityType: "learn" | "practice" | "review";
  feedback: "known" | "uncertain" | "unknown";
  response?: string;
}) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return fail<null>(503, "Supabase 环境变量未配置，请先运行数据库迁移并设置环境变量");

  const entry = await supabase.from("system_dictionary").select("id, term, meaning_zh").eq("id", input.dictionaryId).single();
  if (entry.error || !entry.data) return fail<null>(404, "找不到训练词条");

  const existing = await supabase.from("user_dictionary_status").select("*").eq("user_id", input.userId).eq("system_dictionary_id", input.dictionaryId).maybeSingle();
  if (existing.error) return fail<null>(500, `读取掌握状态失败：${existing.error.message}`);
  const current = existing.data;
  const timesSeen = (current?.times_seen ?? 0) + 1;
  const result = input.feedback === "known" ? "correct" : input.feedback === "uncertain" ? "skipped" : "incorrect";
  const correctCount = (current?.correct_count ?? 0) + (input.feedback === "known" ? 1 : 0);
  const incorrectCount = (current?.incorrect_count ?? 0) + (input.feedback === "unknown" ? 1 : 0);
  const knownStreak = input.feedback === "known" ? (current?.known_streak ?? 0) + 1 : 0;
  const reinforcementCount = (current?.reinforcement_count ?? 0) + (input.feedback === "unknown" ? 1 : 0);
  const status = input.feedback === "known" && knownStreak >= 3 ? "mastered" : "learning";
  const daysUntilReview = input.feedback === "known" ? Math.min(14, Math.max(1, knownStreak * 2)) : input.feedback === "uncertain" ? 1 : 0;
  const nextReview = new Date(Date.now() + daysUntilReview * 24 * 60 * 60 * 1000).toISOString();

  const statusResult = await supabase.from("user_dictionary_status").upsert({
    user_id: input.userId,
    system_dictionary_id: input.dictionaryId,
    status,
    times_seen: timesSeen,
    correct_count: correctCount,
    incorrect_count: incorrectCount,
    feedback_state: input.feedback,
    known_streak: knownStreak,
    reinforcement_count: reinforcementCount,
    last_studied_at: new Date().toISOString(),
    next_review_at: nextReview
  }, { onConflict: "user_id,system_dictionary_id" });
  if (statusResult.error) return fail<null>(500, `更新掌握状态失败：${statusResult.error.message}`);

  const record = await supabase.from("learning_records").insert({
    user_id: input.userId,
    system_dictionary_id: input.dictionaryId,
    activity_type: input.activityType,
    result,
    response: input.response?.trim() || null
  });
  if (record.error) return fail<null>(500, `保存训练记录失败：${record.error.message}`);

  if (input.feedback === "unknown") {
    const mistake = await supabase.from("mistakes").insert({
      user_id: input.userId,
      system_dictionary_id: input.dictionaryId,
      prompt: entry.data.meaning_zh,
      user_answer: input.response?.trim() ?? "",
      correct_answer: entry.data.term,
      mistake_type: input.activityType === "practice" ? "practice" : "learning"
    });
    if (mistake.error) return fail<null>(500, `保存错误记录失败：${mistake.error.message}`);
  }

  if (input.activityType === "review") {
    const review = await supabase.from("reviews").insert({
      user_id: input.userId,
      system_dictionary_id: input.dictionaryId,
      scheduled_for: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
      result
    });
    if (review.error) return fail<null>(500, `保存 Review 记录失败：${review.error.message}`);
  }

  const records = await supabase.from("learning_records").select("result").eq("user_id", input.userId).in("activity_type", ["learn", "practice", "review"]);
  if (!records.error) {
    const all = records.data ?? [];
    const incorrect = all.filter((row) => row.result === "incorrect").length;
    const answered = all.filter((row) => row.result !== "skipped").length;
    await supabase.from("weakness_profiles").upsert({
      user_id: input.userId,
      dimension: "spelling",
      score: answered ? Math.round((incorrect / answered) * 100) : 0,
      evidence_count: incorrect
    }, { onConflict: "user_id,dimension" });
  }

  return { ok: true as const, data: { status, feedback: input.feedback, correctCount, incorrectCount, knownStreak, nextReview } };
}

export async function getLearningStats(userId: string): Promise<{ ok: true; data: LearningStats } | { ok: false; status: number; error: string }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return fail<LearningStats>(503, "Supabase 环境变量未配置，请先运行数据库迁移并设置环境变量");
  const [total, statuses, records] = await Promise.all([
    supabase.from("system_dictionary").select("id", { count: "exact", head: true }),
    supabase.from("user_dictionary_status").select("status").eq("user_id", userId),
    supabase.from("learning_records").select("result, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(300)
  ]);
  if (total.error || statuses.error || records.error) return fail<LearningStats>(500, "读取学习统计失败");
  const rows = statuses.data ?? [];
  const recordRows = records.data ?? [];
  const dayKeys = new Set(recordRows.map((row) => new Date(row.created_at as string).toISOString().slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  while (dayKeys.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { ok: true, data: {
    total: total.count ?? 0,
    started: rows.filter((row) => row.status !== "new").length,
    mastered: rows.filter((row) => row.status === "mastered").length,
    correct: recordRows.filter((row) => row.result === "correct").length,
    incorrect: recordRows.filter((row) => row.result === "incorrect").length,
    streak
  }};
}

function fail<T>(status: number, error: string) {
  return { ok: false as const, status, error };
}
