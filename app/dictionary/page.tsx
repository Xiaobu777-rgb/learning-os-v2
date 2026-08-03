import { AppShell } from "@/components/app-shell";
import { DictionaryWorkspace } from "@/components/dictionary-workspace";
import { getSessionUserId } from "@/lib/session";
import { getCurrentUser } from "@/lib/users";
import { getPersonalDictionary, searchSystemDictionary } from "@/lib/dictionary";
import { redirect } from "next/navigation";

export default async function DictionaryPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const user = await getCurrentUser(userId);
  const [system, personal] = await Promise.all([
    searchSystemDictionary({ limit: 40 }),
    getPersonalDictionary(userId)
  ]);

  return (
    <AppShell userHandle={user?.handle ?? "当前用户"} activeNav="My English">
      <DictionaryWorkspace
        initialSystemEntries={system.ok ? system.data.entries : []}
        initialPersonalEntries={personal.ok ? personal.data : []}
        categories={system.ok ? system.data.categories : []}
        initialError={!system.ok ? system.error : !personal.ok ? personal.error : null}
      />
    </AppShell>
  );
}
