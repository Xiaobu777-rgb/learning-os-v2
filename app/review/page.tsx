import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getReviewCenter } from "@/lib/review-center";
import { getSessionUserId } from "@/lib/session";
import { getCurrentUser } from "@/lib/users";

export default async function ReviewPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const [user, center] = await Promise.all([getCurrentUser(userId), getReviewCenter(userId)]);
  const data = center.ok ? center.data : { items: [], dueCount: 0 };
  return <AppShell userHandle={user?.handle ?? "当前用户"} activeNav="复习"><div className="space-y-5"><section><p className="text-sm font-medium text-brand-700">Review</p><h1 className="mt-2 text-2xl font-semibold text-ink-950">把不稳定的内容变熟</h1><p className="mt-2 text-sm leading-6 text-ink-600">Review 会优先安排到期内容和最近出错的内容。</p></section><section className="rounded-2xl bg-ink-950 p-5 text-white shadow-soft sm:p-7"><p className="text-sm text-white/70">今天的复习队列</p><p className="mt-2 text-3xl font-semibold">{data.dueCount} <span className="text-base font-normal text-white/70">项待复习</span></p><Link href="/practice?mode=review" className="mt-5 inline-flex h-11 items-center rounded-md bg-white px-5 text-sm font-medium text-ink-950">开始复习</Link></section><section><div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-ink-950">为什么现在复习</h2><span className="text-xs text-ink-600">掌握度越低越优先</span></div><div className="mt-3 grid gap-3">{data.items.map((item) => <div key={item.id} className="rounded-xl border border-line bg-white p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-lg font-semibold text-ink-950">{item.term}</p><p className="mt-1 text-sm text-ink-600">{item.meaning}</p></div><span className="text-sm font-semibold text-focus">掌握度 {item.mastery}%</span></div><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-600"><span>错误 {item.errors} 次</span><span>原因：{item.reason}</span></div></div>)}{data.items.length === 0 ? <div className="rounded-xl border border-dashed border-line bg-white p-6 text-sm leading-6 text-ink-600">现在还没有到期复习内容。完成课程和练习后，系统会在这里安排下一次复习。</div> : null}</div></section></div></AppShell>;
}
