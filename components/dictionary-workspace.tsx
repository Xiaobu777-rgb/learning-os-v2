"use client";

import { FormEvent, useMemo, useState } from "react";
import type { PersonalDictionaryEntry, SystemDictionaryEntry } from "@/lib/dictionary";

type Props = {
  initialSystemEntries: SystemDictionaryEntry[];
  initialPersonalEntries: PersonalDictionaryEntry[];
  categories: string[];
  initialError: string | null;
};

export function DictionaryWorkspace({ initialSystemEntries, initialPersonalEntries, categories: initialCategories, initialError }: Props) {
  const [tab, setTab] = useState<"system" | "personal">("system");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [systemEntries, setSystemEntries] = useState(initialSystemEntries);
  const [personalEntries, setPersonalEntries] = useState(initialPersonalEntries);
  const [categories, setCategories] = useState(initialCategories);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [message, setMessage] = useState("");

  const visiblePersonalCategories = useMemo(() => Array.from(new Set(["General", ...personalEntries.map((entry) => entry.category)])), [personalEntries]);

  async function search() {
    setLoading(true);
    setError(null);
    const endpoint = tab === "system"
      ? `/api/dictionary/system?query=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`
      : `/api/dictionary/personal?query=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`;
    const response = await fetch(endpoint);
    const body = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(body.error ?? "查询失败");
      return;
    }
    if (tab === "system") {
      setSystemEntries(body.entries);
      setCategories(body.categories ?? categories);
    } else {
      setPersonalEntries(body.entries);
    }
  }

  function switchTab(nextTab: "system" | "personal") {
    setTab(nextTab);
    setQuery("");
    setCategory("all");
    setError(null);
  }

  async function addPersonal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/dictionary/personal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: form.get("content"),
        itemType: form.get("itemType"),
        meaningZh: form.get("meaningZh"),
        category: form.get("category"),
        notes: form.get("notes")
      })
    });
    const body = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(body.error ?? "添加失败");
      return;
    }
    if (body.duplicate) {
      setError(`Already Exists：${body.duplicateTerm}`);
      return;
    }
    setPersonalEntries((entries) => [body.item, ...entries]);
    setShowForm(false);
    setMessage("已添加到个人词库");
    event.currentTarget.reset();
  }

  async function removePersonal(id: string) {
    if (!window.confirm("确认删除这条个人词条吗？")) return;
    const response = await fetch(`/api/dictionary/personal/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "删除失败");
      return;
    }
    setPersonalEntries((entries) => entries.filter((entry) => entry.id !== id));
    setMessage("已删除");
  }

  const activeCategories = tab === "system" ? categories : visiblePersonalCategories;
  const entries = tab === "system" ? systemEntries : personalEntries;

  return (
    <div className="space-y-5">
      <section className="border-b border-line pb-5">
        <p className="text-sm font-medium text-brand-700">My English</p>
        <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-semibold text-ink-950">Dictionary</h1>
            <p className="mt-2 text-sm leading-6 text-ink-600">把遇到的词、短语和句子沉淀到自己的英语数据库。</p>
          </div>
          {tab === "personal" && <button type="button" onClick={() => setShowForm((value) => !value)} className="h-10 rounded-md bg-brand-700 px-4 text-sm font-medium text-white hover:bg-brand-600">{showForm ? "关闭添加" : "添加词条"}</button>}
        </div>
      </section>

      <div className="flex gap-1 border-b border-line">
        <button type="button" onClick={() => switchTab("system")} className={`border-b-2 px-3 py-3 text-sm font-medium ${tab === "system" ? "border-brand-700 text-brand-700" : "border-transparent text-ink-600"}`}>系统词库</button>
        <button type="button" onClick={() => switchTab("personal")} className={`border-b-2 px-3 py-3 text-sm font-medium ${tab === "personal" ? "border-brand-700 text-brand-700" : "border-transparent text-ink-600"}`}>个人词库</button>
      </div>

      {showForm && <form onSubmit={addPersonal} className="grid gap-3 rounded-lg border border-line bg-white p-4 sm:grid-cols-2">
        <label className="text-sm text-ink-800">内容<input name="content" required className="mt-1 h-10 w-full rounded-md border border-line px-3 outline-none focus:border-brand-600" placeholder="例如: take a break" /></label>
        <label className="text-sm text-ink-800">类型<select name="itemType" defaultValue="word" className="mt-1 h-10 w-full rounded-md border border-line bg-white px-3"><option value="word">单词</option><option value="phrase">短语</option><option value="sentence">句子</option></select></label>
        <label className="text-sm text-ink-800">中文解释<input name="meaningZh" required className="mt-1 h-10 w-full rounded-md border border-line px-3 outline-none focus:border-brand-600" placeholder="例如: 休息一下" /></label>
        <label className="text-sm text-ink-800">分类<input name="category" defaultValue="General" className="mt-1 h-10 w-full rounded-md border border-line px-3 outline-none focus:border-brand-600" /></label>
        <label className="text-sm text-ink-800 sm:col-span-2">备注<textarea name="notes" rows={2} className="mt-1 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-brand-600" /></label>
        <button type="submit" disabled={loading} className="h-10 rounded-md bg-ink-950 px-4 text-sm font-medium text-white disabled:opacity-50 sm:w-fit">{loading ? "保存中..." : "保存词条"}</button>
      </form>}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <form onSubmit={(event) => { event.preventDefault(); void search(); }} className="flex min-w-0 flex-1 gap-2">
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 min-w-0 flex-1 rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand-600" placeholder="搜索英文或中文解释" />
            <button type="submit" className="h-10 rounded-md border border-line bg-white px-4 text-sm font-medium text-ink-800 hover:border-brand-600">{loading ? "查询中" : "搜索"}</button>
          </form>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink-800"><option value="all">全部分类</option>{activeCategories.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        </div>
        {error && <p className="rounded-md border border-[#efc3bc] bg-[#fff5f3] px-3 py-2 text-sm text-[#9c3f31]">{error}</p>}
        {message && <p className="rounded-md border border-[#c8e5d7] bg-[#f1fbf5] px-3 py-2 text-sm text-[#28734d]">{message}</p>}
        <div className="overflow-hidden rounded-lg border border-line bg-white">
          <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_100px_100px] gap-4 border-b border-line bg-panel px-4 py-3 text-xs font-medium uppercase tracking-[0.08em] text-ink-600 sm:grid"><span>Term</span><span>Meaning</span><span>Level</span><span>Category</span></div>
          {entries.length === 0 ? <div className="p-8 text-center text-sm text-ink-600">{initialError ? "数据库尚未连接" : "暂无匹配内容"}</div> : <div className="divide-y divide-line">{tab === "system" ? systemEntries.map((entry) => <SystemRow key={entry.id} entry={entry} />) : personalEntries.map((entry) => <PersonalRow key={entry.id} entry={entry} onDelete={removePersonal} />)}</div>}
        </div>
        {tab === "system" && <p className="text-xs text-ink-600">系统词库只读。词库来源：ECDICT 公开数据，内容可在后续版本替换或扩展。</p>}
      </section>
    </div>
  );
}

function SystemRow({ entry }: { entry: SystemDictionaryEntry }) {
  return <div className="grid gap-2 px-4 py-4 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_100px_100px] sm:gap-4"><div><p className="font-medium text-ink-950">{entry.term}</p><p className="mt-1 text-xs text-ink-600">{entry.part_of_speech ?? "English"}</p></div><p className="text-sm leading-6 text-ink-800">{entry.meaning_zh}</p><span className="text-xs text-ink-600">{entry.level}</span><span className="text-xs text-ink-600">{entry.category}</span></div>;
}

function PersonalRow({ entry, onDelete }: { entry: PersonalDictionaryEntry; onDelete: (id: string) => void }) {
  return <div className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_100px_70px] sm:gap-4"><div><p className="font-medium text-ink-950">{entry.content}</p><p className="mt-1 text-xs text-ink-600">{entry.item_type}</p></div><div><p className="text-sm leading-6 text-ink-800">{entry.meaning_zh}</p>{entry.notes && <p className="mt-1 text-xs text-ink-600">{entry.notes}</p>}</div><span className="text-xs text-ink-600">{entry.category}</span><button type="button" onClick={() => onDelete(entry.id)} className="text-left text-xs text-[#9c3f31] hover:underline sm:text-right">删除</button></div>;
}
