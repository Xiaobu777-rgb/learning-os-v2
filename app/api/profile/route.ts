import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getSupabaseAdminClient } from "@/lib/supabase";

const levels = new Set(["A1", "A2", "B1", "B2", "unknown"]);
const goals = new Set(["daily", "work", "travel", "ielts", "general"]);
const minutes = new Set([10, 20, 30]);

export async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "数据库连接不可用" }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "请求格式不正确" }, { status: 400 });
  }

  const currentLevel = typeof body.current_level === "string" ? body.current_level : "unknown";
  const goalType = typeof body.goal_type === "string" ? body.goal_type : "general";
  const dailyMinutes = Number(body.daily_minutes ?? 20);
  if (!levels.has(currentLevel) || !goals.has(goalType) || !minutes.has(dailyMinutes)) {
    return NextResponse.json({ error: "学习设置不完整" }, { status: 400 });
  }

  const result = await supabase.from("users").update({
    current_level: currentLevel,
    goal_type: goalType,
    daily_minutes: dailyMinutes,
    learning_phase: currentLevel === "unknown" || currentLevel === "A1" ? "Foundation" : "Building confidence",
    onboarding_completed: true,
    updated_at: new Date().toISOString()
  }).eq("id", userId).select("*").single();

  if (result.error) return NextResponse.json({ error: "保存学习设置失败" }, { status: 500 });
  return NextResponse.json({ user: result.data });
}
