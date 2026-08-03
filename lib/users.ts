import { getSupabaseAdminClient } from "@/lib/supabase";
import type { UserRow } from "@/lib/types";

type CreateOrFindUserResult =
  | {
      ok: true;
      created: boolean;
      user: UserRow;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

const DEFAULT_USER_VALUES = {
  current_level: "unknown",
  target_level: null,
  learning_phase: "Foundation",
  study_preference: {},
  ui_language: "zh-CN",
  goal_type: null,
  daily_minutes: 20,
  onboarding_completed: false
} as const;

export async function createOrFindUser(handle: string): Promise<CreateOrFindUserResult> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      ok: false,
      status: 503,
      error: "Supabase 环境变量未配置，请先设置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY"
    };
  }

  const existing = await supabase
    .from("users")
    .select("*")
    .eq("handle", handle)
    .maybeSingle();

  if (existing.error) {
    return {
      ok: false,
      status: 500,
      error: `查询用户失败：${existing.error.message}`
    };
  }

  if (existing.data) {
    return {
      ok: true,
      created: false,
      user: existing.data as UserRow
    };
  }

  const inserted = await supabase
    .from("users")
    .insert({
      handle,
      display_name: handle,
      ...DEFAULT_USER_VALUES
    })
    .select("*")
    .single();

  if (inserted.error) {
    if (inserted.error.code === "23505") {
      const retry = await supabase
        .from("users")
        .select("*")
        .eq("handle", handle)
        .single();

      if (!retry.error && retry.data) {
        return {
          ok: true,
          created: false,
          user: retry.data as UserRow
        };
      }
    }

    return {
      ok: false,
      status: 500,
      error: `创建用户失败：${inserted.error.message}`
    };
  }

  return {
    ok: true,
    created: true,
    user: inserted.data as UserRow
  };
}

export async function getCurrentUser(userId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as UserRow;
}
