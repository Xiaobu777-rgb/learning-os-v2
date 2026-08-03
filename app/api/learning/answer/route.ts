import { NextRequest, NextResponse } from "next/server";
import { recordLearningFeedback, recordTrainingResult } from "@/lib/learning";
import { getSessionUserId } from "@/lib/session";

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const activityType = body?.activityType === "practice" || body?.activityType === "review" ? body.activityType : "learn";
  const feedback = body?.feedback === "known" || body?.feedback === "uncertain" || body?.feedback === "unknown" ? body.feedback : null;
  const result = body?.result === "correct" || body?.result === "incorrect" || body?.result === "skipped" ? body.result : null;
  if (!body?.dictionaryId || (!feedback && !result)) return NextResponse.json({ error: "训练结果不完整" }, { status: 400 });
  const response = feedback
    ? await recordLearningFeedback({ userId, dictionaryId: String(body.dictionaryId), activityType, feedback, response: String(body.response ?? "") })
    : await recordTrainingResult({ userId, dictionaryId: String(body.dictionaryId), activityType, result, response: String(body.response ?? "") });
  return NextResponse.json(response.ok ? response.data : { error: response.error }, { status: response.ok ? 200 : response.status });
}
