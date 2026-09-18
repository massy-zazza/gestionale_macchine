import fs from 'node:fs';
import assert from 'node:assert/strict';
const key=fs.readFileSync('output/shortcuts/garage-key.txt','utf8').trim();
const url='https://sdnaklfwknantaubfeys.supabase.co/functions/v1/garage-shortcut';
const ids=[];
try {
  for(const [type,extra,table] of [
    ['refuel',{liters:'40',km:'103.000',station:'CODEX QA',payment:'Contanti',full_tank:'No'},'refuels'],
    ['maintenance',{km:'103000',description:'CODEX QA',workshop:'Test',payment:'Contanti'},'maintenances'],
    ['expense',{description:'CODEX QA',payment:'Contanti'},'expenses'],
    ['telepass',{},'expenses']]) {
    const body={type,request_id:'codex-shortcut-qa-20260918-'+type,date:'2026-09-18',amount:'72,00',...extra};
    const send=()=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json','X-Garage-Key':key},body:JSON.stringify(body)});
    const r=await send(),value=await r.json();assert.equal(r.status,200,JSON.stringify(value));assert.ok(value.id);
    ids.push({table,id:value.id});
    fs.writeFileSync('output/shortcuts/qa-records.json',JSON.stringify(ids));
    const retry=await send(),retried=await retry.json();assert.equal(retry.status,200);assert.equal(retried.id,value.id);
    console.log(type+': save and idempotent retry passed');
  }
}finally{console.log(JSON.stringify({cleanup:ids}));}
