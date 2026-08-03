import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { UserRow } from "@/lib/types";

const USER_ID_COOKIE = "learning_os_user_id";
const USER_HANDLE_COOKIE = "learning_os_user_handle";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function getSessionUserId() {
  const store = await cookies();
  return store.get(USER_ID_COOKIE)?.value ?? null;
}

export async function getSessionUserHandle() {
  const store = await cookies();
  return store.get(USER_HANDLE_COOKIE)?.value ?? null;
}

export function setSessionCookies(response: NextResponse, user: Pick<UserRow, "id" | "handle">) {
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set(USER_ID_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: COOKIE_MAX_AGE
  });

  response.cookies.set(USER_HANDLE_COOKIE, user.handle, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: COOKIE_MAX_AGE
  });
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.set(USER_ID_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });

  response.cookies.set(USER_HANDLE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}
