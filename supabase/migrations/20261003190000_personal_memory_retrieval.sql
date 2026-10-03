create or replace function public.match_personal_memory_facts(
  query_embedding vector(384),
  match_count integer default 5,
  match_threshold double precision default 0.7
)
returns table (
  id uuid,
  user_id uuid,
  fact text,
  category text,
  source text,
  evidence text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  supersedes_id uuid,
  similarity double precision
)
language sql
stable
as $$
  select
    pmf.id,
    pmf.user_id,
    pmf.fact,
    pmf.category,
    pmf.source,
    pmf.evidence,
    pmf.status,
    pmf.created_at,
    pmf.updated_at,
    pmf.supersedes_id,
    1 - (pmf.embedding <=> query_embedding) as similarity
  from public.personal_memory_facts pmf
  where pmf.user_id = auth.uid()
    and pmf.status = 'active'
    and pmf.embedding is not null
    and 1 - (pmf.embedding <=> query_embedding) >= match_threshold
  order by pmf.embedding <=> query_embedding
  limit least(greatest(match_count, 1), 20);
$$;