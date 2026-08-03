"use client";

import { useCallback, useEffect, useState } from "react";
import type { LearningCard } from "@/lib/learning";

export function LearningWorkspace({ mode = "learn" }: { mode?: "learn" | "practice" | "review" }) {
  const [card, setCard] = useState<LearningCard | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCard = useCallback(async () => {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/learning/next?mode=${mode}`);
    const body = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) { setError(body.error ?? "暂时无法读取训练内容"); return; }
    setCard(body.card);
    setAnswer("");
    setFeedback("");
  }, [mode]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadCard(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCard]);

  async function submit(result: "correct" | "incorrect") {
    if (!card) return;
    setLoading(true);
    const response = await fetch("/api/learning/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dictionaryId: card.id, activityType: mode, result, response: answer })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setLoading(false); setError(body.error ?? "保存训练结果失败"); return; }
    if (mode === "practice" || mode === "review") setFeedback(result === "correct" ? "回答正确" : `正确答案：${card.term}`);
    else setFeedback(result === "correct" ? "已记录为掌握" : "已加入后续练习");
    window.setTimeout(() => { void loadCard(); }, 650);
  }

  return <div className="space-y-5">
    <section className="border-b border-line pb-5"><p className="text-sm font-medium text-brand-700">{mode === "practice" ? "Practice" : mode === "review" ? "Review" : "Learning"}</p><h1 className="mt-2 text-2xl font-semibold text-ink-950">{mode === "practice" ? "Spelling Practice" : mode === "review" ? "Review Due Words" : "Learn New Words"}</h1><p className="mt-2 text-sm leading-6 text-ink-600">{mode === "practice" ? "根据中文解释拼写英文，结果会自动记录到你的学习历史。" : mode === "review" ? "集中复习需要再次巩固的内容，结果会更新下一次复习时间。" : "按频率逐步学习系统词库，并记录每个词的掌握状态。"}</p></section>
    {error && <p className="rounded-md border border-[#efc3bc] bg-[#fff5f3] px-3 py-2 text-sm text-[#9c3f31]">{error}</p>}
    <section className="mx-auto w-full max-w-2xl rounded-lg border border-line bg-white p-6 shadow-soft sm:p-10">
      {loading && !card ? <div className="py-16 text-center text-sm text-ink-600">正在准备内容...</div> : !card ? <div className="py-16 text-center"><p className="text-lg font-medium text-ink-950">暂时没有可学习内容</p><p className="mt-2 text-sm text-ink-600">请先完成数据库迁移并导入系统词库。</p></div> : <>
        <div className="flex items-start justify-between gap-4"><span className="rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">{card.level}</span><span className="text-xs text-ink-600">已练 {card.times_seen} 次</span></div>
        <div className="py-14 text-center">{mode === "practice" || mode === "review" ? <><p className="text-sm text-ink-600">中文解释</p><p className="mt-4 text-2xl font-semibold leading-9 text-ink-950">{card.meaning_zh}</p><input value={answer} onChange={(event) => setAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && answer.trim()) void submit(answer.trim().toLowerCase() === card.term.toLowerCase() ? "correct" : "incorrect"); }} autoFocus className="mx-auto mt-8 h-12 w-full max-w-sm rounded-md border border-line px-4 text-center text-lg outline-none focus:border-brand-600" placeholder="输入英文" /></> : <><p className="text-4xl font-semibold text-ink-950">{card.term}</p><p className="mt-5 text-lg text-ink-800">{card.meaning_zh}</p><p className="mt-3 text-xs text-ink-600">{card.category} · {card.part_of_speech ?? "English"}</p></>}</div>
        {feedback && <p className="mb-4 text-center text-sm font-medium text-brand-700">{feedback}</p>}
        <div className="grid gap-3 sm:grid-cols-2">{mode === "practice" || mode === "review" ? <button type="button" disabled={!answer.trim() || loading} onClick={() => void submit(answer.trim().toLowerCase() === card.term.toLowerCase() ? "correct" : "incorrect")} className="h-11 rounded-md bg-brand-700 text-sm font-medium text-white disabled:opacity-50 sm:col-span-2">提交答案</button> : <><button type="button" disabled={loading} onClick={() => void submit("incorrect")} className="h-11 rounded-md border border-line text-sm font-medium text-ink-800 disabled:opacity-50">需要练习</button><button type="button" disabled={loading} onClick={() => void submit("correct")} className="h-11 rounded-md bg-brand-700 text-sm font-medium text-white disabled:opacity-50">记住了</button></>}</div>
      </>}
    </section>
  </div>;
}
