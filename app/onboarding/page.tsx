import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding-form";
import { getSessionUserId } from "@/lib/session";
import { getCurrentUser } from "@/lib/users";

export default async function OnboardingPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const user = await getCurrentUser(userId);
  if (user?.onboarding_completed) redirect("/dashboard");

  return (
    <main className="min-h-dvh bg-panel px-5 py-8 sm:px-6">
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-lg flex-col justify-center">
        <div className="mb-8">
          <p className="text-sm font-semibold text-brand-700">Learning OS</p>
          <h1 className="mt-3 text-3xl font-semibold text-ink-950">先告诉我你的学习方向</h1>
          <p className="mt-3 text-sm leading-6 text-ink-600">用不到一分钟设置你的起点，今天的学习计划会据此生成。</p>
        </div>
        <OnboardingForm initialLevel={user?.current_level} initialGoal={user?.goal_type} initialMinutes={user?.daily_minutes} />
      </section>
    </main>
  );
}
