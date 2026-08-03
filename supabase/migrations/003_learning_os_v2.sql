-- Learning OS V2 curriculum, onboarding and daily plan layer.

alter table public.users
  add column if not exists goal_type text,
  add column if not exists daily_minutes integer not null default 20,
  add column if not exists onboarding_completed boolean not null default false;

alter table public.user_dictionary_status
  add column if not exists feedback_state text not null default 'new' check (feedback_state in ('new', 'known', 'uncertain', 'unknown')),
  add column if not exists known_streak integer not null default 0,
  add column if not exists reinforcement_count integer not null default 0;

create index if not exists user_dictionary_feedback_idx on public.user_dictionary_status (user_id, feedback_state, next_review_at);

create table if not exists public.learning_stages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.learning_themes (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.learning_stages(id) on delete cascade,
  code text not null unique,
  title text not null,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references public.learning_themes(id) on delete cascade,
  slug text not null unique,
  title text not null,
  objective text not null default '',
  estimated_minutes integer not null default 5,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_items (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  item_type text not null check (item_type in ('word', 'phrase', 'sentence', 'scenario')),
  content_en text not null,
  meaning_zh text not null default '',
  part_of_speech text,
  level text not null default 'A1',
  example_en text,
  example_zh text,
  prompt_zh text,
  answer_en text,
  system_dictionary_id uuid references public.system_dictionary(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (lesson_id, sort_order)
);

create index if not exists learning_themes_stage_idx on public.learning_themes (stage_id, sort_order);
create index if not exists lessons_theme_idx on public.lessons (theme_id, sort_order);
create index if not exists lesson_items_lesson_idx on public.lesson_items (lesson_id, sort_order);
create index if not exists lesson_items_dictionary_idx on public.lesson_items (system_dictionary_id);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  current_item_order integer not null default 0,
  progress_percent integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index if not exists lesson_progress_user_idx on public.lesson_progress (user_id, updated_at desc);

create table if not exists public.lesson_item_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  lesson_item_id uuid not null references public.lesson_items(id) on delete cascade,
  feedback_state text not null default 'new' check (feedback_state in ('new', 'known', 'uncertain', 'unknown')),
  seen_count integer not null default 0,
  known_streak integer not null default 0,
  reinforcement_count integer not null default 0,
  next_review_at timestamptz,
  last_feedback_at timestamptz,
  unique (user_id, lesson_item_id)
);

create index if not exists lesson_item_feedback_due_idx on public.lesson_item_feedback (user_id, next_review_at);

create table if not exists public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_date date not null,
  target_minutes integer not null default 20,
  completed_minutes integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, plan_date)
);

create table if not exists public.daily_plan_items (
  id uuid primary key default gen_random_uuid(),
  daily_plan_id uuid not null references public.daily_plans(id) on delete cascade,
  task_type text not null check (task_type in ('lesson', 'vocabulary', 'phrases', 'review', 'practice', 'weakness')),
  title text not null,
  description text not null default '',
  target_minutes integer not null default 5,
  route text not null,
  sort_order integer not null default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  unique (daily_plan_id, sort_order)
);

create index if not exists daily_plans_user_date_idx on public.daily_plans (user_id, plan_date desc);
create index if not exists daily_plan_items_plan_idx on public.daily_plan_items (daily_plan_id, sort_order);

alter table public.learning_stages enable row level security;
alter table public.learning_themes enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_items enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.lesson_item_feedback enable row level security;
alter table public.daily_plans enable row level security;
alter table public.daily_plan_items enable row level security;
