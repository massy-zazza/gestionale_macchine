insert into public.expense_categories (name, color, is_default, is_fuel) values
('carburante', '#0f766e', true, true),
('manutenzione ordinaria', '#7c3aed', true, false),
('assicurazione', '#2563eb', true, false),
('bollo', '#ea580c', true, false),
('revisione', '#0891b2', true, false),
('pneumatici', '#4d7c0f', true, false),
('lavaggio', '#0284c7', true, false),
('parcheggio', '#9333ea', true, false),
('pedaggio', '#ca8a04', true, false),
('multa', '#dc2626', true, false),
('accessori', '#475569', true, false),
('ricambi', '#a16207', true, false),
('altre spese', '#6b7280', true, false);

with vehicle as (
  insert into public.vehicles (
    make, model, version, plate, year, fuel_type, purchase_date,
    purchase_price_cents, initial_mileage_km, current_mileage_km,
    tank_capacity_liters, notes, is_active
  )
  values (
    'Volkswagen', 'Golf', '1.5 TSI', 'AB123CD', 2021, 'BENZINA',
    current_date - interval '18 months', 2350000, 18500, 26240,
    50, 'Auto demo modificabile.', true
  )
  returning id
),
refuel_rows(days_ago, odometer_km, liters, total, price, full_tank, station) as (
  values
  (210, 18880, 39.4, 72.10, 1.83, true, 'Eni'),
  (175, 19480, 40.1, 72.98, 1.82, true, 'Q8'),
  (140, 20120, 38.9, 69.63, 1.79, true, 'IP'),
  (106, 20730, 36.6, 65.51, 1.79, true, 'Esso'),
  (74, 21320, 28.2, 50.48, 1.79, false, 'Eni'),
  (52, 21950, 40.8, 73.03, 1.79, true, 'Q8'),
  (25, 22590, 39.5, 70.71, 1.79, true, 'IP'),
  (5, 23220, 41.2, 73.75, 1.79, true, 'Eni')
),
inserted_refuels as (
  insert into public.refuels (
    vehicle_id, date, odometer_km, liters_ml, total_cents,
    price_per_liter_milli_cents, fuel_type, station, location,
    full_tank, payment_method
  )
  select
    vehicle.id,
    now() - (refuel_rows.days_ago || ' days')::interval,
    refuel_rows.odometer_km,
    round(refuel_rows.liters * 1000)::integer,
    round(refuel_rows.total * 100)::integer,
    round(refuel_rows.price * 100000)::integer,
    'BENZINA', refuel_rows.station, 'Modena',
    refuel_rows.full_tank, 'CARTA'
  from vehicle, refuel_rows
  returning vehicle_id, date, odometer_km
)
insert into public.mileage_records (vehicle_id, date, odometer_km, source)
select vehicle_id, date, odometer_km, 'RIFORNIMENTO' from inserted_refuels;

with vehicle as (select id from public.vehicles where is_active = true limit 1),
expense_rows(days_ago, category_name, description, amount, supplier) as (
  values
  (200, 'assicurazione', 'Premio RC auto', 486.30, 'Unipol'),
  (185, 'bollo', 'Bollo annuale', 214.58, 'ACI'),
  (160, 'lavaggio', 'Lavaggio completo', 18.00, 'Autolavaggio'),
  (150, 'pedaggio', 'Autostrada A1', 23.40, 'Telepass'),
  (132, 'parcheggio', 'Parcheggio centro', 7.50, 'EasyPark'),
  (118, 'accessori', 'Supporto telefono', 19.90, 'Amazon'),
  (96, 'pedaggio', 'Autostrada A22', 31.20, 'Telepass'),
  (80, 'pneumatici', 'Convergenza', 45.00, 'Gommista Rossi'),
  (63, 'lavaggio', 'Lavaggio rapido', 10.00, 'Autolavaggio'),
  (49, 'parcheggio', 'Aeroporto', 54.00, 'Parcheggio BLQ'),
  (38, 'ricambi', 'Spazzole tergicristallo', 27.80, 'Autoricambi'),
  (30, 'pedaggio', 'Tangenziale', 8.10, 'Telepass'),
  (21, 'multa', 'Sosta', 29.40, 'Comune'),
  (14, 'accessori', 'Liquido vetri', 6.50, 'Bricocenter'),
  (3, 'lavaggio', 'Lavaggio interno', 24.00, 'Detailing')
)
insert into public.expenses (vehicle_id, category_id, date, description, amount_cents, supplier)
select vehicle.id, category.id, now() - (expense_rows.days_ago || ' days')::interval,
expense_rows.description, round(expense_rows.amount * 100)::integer, expense_rows.supplier
from vehicle
join expense_rows on true
join public.expense_categories category on category.name = expense_rows.category_name;

with vehicle as (select id from public.vehicles where is_active = true limit 1),
maintenance_rows(days_ago, odometer_km, type, description, workshop, cost) as (
  values
  (190, 19020, 'tagliando', 'Tagliando annuale', 'Officina Verdi', 245.00),
  (155, 19840, 'filtro abitacolo', 'Sostituzione filtro abitacolo', 'Officina Verdi', 42.00),
  (120, 20520, 'pneumatici', 'Inversione pneumatici', 'Gommista Rossi', 35.00),
  (70, 21480, 'pastiglie freni', 'Controllo impianto frenante', 'Officina Verdi', 88.00),
  (18, 22780, 'batteria', 'Test batteria e ricarica', 'Elettrauto', 30.00)
),
inserted_maintenances as (
  insert into public.maintenances (vehicle_id, date, odometer_km, type, description, workshop, cost_cents, next_due_date, next_due_mileage_km)
  select vehicle.id, now() - (maintenance_rows.days_ago || ' days')::interval,
  maintenance_rows.odometer_km, maintenance_rows.type, maintenance_rows.description,
  maintenance_rows.workshop, round(maintenance_rows.cost * 100)::integer,
  (current_date - maintenance_rows.days_ago) + 365,
  maintenance_rows.odometer_km + 15000
  from vehicle, maintenance_rows
  returning vehicle_id, date, odometer_km
)
insert into public.mileage_records (vehicle_id, date, odometer_km, source)
select vehicle_id, date, odometer_km, 'MANUTENZIONE' from inserted_maintenances;

with vehicle as (select id from public.vehicles where is_active = true limit 1)
insert into public.reminders (vehicle_id, title, due_date, due_mileage_km, periodicity, expected_cents, status)
select vehicle.id, title, current_date + due_days, due_km, periodicity, expected_cents,
case when due_days <= 30 then 'PROSSIMA' else 'FUTURA' end
from vehicle,
(values
  ('Assicurazione', 45, null::integer, 'ANNUALE', 52000),
  ('Bollo', 80, null::integer, 'ANNUALE', 22000),
  ('Revisione', 120, null::integer, 'BIENNALE', 7900),
  ('Tagliando', 25, 34000, 'ANNUALE', 26000),
  ('Cambio olio', 12, 30000, 'ANNUALE', 11000)
) as rows(title, due_days, due_km, periodicity, expected_cents);
