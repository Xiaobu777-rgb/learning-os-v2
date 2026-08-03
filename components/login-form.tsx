"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ handle })
      });

      const payload = (await response.json()) as {
        error?: string;
        created?: boolean;
        user?: { onboarding_completed?: boolean };
      };

      if (!response.ok) {
        setError(payload.error ?? "登录失败，请稍后再试");
        return;
      }

      router.push(
        payload.created || payload.user?.onboarding_completed === false
          ? "/onboarding"
          : "/dashboard"
      );
      router.refresh();
    } catch {
      setError("无法连接服务，请检查网络或环境配置");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-line bg-white p-5 shadow-soft"
    >
      <label htmlFor="handle" className="text-sm font-medium text-ink-800">
        用户 ID
      </label>
      <input
        id="handle"
        name="handle"
        value={handle}
        onChange={(event) => setHandle(event.target.value)}
        autoComplete="username"
        inputMode="text"
        placeholder="例如：bubu"
        className="mt-2 h-12 w-full rounded-md border border-line bg-white px-3 text-base outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-50"
      />
      <p className="mt-2 text-xs leading-5 text-ink-600">
        可使用小写字母、数字、下划线或短横线。
      </p>

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 h-12 w-full rounded-md bg-brand-700 px-4 text-base font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-65"
      >
        {isSubmitting ? "正在进入..." : "进入工作台"}
      </button>
    </form>
  );
}
