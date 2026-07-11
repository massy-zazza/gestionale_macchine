create extension if not exists pgcrypto;

drop table if exists public.mileage_records cascade;
drop table if exists public.refuels cascade;
drop table if exists public.expenses cascade;
drop table if exists public.maintenances cascade;
drop table if exists public.reminders cascade;
drop table if exists public.expense_categories cascade;
drop table if exists public.vehicles cascade;

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  make text not null,
  model text not null,
  version text,
  plate text,
  year integer,
  fuel_type text not null default 'BENZINA',
  purchase_date date,
  purchase_price_cents integer,
  initial_mileage_km integer not null default 0,
  current_mileage_km integer not null default 0,
  tank_capacity_liters numeric(8,2),
  notes text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#64748b',
  is_default boolean not null default false,
  is_fuel boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.refuels (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  date timestamptz not null,
  odometer_km integer not null,
  liters_ml integer not null,
  total_cents integer not null,
  price_per_liter_milli_cents integer not null,
  fuel_type text not null default 'BENZINA',
  station text,
  location text,
  full_tank boolean not null default true,
  payment_method text not null default 'CARTA',
  notes text,
  created_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  category_id uuid not null references public.expense_categories(id),
  date timestamptz not null,
  description text not null,
  amount_cents integer not null,
  payment_method text not null default 'CARTA',
  odometer_km integer,
  supplier text,
  notes text,
  is_recurring boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.maintenances (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  date timestamptz not null,
  odometer_km integer not null,
  type text not null,
  description text not null,
  workshop text,
  cost_cents integer not null default 0,
  replaced_parts text,
  next_due_date date,
  next_due_mileage_km integer,
  notes text,
  created_at timestamptz not null default now()
);

create table public.mileage_records (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  date timestamptz not null,
  odometer_km integer not null,
  source text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  title text not null,
  due_date date not null,
  due_mileage_km integer,
  periodicity text not null default 'NESSUNA',
  expected_cents integer,
  status text not null default 'FUTURA',
  notes text,
  created_at timestamptz not null default now()
);

create index refuels_vehicle_date_idx on public.refuels(vehicle_id, date);
create index expenses_vehicle_date_idx on public.expenses(vehicle_id, date);
create index maintenances_vehicle_date_idx on public.maintenances(vehicle_id, date);
create index mileage_vehicle_date_idx on public.mileage_records(vehicle_id, date);
create index reminders_due_date_idx on public.reminders(due_date);

alter table public.vehicles enable row level security;
alter table public.expense_categories enable row level security;
alter table public.refuels enable row level security;
alter table public.expenses enable row level security;
alter table public.maintenances enable row level security;
alter table public.mileage_records enable row level security;
alter table public.reminders enable row level security;

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
