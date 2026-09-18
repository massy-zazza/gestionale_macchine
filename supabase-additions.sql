-- Additive changes only. Existing records are preserved.
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check(length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now()
);
alter table public.payment_methods enable row level security;
revoke all on public.payment_methods from anon, authenticated;
grant all on public.payment_methods to service_role;
alter table public.maintenances add column if not exists payment_method text not null default 'CARTA';
