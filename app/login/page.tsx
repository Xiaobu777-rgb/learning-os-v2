import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getSessionUserId } from "@/lib/session";
import { getCurrentUser } from "@/lib/users";

export default async function LoginPage() {
  const userId = await getSessionUserId();
  if (userId) {
    const user = await getCurrentUser(userId);
    redirect(user?.onboarding_completed ? "/dashboard" : "/onboarding");
  }

  return (
    <main className="min-h-dvh bg-panel px-5 py-8 sm:px-6">
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-8">
          <p className="text-sm font-medium text-brand-700">Learning OS</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-ink-950">
            进入你的英语成长工作台
          </h1>
          <p className="mt-4 text-base leading-7 text-ink-600">
            输入一个简单 ID。不存在时系统会自动创建账号，存在时会直接登录。
          </p>
        </div>

        <LoginForm />
      </section>
    </main>
  );
}
