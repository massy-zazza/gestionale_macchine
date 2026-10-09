import {test} from 'node:test';
import assert from 'node:assert/strict';
import {payload} from '../dist/server/index.js';
const vehicle_id='11111111-1111-4111-8111-111111111111';
const trip={vehicle_id,date:'2026-10-04',entry_station:'Mantova Nord',exit_station:'Padova Ovest',distance_km:150,consumption:6,consumption_unit:'l100km',fuel_price_cents:185};
test('trip cost uses the selected unit and ignores supplied totals',()=>{
  const r=payload('university_trips',{...trip,liters_ml:1,fuel_cost_cents:1});
  assert.equal(r.liters_ml,9000);assert.equal(r.fuel_cost_cents,1665);
  const km=payload('university_trips',{...trip,consumption:20,consumption_unit:'kml'});
  assert.equal(km.liters_ml,7500);assert.equal(km.fuel_cost_cents,1388);
});
test('invalid trips and reimbursements cannot be saved',()=>{
  for(const v of [{distance_km:0},{consumption:0},{fuel_price_cents:0},{consumption_unit:'unknown'},{date:'2026-02-30'}])assert.throws(()=>payload('university_trips',{...trip,...v}));
  assert.throws(()=>payload('university_reimbursements',{vehicle_id,date:'2026-10-04',amount_cents:-1}));
  assert.equal(payload('university_reimbursements',{vehicle_id,date:'2026-10-04',amount_cents:2100}).amount_cents,2100);
});
