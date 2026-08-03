import { NextRequest, NextResponse } from "next/server";
import { searchSystemDictionary } from "@/lib/dictionary";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const result = await searchSystemDictionary({
    query: params.get("query") ?? "",
    category: params.get("category") ?? "all",
    level: params.get("level") ?? "all",
    limit: Number(params.get("limit") ?? 40)
  });
  return NextResponse.json(result.ok ? result.data : { error: result.error }, { status: result.ok ? 200 : result.status });
}
