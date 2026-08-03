create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  handle text not null unique,
  display_name text not null,
  current_level text not null default 'A1',
  target_level text,
  learning_phase text not null default 'Foundation',
  study_preference jsonb not null default '{}'::jsonb,
  ui_language text not null default 'zh-CN' check (ui_language in ('zh-CN', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_handle_format check (handle ~ '^[a-z0-9_-]{2,32}$')
);

create index if not exists users_handle_idx on public.users (handle);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;

create trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();
