alter table public.university_reimbursements add column if not exists trip_id uuid references public.university_trips(id) on delete set null;
alter table public.university_reimbursements add column if not exists received_date date;
create index if not exists university_reimbursements_trip_idx on public.university_reimbursements(trip_id);

create or replace function public.save_university_trip(p_id uuid,p_trip jsonb,p_toll_id uuid)
returns setof public.university_trips language plpgsql security invoker set search_path = public as $$
declare t public.university_trips; e public.expenses; result_id uuid;
begin
  t := jsonb_populate_record(null::public.university_trips,p_trip);
  if p_toll_id is not null then
    select * into e from public.expenses where id=p_toll_id for update;
    if not found or e.vehicle_id<>t.vehicle_id or not exists(select 1 from public.expense_categories where id=e.category_id and name ~* 'pedagg|telepass|autostrad') then
      raise exception 'Pedaggio non valido';
    end if;
    if e.university_trip_id is not null and e.university_trip_id is distinct from p_id then
      raise exception 'Pedaggio gia collegato' using errcode='23505';
    end if;
  end if;
  if p_id is null then
    insert into public.university_trips(vehicle_id,date,entry_station,exit_station,distance_km,consumption,consumption_unit,fuel_price_cents,liters_ml,fuel_cost_cents,notes)
    values(t.vehicle_id,t.date,t.entry_station,t.exit_station,t.distance_km,t.consumption,t.consumption_unit,t.fuel_price_cents,t.liters_ml,t.fuel_cost_cents,t.notes) returning id into result_id;
  else
    update public.university_trips set date=t.date,entry_station=t.entry_station,exit_station=t.exit_station,distance_km=t.distance_km,consumption=t.consumption,consumption_unit=t.consumption_unit,fuel_price_cents=t.fuel_price_cents,liters_ml=t.liters_ml,fuel_cost_cents=t.fuel_cost_cents,notes=t.notes where id=p_id and vehicle_id=t.vehicle_id returning id into result_id;
    if not found then return; end if;
  end if;
  update public.expenses set university_trip_id=null where university_trip_id=result_id;
  if p_toll_id is not null then update public.expenses set university_trip_id=result_id where id=p_toll_id; end if;
  update public.university_reimbursements set date=t.date where trip_id=result_id;
  return query select * from public.university_trips where id=result_id;
end $$;
revoke all on function public.save_university_trip(uuid,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.save_university_trip(uuid,jsonb,uuid) to service_role;
