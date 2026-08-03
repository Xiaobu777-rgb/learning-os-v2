import Link from "next/link";
import { ReactNode } from "react";
import { LogoutButton } from "@/components/logout-button";

const desktopNav = [
  ["Home", "/dashboard"],
  ["Learning Path", "/learning"],
  ["Practice", "/practice"],
  ["Review", "/review"],
  ["My English", "/profile"],
  ["Weakness", "/weakness"],
  ["Profile", "/profile"]
] as const;
const mobileNav = [["Home", "/dashboard"], ["学习", "/learning"], ["练习", "/practice"], ["复习", "/review"], ["我的", "/profile"]] as const;

export function AppShell({
  children,
  userHandle,
  activeNav = "Dashboard"
}: {
  children: ReactNode;
  userHandle: string;
  activeNav?: string;
}) {
  return (
    <div className="min-h-dvh bg-panel text-ink-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white px-4 py-5 lg:block">
        <div>
          <p className="text-sm font-semibold text-brand-700">Learning OS</p>
          <p className="mt-1 text-xs text-ink-600">个人英语成长工作台</p>
        </div>

        <nav className="mt-8 space-y-1">
          {desktopNav.map(([item, href]) => (
            <Link
              href={href}
              key={item}
              className={`block rounded-md px-3 py-2 text-sm ${
                item === activeNav ||
                (activeNav === "Dashboard" && item === "Home") ||
                (activeNav === "学习" && item === "Learning Path") ||
                (activeNav === "练习" && item === "Practice") ||
                (activeNav === "复习" && item === "Review") ||
                (activeNav === "我的" && item === "Profile")
                  ? "bg-brand-50 font-medium text-brand-700"
                  : "text-ink-600"
              }`}
            >{item}</Link>
          ))}
        </nav>

        <div className="absolute bottom-5 left-4 right-4 rounded-lg border border-line bg-panel p-3">
          <p className="text-xs text-ink-600">当前用户</p>
          <p className="mt-1 text-sm font-medium text-ink-950">{userHandle}</p>
          <div className="mt-3">
            <LogoutButton />
          </div>
        </div>
      </aside>

      <main className="mx-auto min-h-dvh max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:ml-64 lg:px-8 lg:pb-8">
        <header className="mb-5 flex items-center justify-between lg:hidden">
          <div>
            <p className="text-sm font-semibold text-brand-700">Learning OS</p>
            <p className="text-xs text-ink-600">{userHandle}</p>
          </div>
          <LogoutButton />
        </header>
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 grid grid-cols-5 border-t border-line bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur lg:hidden">
        {mobileNav.map(([item, href]) => (
          <Link
            href={href}
            key={item}
            className={`flex h-12 items-center justify-center rounded-md text-xs ${
              (activeNav === "Dashboard" && item === "Home") ||
              activeNav === item ||
              (activeNav === "Profile" && item === "我的") ||
              (activeNav === "Weakness" && item === "我的")
                ? "bg-brand-50 font-medium text-brand-700"
                : "text-ink-600"
            }`}
          >{item}</Link>
        ))}
      </nav>
    </div>
  );
}
