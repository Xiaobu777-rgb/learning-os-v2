import { getSupabaseAdminClient } from "@/lib/supabase";

export type SystemDictionaryEntry = {
  id: string;
  term: string;
  normalized_term: string;
  meaning_zh: string;
  part_of_speech: string | null;
  level: string;
  category: string;
  frequency_rank: number | null;
  source: string;
};

export type PersonalDictionaryEntry = {
  id: string;
  user_id: string;
  content: string;
  normalized_content: string;
  item_type: "word" | "phrase" | "sentence";
  meaning_zh: string;
  category: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type DictionaryDataResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

export function normalizeDictionaryTerm(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

export async function searchSystemDictionary(input: {
  query?: string;
  category?: string;
  level?: string;
  limit?: number;
}) : Promise<DictionaryDataResult<{ entries: SystemDictionaryEntry[]; categories: string[] }>> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return databaseUnavailable();

  const limit = Math.min(Math.max(input.limit ?? 40, 1), 100);
  let query = supabase
    .from("system_dictionary")
    .select("*")
    .order("frequency_rank", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (input.query?.trim()) {
    const safeQuery = input.query.trim().replace(/[%_,]/g, " ");
    query = query.ilike("term", `%${safeQuery}%`);
  }
  if (input.category && input.category !== "all") query = query.eq("category", input.category);
  if (input.level && input.level !== "all") query = query.eq("level", input.level);

  const [entriesResult, categoryResult] = await Promise.all([
    query,
    supabase.from("system_dictionary").select("category").order("category")
  ]);

  if (entriesResult.error || categoryResult.error) {
    return { ok: false, status: 500, error: `查询系统词库失败：${entriesResult.error?.message ?? categoryResult.error?.message}` };
  }

  const categories = Array.from(new Set((categoryResult.data ?? []).map((row) => row.category as string)));
  return { ok: true, data: { entries: (entriesResult.data ?? []) as SystemDictionaryEntry[], categories } };
}

export async function getPersonalDictionary(userId: string, input: { query?: string; category?: string } = {}) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return databaseUnavailable<PersonalDictionaryEntry[]>();

  let query = supabase
    .from("personal_dictionary")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (input.query?.trim()) {
    const safeQuery = input.query.trim().replace(/[%_,]/g, " ");
    query = query.or(`content.ilike.%${safeQuery}%,meaning_zh.ilike.%${safeQuery}%`);
  }
  if (input.category && input.category !== "all") query = query.eq("category", input.category);

  const result = await query;
  if (result.error) return { ok: false, status: 500, error: `查询个人词库失败：${result.error.message}` } as const;
  return { ok: true, data: (result.data ?? []) as PersonalDictionaryEntry[] } as const;
}

export async function createPersonalDictionaryItem(input: {
  userId: string;
  content: string;
  itemType: "word" | "phrase" | "sentence";
  meaningZh: string;
  category: string;
  notes: string;
}) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return databaseUnavailable<{ duplicate: false; item?: PersonalDictionaryEntry }>();

  const content = input.content.trim();
  const normalized = normalizeDictionaryTerm(content);
  if (!content) return { ok: false, status: 400, error: "内容不能为空" } as const;
  if (!input.meaningZh.trim()) return { ok: false, status: 400, error: "请填写中文解释" } as const;

  const system = await supabase.from("system_dictionary").select("id, term").eq("normalized_term", normalized).maybeSingle();
  if (system.error) return { ok: false, status: 500, error: `检查系统词库失败：${system.error.message}` } as const;
  if (system.data) return { ok: true, data: { duplicate: true as const, duplicateType: "system" as const, duplicateTerm: system.data.term } } as const;

  const existing = await supabase.from("personal_dictionary").select("id, content").eq("user_id", input.userId).eq("normalized_content", normalized).maybeSingle();
  if (existing.error) return { ok: false, status: 500, error: `检查个人词库失败：${existing.error.message}` } as const;
  if (existing.data) return { ok: true, data: { duplicate: true as const, duplicateType: "personal" as const, duplicateTerm: existing.data.content } } as const;

  const inserted = await supabase.from("personal_dictionary").insert({
    user_id: input.userId,
    content,
    normalized_content: normalized,
    item_type: input.itemType,
    meaning_zh: input.meaningZh.trim(),
    category: input.category.trim() || "General",
    notes: input.notes.trim()
  }).select("*").single();

  if (inserted.error) return { ok: false, status: 500, error: `添加个人词条失败：${inserted.error.message}` } as const;
  return { ok: true, data: { duplicate: false as const, item: inserted.data as PersonalDictionaryEntry } } as const;
}

export async function updatePersonalDictionaryItem(userId: string, itemId: string, input: Partial<Pick<PersonalDictionaryEntry, "content" | "item_type" | "meaning_zh" | "category" | "notes">>) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return databaseUnavailable<PersonalDictionaryEntry>();

  const changes: Record<string, string> = {};
  if (input.content !== undefined) {
    const content = input.content.trim();
    if (!content) return { ok: false, status: 400, error: "内容不能为空" } as const;
    changes.content = content;
    changes.normalized_content = normalizeDictionaryTerm(content);
  }
  for (const key of ["item_type", "meaning_zh", "category", "notes"] as const) {
    if (input[key] !== undefined) changes[key] = input[key]!.trim();
  }

  const updated = await supabase.from("personal_dictionary").update(changes).eq("id", itemId).eq("user_id", userId).select("*").single();
  if (updated.error) return { ok: false, status: updated.error.code === "23505" ? 409 : 500, error: updated.error.code === "23505" ? "Already Exists" : `更新个人词条失败：${updated.error.message}` } as const;
  return { ok: true, data: updated.data as PersonalDictionaryEntry } as const;
}

export async function deletePersonalDictionaryItem(userId: string, itemId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return databaseUnavailable<null>();
  const result = await supabase.from("personal_dictionary").delete().eq("id", itemId).eq("user_id", userId);
  if (result.error) return { ok: false, status: 500, error: `删除个人词条失败：${result.error.message}` } as const;
  return { ok: true, data: null } as const;
}

function databaseUnavailable<T = null>(): DictionaryDataResult<T> {
  return { ok: false, status: 503, error: "Supabase 环境变量未配置，请先运行数据库迁移并设置环境变量" };
}
