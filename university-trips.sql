create table if not exists public.university_trips (
 id uuid primary key default gen_random_uuid(),
 vehicle_id uuid not null references public.vehicles(id),
 date date not null,
 entry_station text not null,
 exit_station text not null,
 distance_km numeric not null check(distance_km > 0),
 consumption numeric not null check(consumption > 0),
 consumption_unit text not null check(consumption_unit in ('l100km','kml')),
 fuel_price_cents numeric not null check(fuel_price_cents > 0),
 liters_ml integer not null check(liters_ml > 0),
 fuel_cost_cents integer not null check(fuel_cost_cents >= 0),
 notes text not null default '',
 created_at timestamptz not null default now()
);
create table if not exists public.university_reimbursements (
 id uuid primary key default gen_random_uuid(),
 vehicle_id uuid not null references public.vehicles(id),
 date date not null,
 amount_cents integer not null check(amount_cents > 0),
 notes text not null default '',
 created_at timestamptz not null default now()
);
alter table public.expenses add column if not exists university_trip_id uuid references public.university_trips(id) on delete set null;
alter table public.university_trips enable row level security;
alter table public.university_reimbursements enable row level security;
revoke all on public.university_trips,public.university_reimbursements from anon,authenticated;
grant all on public.university_trips,public.university_reimbursements to service_role;
create index if not exists university_trips_vehicle_date on public.university_trips(vehicle_id,date);
create index if not exists university_reimbursements_vehicle_date on public.university_reimbursements(vehicle_id,date);
create index if not exists expenses_university_trip on public.expenses(university_trip_id);
