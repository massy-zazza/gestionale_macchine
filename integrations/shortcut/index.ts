const reply=(message:string,status=200,extra:Record<string,unknown>={})=>new Response(JSON.stringify({message,...extra}),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const invalid=(message:string)=>{throw Object.assign(new Error(message),{status:400})};
function text(value:unknown,label:string,required=true){const s=String(value??'').trim();if(s.length>500||required&&!s)invalid('Controlla '+label);return s}
function numeric(value:unknown,label:string,min:number,integer=false){let s=String(value??'').trim().replace(/\s/g,'');if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');else if(integer&&/^\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');const n=Number(s);if(!s||!Number.isFinite(n)||n<min||n>10000000||integer&&!Number.isInteger(n))invalid('Controlla '+label);return n}
async function hash(s:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function db(path:string,method='GET',body?:unknown){const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;const r=await fetch(Deno.env.get('SUPABASE_URL')+'/rest/v1/'+path,{method,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'return=representation'},body:body?JSON.stringify(body):undefined});const result=await r.json();if(!r.ok)throw Object.assign(new Error('Salvataggio non riuscito. Nessuna conferma ricevuta; controlla il registro prima di riprovare.'),{status:502});return result}
Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return reply('Metodo non consentito',405);
  try{
    const token=req.headers.get('X-Garage-Key')||'';
    if(!/^[a-f0-9]{64}$/.test(token))return reply('Accesso non autorizzato',401);
    const tokenHash=await hash(token);
    const keys=await db('garage_shortcut_keys?token_hash=eq.'+tokenHash+'&enabled=eq.true&select=vehicle_id');
    if(keys.length!==1)return reply('Accesso non autorizzato',401);
    const raw=await req.text();if(raw.length>8000)return reply('Richiesta troppo grande',413);
    let b;try{b=JSON.parse(raw)}catch{return reply('Dati non validi',400)}
    if(!b||typeof b!=='object'||Array.isArray(b))return reply('Dati non validi',400);
    if(b.operation==='check')return reply('Collegamento al garage verificato');
    if(!['refuel','maintenance','telepass','expense'].includes(b.type))return reply('Tipo di spesa non valido',400);
    const day=text(b.date,'data');if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day))||new Date(day).toISOString().slice(0,10)!==day)invalid('Data non valida');
    const requestId=text(b.request_id,'identificativo');if(requestId.length<12)invalid('Identificativo non valido');
    const digest=await hash(tokenHash+'|'+b.type+'|'+requestId);
    const id=digest.slice(0,8)+'-'+digest.slice(8,12)+'-4'+digest.slice(13,16)+'-a'+digest.slice(17,20)+'-'+digest.slice(20,32);
    const cents=Math.round(numeric(b.amount,'importo',0.01)*100);
    const base={id,vehicle_id:keys[0].vehicle_id,date:day+'T12:00:00Z',notes:'Inserito tramite Comandi Rapidi Apple.'};
    let table:string,row:Record<string,unknown>;
    if(b.type==='refuel'){
      table='refuels';const ml=Math.round(numeric(b.liters,'litri',0.001)*1000);const price=Math.round(cents*1000000/ml);if(price>2000000000)invalid('Prezzo al litro non valido');
      row={...base,odometer_km:numeric(b.km,'chilometri',0,true),liters_ml:ml,total_cents:cents,price_per_liter_milli_cents:price,station:text(b.station,'distributore',false),fuel_type:'BENZINA',payment_method:text(b.payment,'pagamento'),full_tank:b.full_tank==='Sì'||b.full_tank==='Si'||b.full_tank===true};
    }else if(b.type==='maintenance'){
      table='maintenances';row={...base,odometer_km:numeric(b.km,'chilometri',0,true),description:text(b.description,'descrizione'),type:'Manutenzione',workshop:text(b.workshop,'officina',false),payment_method:text(b.payment,'pagamento'),cost_cents:cents};
    }else{
      table='expenses';const category=b.type==='telepass'?'pedaggio':'altre spese';const categories=await db('expense_categories?name=eq.'+encodeURIComponent(category)+'&select=id');if(categories.length!==1)throw new Error('Categoria mancante');
      row={...base,category_id:categories[0].id,description:b.type==='telepass'?'Telepass':text(b.description,'descrizione'),amount_cents:cents,payment_method:b.type==='telepass'?'Telepass':text(b.payment,'pagamento'),odometer_km:null,supplier:b.type==='telepass'?'Telepass':null};
    }
    // A stable per-run ID prevents a retried network request from recording twice.
    const saved=await db(table+'?on_conflict=id','POST',row).catch(async error=>{const existing=await db(table+'?id=eq.'+id+'&select=id');if(existing.length===1)return existing;throw error});
    if(!saved.length)throw new Error('Salvataggio non confermato');
    const amount=(cents/100).toFixed(2).replace('.',',');
    return reply('Salvato: '+({refuel:'rifornimento',maintenance:'manutenzione',telepass:'Telepass',expense:'spesa'}[b.type as string])+' di '+amount+' EUR del '+day+'.',200,{id});
  }catch(e){const error=e as Error&{status?:number};return reply(error.status?error.message:'Operazione non riuscita. Controlla il registro prima di riprovare.',error.status||500)}
});
