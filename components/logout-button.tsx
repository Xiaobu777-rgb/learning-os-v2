"use client";

export function LogoutButton() {
  async function logout() {
    await fetch("/api/logout", { method: "POST", redirect: "follow" });
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="h-9 rounded-md border border-line bg-white px-3 text-sm font-medium text-ink-800 transition hover:border-brand-600 hover:text-brand-700"
    >
      退出
    </button>
  );
}
