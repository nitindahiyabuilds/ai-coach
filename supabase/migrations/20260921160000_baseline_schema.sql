-- AI Coach database baseline
-- Represents the current public schema and RLS configuration.

create extension if not exists pgcrypto;

-- ============================================================
-- Profiles
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  age integer,
  sex text,
  height_cm integer,
  weight_kg numeric,
  activity_level text,
  goal text,
  training_experience text,
  equipment text,
  dietary_preference text,
  region text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- Coach messages
-- ============================================================

create table public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default now(),

  constraint coach_messages_role_check
    check (role in ('user', 'assistant'))
);

create index coach_messages_user_created_at_idx
  on public.coach_messages (user_id, created_at);

-- ============================================================
-- Workout sessions
-- ============================================================

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index workout_sessions_user_date_idx
  on public.workout_sessions (user_id, date desc);

create index workout_sessions_user_id_idx
  on public.workout_sessions (user_id);

-- ============================================================
-- Workout sets
-- ============================================================

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null
    references public.workout_sessions(id)
    on delete cascade,
  exercise_name text not null,
  exercise_order integer not null,
  set_number integer not null,
  weight numeric not null,
  reps integer not null,
  felt text,
  created_at timestamptz not null default now(),

  constraint workout_sets_exercise_order_check
    check (exercise_order >= 1),

  constraint workout_sets_felt_check
    check (
      felt is null
      or felt in ('easy', 'moderate', 'hard')
    ),

  constraint workout_sets_reps_check
    check (reps > 0),

  constraint workout_sets_set_number_check
    check (set_number >= 1),

  constraint workout_sets_weight_check
    check (weight >= 0)
);

create index workout_sets_exercise_idx
  on public.workout_sets (exercise_name);

create index workout_sets_session_id_idx
  on public.workout_sets (session_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.coach_messages enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;

-- ============================================================
-- Profiles policies
-- ============================================================

create policy "Users can view their own profile"
  on public.profiles
  for select
  to public
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to public
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  to public
  using (auth.uid() = id);

-- ============================================================
-- Coach message policies
-- ============================================================

create policy "Users can view their own coach messages"
  on public.coach_messages
  for select
  to public
  using (auth.uid() = user_id);

create policy "Users can insert their own coach messages"
  on public.coach_messages
  for insert
  to public
  with check (auth.uid() = user_id);

create policy "Users can delete their own coach messages"
  on public.coach_messages
  for delete
  to public
  using (auth.uid() = user_id);

-- ============================================================
-- Workout session policies
-- ============================================================

create policy "Users can view their own workout sessions"
  on public.workout_sessions
  for select
  to public
  using (auth.uid() = user_id);

create policy "Users can insert their own workout sessions"
  on public.workout_sessions
  for insert
  to public
  with check (auth.uid() = user_id);

create policy "Users can update their own workout sessions"
  on public.workout_sessions
  for update
  to public
  using (auth.uid() = user_id);

create policy "Users can delete their own workout sessions"
  on public.workout_sessions
  for delete
  to public
  using (auth.uid() = user_id);

-- ============================================================
-- Workout set policies
-- ============================================================

create policy "Users can view their own workout sets"
  on public.workout_sets
  for select
  to public
  using (
    exists (
      select 1
      from public.workout_sessions
      where workout_sessions.id = workout_sets.session_id
        and workout_sessions.user_id = auth.uid()
    )
  );

create policy "Users can insert their own workout sets"
  on public.workout_sets
  for insert
  to public
  with check (
    exists (
      select 1
      from public.workout_sessions
      where workout_sessions.id = workout_sets.session_id
        and workout_sessions.user_id = auth.uid()
    )
  );

create policy "Users can update their own workout sets"
  on public.workout_sets
  for update
  to public
  using (
    exists (
      select 1
      from public.workout_sessions
      where workout_sessions.id = workout_sets.session_id
        and workout_sessions.user_id = auth.uid()
    )
  );

create policy "Users can delete their own workout sets"
  on public.workout_sets
  for delete
  to public
  using (
    exists (
      select 1
      from public.workout_sessions
      where workout_sessions.id = workout_sets.session_id
        and workout_sessions.user_id = auth.uid()
    )
  );