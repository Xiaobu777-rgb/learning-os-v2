import { getSupabaseAdminClient } from "@/lib/supabase";

export type ReviewItem = {
  id: string;
  dictionaryId: string;
  term: string;
  meaning: string;
  mastery: number;
  errors: number;
  reason: string;
  nextReviewAt: string | null;
};

export async function getReviewCenter(userId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false as const, error: "复习数据暂不可用" };
  const now = new Date().toISOString();
  const [statuses, mistakes, dueReviews] = await Promise.all([
    supabase.from("user_dictionary_status").select("id, system_dictionary_id, correct_count, incorrect_count, known_streak, next_review_at, system_dictionary(term, meaning_zh)").eq("user_id", userId).neq("status", "mastered").lte("next_review_at", now).order("next_review_at", { ascending: true }).limit(30),
    supabase.from("mistakes").select("system_dictionary_id, mistake_type, created_at, system_dictionary(term, meaning_zh)").eq("user_id", userId).is("resolved_at", null).order("created_at", { ascending: false }).limit(30),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", userId).is("reviewed_at", null).lte("scheduled_for", now)
  ]);
  if (statuses.error || mistakes.error || dueReviews.error) return { ok: false as const, error: "读取复习数据失败" };
  const errorMap = new Map<string, { count: number; reason: string }>();
  for (const mistake of mistakes.data ?? []) {
    const id = mistake.system_dictionary_id as string;
    const old = errorMap.get(id) ?? { count: 0, reason: "最近练习中出现错误" };
    errorMap.set(id, { count: old.count + 1, reason: String(mistake.mistake_type ?? "练习错误") });
  }
  const items = (statuses.data ?? []).map((row) => {
    const dictionary = Array.isArray(row.system_dictionary) ? row.system_dictionary[0] : row.system_dictionary;
    const errors = errorMap.get(row.system_dictionary_id as string);
    const correct = Number(row.correct_count ?? 0);
    const incorrect = Number(row.incorrect_count ?? 0);
    return { id: row.id as string, dictionaryId: row.system_dictionary_id as string, term: String(dictionary?.term ?? "学习内容"), meaning: String(dictionary?.meaning_zh ?? ""), mastery: Math.min(99, Math.round((correct / Math.max(correct + incorrect + 1, 1)) * 100)), errors: errors?.count ?? incorrect, reason: errors?.reason ?? "到了复习时间", nextReviewAt: (row.next_review_at as string | null) ?? null } satisfies ReviewItem;
  });
  return { ok: true as const, data: { items, dueCount: dueReviews.count ?? items.length } };
}
