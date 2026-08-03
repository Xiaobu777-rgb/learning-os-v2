-- Learning OS MVP data model for dictionary, training, review and weakness tracking.

alter table public.users
  alter column target_level drop not null,
  alter column target_level drop default;

update public.users
set target_level = null
where target_level = 'IELTS 7.0';

create table if not exists public.system_dictionary (
  id uuid primary key default gen_random_uuid(),
  term text not null,
  normalized_term text not null unique,
  meaning_zh text not null,
  part_of_speech text,
  level text not null default 'A1',
  category text not null default 'General',
  frequency_rank integer,
  source text not null default 'google-10000-english',
  created_at timestamptz not null default now(),
  constraint system_dictionary_term_not_blank check (length(trim(term)) > 0)
);

create index if not exists system_dictionary_term_idx on public.system_dictionary using gin (to_tsvector('simple', term));
create index if not exists system_dictionary_category_idx on public.system_dictionary (category);
create index if not exists system_dictionary_rank_idx on public.system_dictionary (frequency_rank);

create table if not exists public.personal_dictionary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  normalized_content text not null,
  item_type text not null default 'word' check (item_type in ('word', 'phrase', 'sentence')),
  meaning_zh text not null default '',
  category text not null default 'General',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, normalized_content),
  constraint personal_dictionary_content_not_blank check (length(trim(content)) > 0)
);

create index if not exists personal_dictionary_user_idx on public.personal_dictionary (user_id, updated_at desc);

create table if not exists public.user_dictionary_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  system_dictionary_id uuid not null references public.system_dictionary(id) on delete cascade,
  status text not null default 'new' check (status in ('new', 'learning', 'mastered')),
  times_seen integer not null default 0,
  correct_count integer not null default 0,
  incorrect_count integer not null default 0,
  last_studied_at timestamptz,
  next_review_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, system_dictionary_id)
);

create index if not exists user_dictionary_status_due_idx on public.user_dictionary_status (user_id, next_review_at);

create table if not exists public.learning_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  system_dictionary_id uuid references public.system_dictionary(id) on delete set null,
  personal_dictionary_id uuid references public.personal_dictionary(id) on delete set null,
  activity_type text not null check (activity_type in ('learn', 'practice', 'review')),
  result text not null check (result in ('correct', 'incorrect', 'skipped')),
  response text,
  duration_seconds integer,
  created_at timestamptz not null default now(),
  constraint learning_records_one_item check (num_nonnulls(system_dictionary_id, personal_dictionary_id) = 1)
);

create index if not exists learning_records_user_idx on public.learning_records (user_id, created_at desc);

create table if not exists public.mistakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  system_dictionary_id uuid references public.system_dictionary(id) on delete set null,
  personal_dictionary_id uuid references public.personal_dictionary(id) on delete set null,
  prompt text not null,
  user_answer text not null default '',
  correct_answer text not null,
  mistake_type text not null default 'spelling',
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint mistakes_one_item check (num_nonnulls(system_dictionary_id, personal_dictionary_id) <= 1)
);

create index if not exists mistakes_open_idx on public.mistakes (user_id, resolved_at, created_at desc);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  system_dictionary_id uuid not null references public.system_dictionary(id) on delete cascade,
  scheduled_for timestamptz not null default now(),
  reviewed_at timestamptz,
  result text check (result in ('correct', 'incorrect', 'skipped')),
  created_at timestamptz not null default now()
);

create index if not exists reviews_due_idx on public.reviews (user_id, scheduled_for, reviewed_at);

create table if not exists public.weakness_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  dimension text not null,
  score numeric(5, 2) not null default 0,
  evidence_count integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, dimension)
);

create index if not exists weakness_profiles_user_idx on public.weakness_profiles (user_id, score desc);

create or replace function public.touch_learning_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists personal_dictionary_set_updated_at on public.personal_dictionary;
create trigger personal_dictionary_set_updated_at
before update on public.personal_dictionary
for each row execute function public.touch_learning_updated_at();

drop trigger if exists user_dictionary_status_set_updated_at on public.user_dictionary_status;
create trigger user_dictionary_status_set_updated_at
before update on public.user_dictionary_status
for each row execute function public.touch_learning_updated_at();

drop trigger if exists weakness_profiles_set_updated_at on public.weakness_profiles;
create trigger weakness_profiles_set_updated_at
before update on public.weakness_profiles
for each row execute function public.touch_learning_updated_at();

alter table public.system_dictionary enable row level security;
alter table public.personal_dictionary enable row level security;
alter table public.user_dictionary_status enable row level security;
alter table public.learning_records enable row level security;
alter table public.mistakes enable row level security;
alter table public.reviews enable row level security;
alter table public.weakness_profiles enable row level security;
