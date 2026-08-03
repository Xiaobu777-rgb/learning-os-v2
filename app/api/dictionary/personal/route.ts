import { NextRequest, NextResponse } from "next/server";
import { createPersonalDictionaryItem, getPersonalDictionary } from "@/lib/dictionary";
import { getSessionUserId } from "@/lib/session";

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const result = await getPersonalDictionary(userId, {
    query: request.nextUrl.searchParams.get("query") ?? "",
    category: request.nextUrl.searchParams.get("category") ?? "all"
  });
  return NextResponse.json(result.ok ? { entries: result.data } : { error: result.error }, { status: result.ok ? 200 : result.status });
}

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const result = await createPersonalDictionaryItem({
    userId,
    content: String(body?.content ?? ""),
    itemType: body?.itemType === "phrase" || body?.itemType === "sentence" ? body.itemType : "word",
    meaningZh: String(body?.meaningZh ?? ""),
    category: String(body?.category ?? "General"),
    notes: String(body?.notes ?? "")
  });
  return NextResponse.json(result.ok ? result.data : { error: result.error }, { status: result.ok ? 201 : result.status });
}
