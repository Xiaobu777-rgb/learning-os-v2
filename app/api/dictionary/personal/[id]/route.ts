import { NextRequest, NextResponse } from "next/server";
import { deletePersonalDictionaryItem, updatePersonalDictionaryItem } from "@/lib/dictionary";
import { getSessionUserId } from "@/lib/session";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const result = await updatePersonalDictionaryItem(userId, id, {
    content: body?.content,
    item_type: body?.itemType,
    meaning_zh: body?.meaningZh,
    category: body?.category,
    notes: body?.notes
  });
  return NextResponse.json(result.ok ? result.data : { error: result.error }, { status: result.ok ? 200 : result.status });
}

export async function DELETE(_request: NextRequest, context: Context) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { id } = await context.params;
  const result = await deletePersonalDictionaryItem(userId, id);
  return NextResponse.json(result.ok ? { ok: true } : { error: result.error }, { status: result.ok ? 200 : result.status });
}
