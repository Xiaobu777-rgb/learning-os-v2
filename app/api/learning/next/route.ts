import { NextRequest, NextResponse } from "next/server";
import { getNextLearningCard } from "@/lib/learning";
import { getSessionUserId } from "@/lib/session";

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const mode = request.nextUrl.searchParams.get("mode");
  const result = await getNextLearningCard(userId, mode === "practice" || mode === "review" ? mode : "learn");
  return NextResponse.json(result.ok ? { card: result.data } : { error: result.error }, { status: result.ok ? 200 : result.status });
}
