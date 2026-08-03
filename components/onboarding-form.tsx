"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const levels = [["A1", "刚开始建立基础"], ["A2", "能处理简单日常交流"], ["B1", "可以表达熟悉话题"], ["B2", "希望表达更自然"], ["unknown", "我不确定，帮我从基础开始"]];
const goals = [["daily", "日常交流"], ["work", "工作英语"], ["travel", "出国生活"], ["ielts", "IELTS"], ["general", "综合提升"]];

export function OnboardingForm({ initialLevel, initialGoal, initialMinutes }: { initialLevel?: string; initialGoal?: string | null; initialMinutes?: number }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [level, setLevel] = useState(levels.some(([value]) => value === initialLevel) ? initialLevel ?? "unknown" : "unknown");
  const [goal, setGoal] = useState(goals.some(([value]) => value === initialGoal) ? initialGoal ?? "general" : "general");
  const [dailyMinutes, setDailyMinutes] = useState(initialMinutes === 10 || initialMinutes === 30 ? initialMinutes : 20);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current_level: level, goal_type: goal, daily_minutes: dailyMinutes }) });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) { setError(payload.error ?? "保存失败，请稍后再试"); return; }
      router.replace("/dashboard");
      router.refresh();
    } catch { setError("无法连接服务，请检查网络"); } finally { setSaving(false); }
  }

  return <form onSubmit={submit} className="rounded-xl border border-line bg-white p-5 shadow-soft sm:p-7">
    <div className="mb-6 flex items-center justify-between text-xs text-ink-600"><span>设置 {step} / 3</span><div className="h-1.5 w-32 overflow-hidden rounded-full bg-line"><div className="h-full bg-brand-600 transition-all" style={{ width: `${(step / 3) * 100}%` }} /></div></div>
    {step === 1 ? <fieldset><legend className="text-xl font-semibold text-ink-950">你现在大概在哪里？</legend><p className="mt-2 text-sm text-ink-600">不用考试，凭感觉选择就好。</p><div className="mt-5 grid gap-2">{levels.map(([value, label]) => <label key={value} className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition ${level === value ? "border-brand-600 bg-brand-50" : "border-line"}`}><span><span className="block font-medium text-ink-950">{value === "unknown" ? "不确定" : value}</span><span className="mt-1 block text-xs text-ink-600">{label}</span></span><input type="radio" name="level" value={value} checked={level === value} onChange={() => setLevel(value)} className="h-4 w-4 accent-brand-700" /></label>)}</div></fieldset> : null}
    {step === 2 ? <fieldset><legend className="text-xl font-semibold text-ink-950">你最想先解决什么？</legend><p className="mt-2 text-sm text-ink-600">这会影响推荐的主题和练习场景。</p><div className="mt-5 grid gap-2">{goals.map(([value, label]) => <label key={value} className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition ${goal === value ? "border-brand-600 bg-brand-50" : "border-line"}`}><span className="font-medium text-ink-950">{label}</span><input type="radio" name="goal" value={value} checked={goal === value} onChange={() => setGoal(value)} className="h-4 w-4 accent-brand-700" /></label>)}</div></fieldset> : null}
    {step === 3 ? <fieldset><legend className="text-xl font-semibold text-ink-950">每天留出多少时间？</legend><p className="mt-2 text-sm text-ink-600">计划会把时间分成几段短任务，容易坚持。</p><div className="mt-5 grid gap-2 sm:grid-cols-3">{[10, 20, 30].map((value) => <label key={value} className={`cursor-pointer rounded-lg border p-4 text-center transition ${dailyMinutes === value ? "border-brand-600 bg-brand-50" : "border-line"}`}><span className="block text-2xl font-semibold text-ink-950">{value}</span><span className="mt-1 block text-xs text-ink-600">分钟 / 天</span><input type="radio" name="minutes" value={value} checked={dailyMinutes === value} onChange={() => setDailyMinutes(value)} className="sr-only" /></label>)}</div></fieldset> : null}
    {error ? <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    <div className="mt-7 flex gap-3"><button type="button" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1 || saving} className="h-12 flex-1 rounded-md border border-line px-4 text-sm font-medium text-ink-800 disabled:invisible">上一步</button><button type="submit" disabled={saving} className="h-12 flex-[2] rounded-md bg-brand-700 px-4 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-60">{saving ? "正在生成..." : step === 3 ? "生成我的学习计划" : "下一步"}</button></div>
  </form>;
}
