"use client";

import { useState } from "react";
import type { UserRow } from "@/lib/types";

const goalLabels: Record<string, string> = { daily: "日常交流", work: "工作英语", travel: "出国生活", ielts: "IELTS", general: "综合提升" };

export function ProfileSettings({ user }: { user: UserRow }) {
  const [level, setLevel] = useState(user.current_level);
  const [goal, setGoal] = useState(user.goal_type ?? "general");
  const [minutes, setMinutes] = useState(user.daily_minutes ?? 20);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true); setMessage("");
    const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current_level: level, goal_type: goal, daily_minutes: minutes }) });
    setMessage(response.ok ? "已保存" : "保存失败，请稍后再试");
    setSaving(false);
  }
  return <div className="space-y-5"><section><p className="text-sm font-medium text-brand-700">我的英语</p><h1 className="mt-2 text-2xl font-semibold text-ink-950">{user.display_name || user.handle}</h1><p className="mt-2 text-sm text-ink-600">ID：{user.handle} · 学习设置会影响你的每日计划。</p></section><section className="rounded-xl border border-line bg-white p-5"><h2 className="text-base font-semibold text-ink-950">学习画像</h2><div className="mt-5 grid gap-5 sm:grid-cols-3"><label className="text-sm text-ink-600">当前等级<select value={level} onChange={(event) => setLevel(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-line bg-white px-3 text-ink-950"><option value="unknown">不确定</option><option>A1</option><option>A2</option><option>B1</option><option>B2</option></select></label><label className="text-sm text-ink-600">学习目标<select value={goal} onChange={(event) => setGoal(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-line bg-white px-3 text-ink-950">{Object.entries(goalLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className="text-sm text-ink-600">每日时间<select value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} className="mt-2 h-11 w-full rounded-md border border-line bg-white px-3 text-ink-950"><option value={10}>10 分钟</option><option value={20}>20 分钟</option><option value={30}>30 分钟</option></select></label></div><div className="mt-6 flex items-center gap-4"><button type="button" onClick={save} disabled={saving} className="h-11 rounded-md bg-brand-700 px-5 text-sm font-medium text-white disabled:opacity-60">{saving ? "保存中..." : "保存设置"}</button>{message ? <span className="text-sm text-ink-600">{message}</span> : null}</div></section><section className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-line bg-white p-4"><p className="text-xs text-ink-600">界面语言</p><p className="mt-2 font-medium text-ink-950">中文</p></div><div className="rounded-xl border border-line bg-white p-4"><p className="text-xs text-ink-600">AI 功能</p><p className="mt-2 font-medium text-ink-950">暂未开启</p></div><div className="rounded-xl border border-line bg-white p-4"><p className="text-xs text-ink-600">目标方向</p><p className="mt-2 font-medium text-ink-950">{goalLabels[goal]}</p></div></section></div>;
}
