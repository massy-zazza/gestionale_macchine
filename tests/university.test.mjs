import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker,{payload} from '../dist/server/index.js';
const vehicle_id='11111111-1111-4111-8111-111111111111';
const trip={vehicle_id,date:'2026-10-04',entry_station:'Mantova Nord',exit_station:'Padova Ovest',distance_km:150,consumption:6,consumption_unit:'l100km',fuel_price_cents:185};
test('trip cost uses the selected unit and ignores supplied totals',()=>{
  const r=payload('university_trips',{...trip,liters_ml:1,fuel_cost_cents:1});
  assert.equal(r.liters_ml,9000);assert.equal(r.fuel_cost_cents,1665);
  const km=payload('university_trips',{...trip,consumption:20,consumption_unit:'kml'});
  assert.equal(km.liters_ml,7500);assert.equal(km.fuel_cost_cents,1388);
});
test('refund uses the selected trip date and validates vehicle ownership',async()=>{
  const original=globalThis.fetch;let saved;
  const request=()=>new Request('https://garage.example/api/university_reimbursements',{method:'POST',headers:{'oai-authenticated-user-id':'owner',Origin:'https://garage.example'},body:JSON.stringify({vehicle_id,trip_id:vehicle_id,date:'2026-10-10',received_date:'2026-11-01',amount_cents:2100})});
  const env={SUPABASE_URL:'https://database.example',SUPABASE_SERVICE_ROLE_KEY:'test'};
  try{
    globalThis.fetch=async(url,options)=>{if(options.method==='GET'){assert.ok(url.includes('vehicle_id=eq.'+vehicle_id));return Response.json([{date:'2026-10-04'}])}saved=JSON.parse(options.body);return Response.json([saved])};
    assert.equal((await worker.fetch(request(),env)).status,200);
    assert.equal(saved.date,'2026-10-04');assert.equal(saved.received_date,'2026-11-01');
    globalThis.fetch=async()=>Response.json([]);
    assert.equal((await worker.fetch(request(),env)).status,400);
  }finally{globalThis.fetch=original}
});
test('invalid trips and reimbursements cannot be saved',()=>{
  for(const v of [{distance_km:0},{consumption:0},{fuel_price_cents:0},{consumption_unit:'unknown'},{date:'2026-02-30'}])assert.throws(()=>payload('university_trips',{...trip,...v}));
  assert.throws(()=>payload('university_reimbursements',{vehicle_id,date:'2026-10-04',amount_cents:-1}));
  assert.throws(()=>payload('university_reimbursements',{vehicle_id,date:'2026-10-04',amount_cents:2100}));
  const refund=payload('university_reimbursements',{vehicle_id,date:'2026-10-04',received_date:'2026-11-01',trip_id:vehicle_id,amount_cents:2100});
  assert.equal(refund.amount_cents,2100);assert.equal(refund.received_date,'2026-11-01');assert.equal(refund.trip_id,vehicle_id);
  assert.equal(payload('university_trips',{...trip,entry_station:'',exit_station:''}).entry_station,'');
});
