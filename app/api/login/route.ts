import { NextResponse } from "next/server";
import { createOrFindUser } from "@/lib/users";
import { setSessionCookies } from "@/lib/session";

type LoginBody = {
  handle?: unknown;
};

function normalizeHandle(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
}

export async function POST(request: Request) {
  let body: LoginBody;

  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "请求格式不正确" }, { status: 400 });
  }

  const handle = normalizeHandle(body.handle);

  if (!/^[a-z0-9_-]{2,32}$/.test(handle)) {
    return NextResponse.json(
      { error: "ID 只能包含 2-32 位小写字母、数字、下划线或短横线" },
      { status: 400 }
    );
  }

  const result = await createOrFindUser(handle);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const response = NextResponse.json({
    user: result.user,
    created: result.created
  });

  setSessionCookies(response, result.user);

  return response;
}
