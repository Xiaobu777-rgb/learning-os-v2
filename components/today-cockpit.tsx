import Link from "next/link";
import type { DailyPlanItem } from "@/lib/plans";
import type { LearningStats } from "@/lib/learning";

const goalLabels: Record<string, string> = { daily: "日常交流", work: "工作英语", travel: "出国生活", ielts: "IELTS", general: "综合提升" };

export function TodayCockpit({ user, plan, lesson, stats, weaknesses, openMistakes }: {
  user: { handle: string; current_level: string; target_level: string | null; learning_phase: string; goal_type?: string | null; daily_minutes?: number } | null;
  plan: { target_minutes: number; completed_minutes: number; items: DailyPlanItem[] };
  lesson: { slug: string; title: string; objective: string; progress_percent: number; estimated_minutes: number };
  stats: LearningStats;
  weaknesses: Array<{ dimension: string; score: number; evidence_count: number }>;
  openMistakes: number;
}) {
  const progress = Math.min(100, Math.round((plan.completed_minutes / Math.max(plan.target_minutes, 1)) * 100));
  const weakest = weaknesses[0];
  return <div className="space-y-5">
    <section className="flex items-end justify-between gap-4"><div><p className="text-sm font-medium text-brand-700">今天，继续向前</p><h1 className="mt-2 text-2xl font-semibold text-ink-950 sm:text-3xl">你好，{user?.handle ?? "学习者"}</h1><p className="mt-2 text-sm text-ink-600">{user?.learning_phase ?? "基础交流"} · {user?.current_level === "unknown" ? "待确认等级" : user?.current_level ?? "A1"} · {goalLabels[user?.goal_type ?? "general"] ?? "综合提升"}</p></div><Link href="/profile" className="hidden text-sm font-medium text-brand-700 sm:block">查看我的设置</Link></section>

    <section className="rounded-2xl bg-brand-700 p-5 text-white shadow-soft sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-white/75">今日学习计划</p><h2 className="mt-2 text-2xl font-semibold">今天学习 {plan.target_minutes} 分钟</h2></div><span className="text-2xl font-semibold">{progress}%</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-3 text-sm text-white/75">今日完成 {plan.completed_minutes} / {plan.target_minutes} 分钟</p></section>

    <section><div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-ink-950">今天做什么</h2><span className="text-xs text-ink-600">按顺序完成即可</span></div><div className="mt-3 grid gap-3 sm:grid-cols-2">{plan.items.map((item) => <Link href={item.route} key={item.id} className={`group rounded-xl border bg-white p-4 transition hover:-translate-y-0.5 hover:border-brand-600 ${item.completed ? "border-brand-200 opacity-70" : "border-line"}`}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-ink-950">{item.title}</p><p className="mt-1 text-xs leading-5 text-ink-600">{item.description}</p></div><span className="shrink-0 rounded-full bg-panel px-2 py-1 text-xs text-ink-600">{item.target_minutes} 分钟</span></div><p className="mt-4 text-xs font-medium text-brand-700">{item.completed ? "已完成" : "开始任务 →"}</p></Link>)}</div></section>

    <section className="rounded-xl border border-line bg-white p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-ink-600">继续学习</p><h2 className="mt-1 text-lg font-semibold text-ink-950">{lesson.title}</h2><p className="mt-1 text-sm text-ink-600">{lesson.objective}</p></div><span className="text-sm font-semibold text-brand-700">{lesson.progress_percent}%</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-panel"><div className="h-full rounded-full bg-focus" style={{ width: `${lesson.progress_percent}%` }} /></div><Link href={`/learning/${lesson.slug}`} className="mt-4 inline-flex h-10 items-center rounded-md bg-ink-950 px-4 text-sm font-medium text-white">继续学习</Link></section>

    <section><h2 className="text-lg font-semibold text-ink-950">你的成长</h2><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["学习天数", stats.streak, "天"], ["掌握内容", stats.mastered, "个"], ["已开始", stats.started, "个"], ["待处理错误", openMistakes, "条"]].map(([label, value, suffix]) => <div key={label} className="rounded-xl border border-line bg-white p-4"><p className="text-xs text-ink-600">{label}</p><p className="mt-2 text-2xl font-semibold text-ink-950">{value}<span className="ml-1 text-xs font-normal text-ink-600">{suffix}</span></p></div>)}</div></section>

    <section className="rounded-xl border border-line bg-white p-5"><div className="flex items-center justify-between gap-4"><div><p className="text-sm text-ink-600">Weakness</p><h2 className="mt-1 text-lg font-semibold text-ink-950">{weakest ? `你的薄弱点：${weakest.dimension}` : "你的薄弱点会在练习后出现"}</h2><p className="mt-2 text-sm text-ink-600">{weakest ? `掌握度 ${Math.max(0, 100 - weakest.score)}%，最近有 ${weakest.evidence_count} 条错误证据。` : "完成一次练习，系统会开始记录你的能力变化。"}</p></div><Link href={weakest ? "/weakness" : "/practice"} className="shrink-0 text-sm font-medium text-brand-700">{weakest ? "开始强化 →" : "去练习 →"}</Link></div></section>
  </div>;
}
