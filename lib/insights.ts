import { getSupabaseAdminClient } from "@/lib/supabase";
import { getLearningStats, type LearningStats } from "@/lib/learning";

export type WeaknessSummary = {
  dimension: string;
  score: number;
  evidence_count: number;
};

export type DashboardSummary = {
  stats: LearningStats;
  weaknesses: WeaknessSummary[];
  openMistakes: number;
  dueReviews: number;
  recentActivity: Array<{ result: string; activity_type: string; created_at: string; term: string | null }>;
};

export async function getWeaknessSummary(userId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false as const, status: 503, error: "Supabase 环境变量未配置，请先运行数据库迁移并设置环境变量" };
  const [profiles, mistakes] = await Promise.all([
    supabase.from("weakness_profiles").select("dimension, score, evidence_count").eq("user_id", userId).order("score", { ascending: false }),
    supabase.from("mistakes").select("id").eq("user_id", userId).is("resolved_at", null)
  ]);
  if (profiles.error || mistakes.error) return { ok: false as const, status: 500, error: "读取弱点数据失败" };
  return { ok: true as const, data: { weaknesses: (profiles.data ?? []) as WeaknessSummary[], openMistakes: mistakes.data?.length ?? 0 } };
}

export async function getDashboardSummary(userId: string): Promise<{ ok: true; data: DashboardSummary } | { ok: false; status: number; error: string }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, status: 503, error: "Supabase 环境变量未配置，请先运行数据库迁移并设置环境变量" };
  const [stats, weakness, due, activity] = await Promise.all([
    getLearningStats(userId),
    getWeaknessSummary(userId),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", userId).is("reviewed_at", null).lte("scheduled_for", new Date().toISOString()),
    supabase.from("learning_records").select("result, activity_type, created_at, system_dictionary(term)").eq("user_id", userId).order("created_at", { ascending: false }).limit(8)
  ]);
  if (!stats.ok || !weakness.ok || due.error || activity.error) return { ok: false, status: 500, error: "读取 Dashboard 数据失败" };
  return { ok: true, data: {
    stats: stats.data,
    weaknesses: weakness.data.weaknesses,
    openMistakes: weakness.data.openMistakes,
    dueReviews: due.count ?? 0,
    recentActivity: (activity.data ?? []).map((row) => ({ result: row.result as string, activity_type: row.activity_type as string, created_at: row.created_at as string, term: Array.isArray(row.system_dictionary) ? (row.system_dictionary[0]?.term ?? null) : ((row.system_dictionary as { term?: string } | null)?.term ?? null) }))
  }};
}
