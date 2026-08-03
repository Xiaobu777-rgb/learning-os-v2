import { getSupabaseAdminClient } from "@/lib/supabase";
import { getContinueLesson } from "@/lib/curriculum";

export type DailyPlanItem = {
  id: string;
  task_type: "lesson" | "vocabulary" | "phrases" | "review" | "practice" | "weakness";
  title: string;
  description: string;
  target_minutes: number;
  route: string;
  sort_order: number;
  completed: boolean;
};

export async function getTodayPlan(userId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false as const, error: "今日计划暂不可用" };
  const today = new Date().toISOString().slice(0, 10);
  const user = await supabase.from("users").select("daily_minutes").eq("id", userId).single();
  if (user.error) return { ok: false as const, error: "读取每日计划设置失败" };
  const existing = await supabase.from("daily_plans").select("id, plan_date, target_minutes, completed_minutes").eq("user_id", userId).eq("plan_date", today).maybeSingle();
  if (existing.error) return { ok: false as const, error: "读取今日计划失败" };
  const plan = existing.data ?? await createDailyPlan(userId, Number(user.data?.daily_minutes ?? 20), today);
  if (!plan) return { ok: false as const, error: "创建今日计划失败" };
  const items = await supabase.from("daily_plan_items").select("id, task_type, title, description, target_minutes, route, sort_order, completed").eq("daily_plan_id", plan.id).order("sort_order");
  if (items.error) return { ok: false as const, error: "读取今日任务失败" };
  return { ok: true as const, data: { ...plan, items: (items.data ?? []) as DailyPlanItem[] } };
}

async function createDailyPlan(userId: string, dailyMinutes: number, date: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;
  const continueLesson = await getContinueLesson(userId);
  const lessonRoute = continueLesson.ok && continueLesson.data ? `/learning/${continueLesson.data.slug}` : "/learning";
  const allTasks = [
    { task_type: "lesson", title: "新课学习", description: "学习一节课程中的词汇、短语和例句。", target_minutes: 5, route: lessonRoute, sort_order: 1 },
    { task_type: "phrases", title: "高频短语", description: "把今天的表达放进真实句子里。", target_minutes: 5, route: "/practice?mode=usage", sort_order: 2 },
    { task_type: "review", title: "Review 复习", description: "巩固最近不稳定的内容。", target_minutes: 5, route: "/review", sort_order: 3 },
    { task_type: "practice", title: "练习巩固", description: "用一次小练习确认今天的掌握情况。", target_minutes: 5, route: "/practice", sort_order: 4 }
  ];
  const taskCount = dailyMinutes <= 10 ? 2 : dailyMinutes >= 30 ? 5 : 4;
  const tasks = dailyMinutes >= 30 ? [...allTasks, { task_type: "weakness", title: "薄弱点强化", description: "针对最近的错误再练一次。", target_minutes: 10, route: "/weakness", sort_order: 5 }] : allTasks.slice(0, taskCount);
  const total = tasks.reduce((sum, item) => sum + item.target_minutes, 0);
  const inserted = await supabase.from("daily_plans").insert({ user_id: userId, plan_date: date, target_minutes: total }).select("id, plan_date, target_minutes, completed_minutes").single();
  if (inserted.error || !inserted.data) return null;
  const taskInsert = await supabase.from("daily_plan_items").insert(tasks.map((task) => ({ ...task, daily_plan_id: inserted.data.id })));
  if (taskInsert.error) return null;
  return inserted.data;
}

export async function completeDailyPlanItem(userId: string, itemId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false as const, status: 503, error: "今日计划暂不可用" };
  const item = await supabase.from("daily_plan_items").select("id, daily_plan_id, target_minutes, completed").eq("id", itemId).single();
  if (item.error || !item.data) return { ok: false as const, status: 404, error: "找不到今日任务" };
  const plan = await supabase.from("daily_plans").select("id, user_id, completed_minutes").eq("id", item.data.daily_plan_id).eq("user_id", userId).single();
  if (plan.error || !plan.data) return { ok: false as const, status: 403, error: "无权更新今日任务" };
  if (!item.data.completed) {
    await supabase.from("daily_plan_items").update({ completed: true, completed_at: new Date().toISOString() }).eq("id", itemId);
    await supabase.from("daily_plans").update({ completed_minutes: Number(plan.data.completed_minutes ?? 0) + Number(item.data.target_minutes ?? 0) }).eq("id", plan.data.id);
  }
  return { ok: true as const };
}
