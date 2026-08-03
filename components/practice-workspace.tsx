"use client";

import { useCallback, useEffect, useState } from "react";
import type { LearningCard } from "@/lib/learning";

type PracticeMode = "en2cn" | "cn2en" | "spelling" | "usage" | "review";
const modes: Array<[PracticeMode, string]> = [["en2cn", "英 → 中"], ["cn2en", "中 → 英"], ["spelling", "拼写"], ["usage", "例句理解"], ["review", "Review"]];

export function PracticeWorkspace({ initialMode = "cn2en" }: { initialMode?: PracticeMode }) {
  const [mode, setMode] = useState<PracticeMode>(initialMode);
  const [card, setCard] = useState<LearningCard | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState<"answer" | "feedback">("answer");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const loadCard = useCallback(async (nextMode = mode) => {
    setLoading(true); setError(""); setPhase("answer"); setFeedback(""); setAnswer("");
    const response = await fetch(`/api/learning/next?mode=${nextMode === "review" ? "review" : "practice"}`);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setError(body.error ?? "暂时无法读取练习内容");
    setCard(body.card ?? null); setLoading(false);
  }, [mode]);

  useEffect(() => { void loadCard(mode); }, [loadCard, mode]);

  function isCorrect() {
    if (!answer.trim() || !card) return false;
    if (mode === "en2cn" || mode === "usage") return true;
    return answer.trim().toLocaleLowerCase() === card.term.toLocaleLowerCase();
  }

  async function submit() {
    if (!card || !answer.trim() || submitting || phase === "feedback") return;
    const correct = isCorrect();
    setSubmitting(true); setError("");
    const response = await fetch("/api/learning/answer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dictionaryId: card.id, activityType: mode === "review" ? "review" : "practice", feedback: correct ? "known" : "unknown", response: answer }) });
    const body = await response.json().catch(() => ({}));
    setSubmitting(false);
    if (!response.ok) { setError(body.error ?? "保存练习结果失败"); return; }
    setFeedback(correct ? "回答正确，已记录为认识" : `再看一眼：${card.term}`);
    setPhase("feedback");
  }

  return <div className="space-y-5"><section><p className="text-sm font-medium text-brand-700">Practice</p><h1 className="mt-2 text-2xl font-semibold text-ink-950">用一次小练习确认掌握</h1><p className="mt-2 text-sm leading-6 text-ink-600">先回答，再看反馈。每一次选择都会影响后续 Review。</p></section><div className="flex gap-2 overflow-x-auto pb-1">{modes.map(([value, label]) => <button type="button" key={value} onClick={() => setMode(value)} className={`shrink-0 rounded-full border px-4 py-2 text-sm ${mode === value ? "border-brand-600 bg-brand-50 font-medium text-brand-700" : "border-line bg-white text-ink-600"}`}>{label}</button>)}</div>{error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}<section className="mx-auto w-full max-w-2xl rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-10">{loading ? <div className="py-16 text-center text-sm text-ink-600">正在准备下一题...</div> : !card ? <div className="py-16 text-center"><p className="text-lg font-medium text-ink-950">当前没有可练习内容</p><p className="mt-2 text-sm text-ink-600">先完成一节 Lesson，系统会把内容加入练习队列。</p></div> : <><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">{mode === "review" ? "到期复习" : modes.find(([value]) => value === mode)?.[1]}</span><span className="text-xs text-ink-600">已出现 {card.times_seen} 次</span></div><div className="py-14 text-center">{mode === "cn2en" || mode === "spelling" || mode === "review" ? <><p className="text-sm text-ink-600">中文提示</p><p className="mt-4 text-2xl font-semibold leading-9 text-ink-950">{card.meaning_zh}</p><input value={answer} onChange={(event) => setAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void submit(); }} autoFocus className="mx-auto mt-8 h-12 w-full max-w-sm rounded-md border border-line px-4 text-center text-lg outline-none focus:border-brand-600" placeholder="输入英文" /> </> : <><p className="text-sm text-ink-600">英文内容</p><p className="mt-4 text-4xl font-semibold text-ink-950">{card.term}</p><p className="mt-5 text-lg text-ink-600">{card.meaning_zh}</p><input value={answer} onChange={(event) => setAnswer(event.target.value)} className="mx-auto mt-8 h-12 w-full max-w-sm rounded-md border border-line px-4 text-center text-base outline-none focus:border-brand-600" placeholder="用中文说出意思" /></>}</div>{phase === "feedback" ? <div className="rounded-lg bg-brand-50 p-4 text-center"><p className="font-medium text-brand-700">{feedback}</p><button type="button" onClick={() => void loadCard()} className="mt-3 text-sm font-medium text-brand-700">下一题 →</button></div> : <button type="button" onClick={() => void submit()} disabled={!answer.trim() || submitting} className="h-12 w-full rounded-md bg-brand-700 px-4 text-sm font-medium text-white disabled:opacity-50">{submitting ? "正在保存..." : "Check 答案"}</button>}</>}</section><p className="text-center text-xs text-ink-600">操作会立即反馈，保存完成后可以马上进入下一题。</p></div>;
}
