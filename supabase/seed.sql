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
('altre spese', '#6b7280', true, false)
on conflict (name) do update set
  color = excluded.color,
  is_default = excluded.is_default,
  is_fuel = excluded.is_fuel;

insert into public.vehicles (
  make,
  model,
  version,
  plate,
  year,
  fuel_type,
  purchase_date,
  purchase_price_cents,
  initial_mileage_km,
  current_mileage_km,
  tank_capacity_liters,
  notes,
  is_active
) values (
  'BMW',
  '116i',
  null,
  null,
  2015,
  'BENZINA',
  null,
  null,
  0,
  0,
  null,
  null,
  true
);
