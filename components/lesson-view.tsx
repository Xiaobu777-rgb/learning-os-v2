"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LessonDetail } from "@/lib/curriculum";

const typeLabels = { word: "高频词汇", phrase: "实用短语", sentence: "例句", scenario: "场景任务" };

export function LessonView({ lesson }: { lesson: LessonDetail }) {
  const startAt = Math.min(Math.max(lesson.items.findIndex((item) => item.sort_order >= (lesson.status === "in_progress" ? 1 : 0)), 0), Math.max(lesson.items.length - 1, 0));
  const [index, setIndex] = useState(startAt);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const item = lesson.items[index];
  const progress = lesson.items.length ? Math.round((index / lesson.items.length) * 100) : 0;
  const options = useMemo(() => item?.item_type === "scenario" ? [item.answer_en ?? "", "Maybe later", "I am not sure"].filter(Boolean) : [], [item]);

  useEffect(() => { setFinished(false); }, [index]);

  async function saveProgress(nextIndex: number, completed = false) {
    setSaving(true);
    await fetch(`/api/lessons/${lesson.slug}/progress`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ progressPercent: completed ? 100 : Math.round((nextIndex / lesson.items.length) * 100), currentItemOrder: lesson.items[nextIndex]?.sort_order ?? 999, completed }) });
    setSaving(false);
  }

  async function submitFeedback(feedback: "known" | "uncertain" | "unknown") {
    if (saving) return;
    setSaving(true);
    const feedbackRequest = fetch(`/api/lessons/${lesson.slug}/feedback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId: item.id, feedback }) });
    if (index >= lesson.items.length - 1) { await Promise.all([feedbackRequest, saveProgress(lesson.items.length, true)]); setSaving(false); setFinished(true); return; }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    await Promise.all([feedbackRequest, saveProgress(nextIndex)]);
    setSaving(false);
  }

  if (!item) return <div className="rounded-xl border border-line bg-white p-6">这节课还没有内容。</div>;
  if (finished) return <section className="rounded-2xl border border-line bg-white p-6 text-center shadow-soft sm:p-10"><p className="text-sm font-medium text-brand-700">Lesson 完成</p><h1 className="mt-3 text-2xl font-semibold text-ink-950">你完成了：{lesson.title}</h1><p className="mt-3 text-sm leading-6 text-ink-600">下一步可以用练习确认记忆，再把不稳定的内容交给 Review。</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/practice" className="rounded-md bg-brand-700 px-5 py-3 text-sm font-medium text-white">开始练习</Link><Link href="/learning" className="rounded-md border border-line px-5 py-3 text-sm font-medium text-ink-800">返回学习路线</Link></div></section>;

  return <div className="space-y-5"><section><Link href="/learning" className="text-sm font-medium text-brand-700">← 学习路线</Link><div className="mt-5 flex items-end justify-between gap-4"><div><p className="text-sm text-ink-600">{lesson.stage_title} · {lesson.theme_title}</p><h1 className="mt-1 text-2xl font-semibold text-ink-950">{lesson.title}</h1></div><span className="text-sm font-semibold text-brand-700">{Math.min(100, progress)}%</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${Math.min(100, progress)}%` }} /></div></section><section className="rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-8"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">{typeLabels[item.item_type]}</span><span className="text-xs text-ink-600">{index + 1} / {lesson.items.length}</span></div><div className="mt-8"><p className="text-3xl font-semibold tracking-normal text-ink-950 sm:text-4xl">{item.content_en || item.prompt_zh}</p>{item.meaning_zh ? <p className="mt-4 text-lg text-ink-600">{item.meaning_zh}</p> : null}{item.part_of_speech ? <p className="mt-2 text-sm text-ink-600">{item.part_of_speech}</p> : null}</div>{item.example_en ? <div className="mt-8 rounded-xl bg-panel p-4"><p className="text-sm font-medium text-ink-950">{item.example_en}</p>{item.example_zh ? <p className="mt-2 text-sm text-ink-600">{item.example_zh}</p> : null}</div> : null}{item.item_type === "scenario" ? <div className="mt-8"><p className="text-sm font-medium text-ink-950">选择最自然的表达</p><div className="mt-3 grid gap-2">{options.map((option) => <button type="button" key={option} onClick={() => void submitFeedback(option === item.answer_en ? "known" : "unknown")} disabled={saving} className="rounded-lg border border-line px-4 py-3 text-left text-sm text-ink-800 transition hover:border-brand-600 hover:bg-brand-50 disabled:opacity-60">{option}</button>)}</div></div> : <div className="mt-8 grid gap-2 sm:grid-cols-3"><button type="button" onClick={() => void submitFeedback("known")} disabled={saving} className="h-12 rounded-md bg-brand-700 px-3 text-sm font-medium text-white disabled:opacity-60">认识</button><button type="button" onClick={() => void submitFeedback("uncertain")} disabled={saving} className="h-12 rounded-md border border-focus bg-white px-3 text-sm font-medium text-focus disabled:opacity-60">模糊</button><button type="button" onClick={() => void submitFeedback("unknown")} disabled={saving} className="h-12 rounded-md border border-line bg-white px-3 text-sm font-medium text-ink-800 disabled:opacity-60">不认识</button></div>}</section><p className="text-center text-xs text-ink-600">选择后立即进入下一项。系统会记录你的反馈，安排后续 Review。</p></div>;
}
