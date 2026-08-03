# Learning OS MVP

Learning OS is a personal English growth workspace. The MVP closes the loop
from learning to practice, records, review and weakness analysis.

## Local setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create `.env.local` from `.env.example` and add Supabase credentials.

3. Run the migrations in Supabase, in order:

   ```sql
   -- supabase/migrations/001_create_users.sql
   -- supabase/migrations/002_learning_core.sql
   ```

4. Seed the public system dictionary:

   ```sql
   -- supabase/seed/001_system_dictionary.sql
   ```

   The bundled seed contains 2,000 frequency-ranked entries derived from the
   public ECDICT project. It is replaceable and is not tied to a commercial
   dictionary provider.

5. Start the app:

   ```bash
   pnpm dev
   ```

In this Codex workspace, use the bundled Node runtime if your shell does not
have `node` on `PATH`:

```bash
PATH=/Users/suzhenyu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm dev
```

## Current MVP scope

- Next.js App Router project
- Tailwind CSS
- PWA manifest and service worker
- Supabase server connection
- `users`, dictionary, learning, review and weakness migrations
- Simple ID login with automatic account creation
- System dictionary search and filters
- Personal dictionary add, search, category and delete
- Learning flow and spelling practice
- Persistent mastery, learning history and mistake records
- Due review flow and weakness summary
- Dashboard progress, activity and task summary

The app uses a server-side Supabase service-role connection. The service role
key must never be exposed to browser code. Row-level security is enabled for
user-owned tables; server queries always include the current user ID.
