import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getSessionUserId } from "@/lib/session";
import { getCurrentUser } from "@/lib/users";
import { getWeaknessSummary } from "@/lib/insights";

export default async function GrowthPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const user = await getCurrentUser(userId);
  const result = await getWeaknessSummary(userId);
  const weaknesses = result.ok ? result.data.weaknesses : [];
  const openMistakes = result.ok ? result.data.openMistakes : 0;
  return <AppShell userHandle={user?.handle ?? "当前用户"} activeNav="Weakness"><div className="space-y-5"><section><p className="text-sm font-medium text-brand-700">Weakness</p><h1 className="mt-2 text-2xl font-semibold text-ink-950">找到下一步该强化的能力</h1><p className="mt-2 text-sm leading-6 text-ink-600">这里不是错误清单，而是从学习反馈里找出最值得重新练习的方向。</p></section><section className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-focus p-5 text-white"><p className="text-sm text-white/75">待处理错误</p><p className="mt-2 text-3xl font-semibold">{openMistakes}<span className="ml-2 text-base font-normal text-white/75">条</span></p><Link href="/practice" className="mt-5 inline-flex text-sm font-medium text-white underline underline-offset-4">开始强化 →</Link></div><div className="rounded-2xl bg-white p-5 shadow-soft"><p className="text-sm text-ink-600">追踪中的能力方向</p><p className="mt-2 text-3xl font-semibold text-ink-950">{weaknesses.length}<span className="ml-2 text-base font-normal text-ink-600">项</span></p><p className="mt-5 text-sm text-ink-600">每次练习后会自动更新。</p></div></section><section><div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-ink-950">能力分析</h2><span className="text-xs text-ink-600">错误率越高，优先级越高</span></div><div className="mt-3 grid gap-3">{weaknesses.map((item) => <article key={item.dimension} className="rounded-xl border border-line bg-white p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-lg font-semibold text-ink-950">{item.dimension}</p><p className="mt-1 text-sm text-ink-600">最近有 {item.evidence_count} 条错误证据</p></div><p className="text-lg font-semibold text-focus">掌握度 {Math.max(0, 100 - item.score)}%</p></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-panel"><div className="h-full rounded-full bg-focus" style={{ width: `${Math.min(100, item.score)}%` }} /></div><Link href="/practice" className="mt-4 inline-flex text-sm font-medium text-brand-700">重新练习这一项 →</Link></article>)}{weaknesses.length === 0 ? <div className="rounded-xl border border-dashed border-line bg-white p-6"><p className="font-medium text-ink-950">还没有足够的错误证据</p><p className="mt-2 text-sm leading-6 text-ink-600">完成 Lesson 后做一次练习，系统会开始建立你的能力画像。</p><Link href="/learning" className="mt-4 inline-flex text-sm font-medium text-brand-700">去学习路线 →</Link></div> : null}</div></section></div></AppShell>;
}
