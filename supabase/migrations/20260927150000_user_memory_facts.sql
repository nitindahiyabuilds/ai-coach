-- Personal memory facts storage
-- Stores semantic facts learned about a user over time.

-- ============================================================
-- Personal memory facts
-- ============================================================

create table public.personal_memory_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fact text not null,
  category text not null,
  source text not null,
  evidence text not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  supersedes_id uuid references public.personal_memory_facts(id)
    on delete set null,

  constraint personal_memory_facts_category_check
    check (
      category in (
        'preference',
        'constraint',
        'goal',
        'context'
      )
    ),

  constraint personal_memory_facts_source_check
    check (
      source in (
        'user',
        'system_observation',
        'inference'
      )
    ),

  constraint personal_memory_facts_evidence_check
    check (
      evidence in (
        'confirmed',
        'observed',
        'inferred',
        'unknown',
        'contradictory'
      )
    ),

  constraint personal_memory_facts_status_check
    check (
      status in (
        'active',
        'superseded',
        'invalidated',
        'contradictory'
      )
    ),

  constraint personal_memory_facts_not_self_superseding_check
    check (supersedes_id is null or supersedes_id <> id)
);

-- ============================================================
-- Updated timestamp
-- ============================================================

create or replace function public.set_personal_memory_facts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger personal_memory_facts_updated_at_trigger
before update on public.personal_memory_facts
for each row
execute function public.set_personal_memory_facts_updated_at();

-- ============================================================
-- Indexes
-- ============================================================

create index personal_memory_facts_user_id_idx
  on public.personal_memory_facts (user_id);

create index personal_memory_facts_user_status_idx
  on public.personal_memory_facts (user_id, status);

create index personal_memory_facts_user_category_status_idx
  on public.personal_memory_facts (user_id, category, status);

create index personal_memory_facts_supersedes_id_idx
  on public.personal_memory_facts (supersedes_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.personal_memory_facts enable row level security;

-- ============================================================
-- Personal memory fact policies
-- ============================================================

create policy "Users can view their own personal memory facts"
  on public.personal_memory_facts
  for select
  to public
  using (auth.uid() = user_id);

create policy "Users can insert their own personal memory facts"
  on public.personal_memory_facts
  for insert
  to public
  with check (auth.uid() = user_id);

create policy "Users can update their own personal memory facts"
  on public.personal_memory_facts
  for update
  to public
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own personal memory facts"
  on public.personal_memory_facts
  for delete
  to public
  using (auth.uid() = user_id);
