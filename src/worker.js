const tables=['vehicles','expense_categories','refuels','expenses','maintenances','reminders','payment_methods'];
const writable=tables.filter(t=>t!=='expense_categories');
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
function bad(message){throw Object.assign(new Error(message),{status:400})}
function str(v,label,required=false){const s=String(v??'').trim();if(s.length>2000||required&&!s)bad('Controlla '+label);return s}
function number(v,label,min=0,integer=false,max=2000000000){const n=Number(v);if(v===''||v==null||!Number.isFinite(n)||n<min||n>max||integer&&!Number.isInteger(n))bad('Controlla '+label);return n}
function date(v){const s=String(v??'');if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)bad('Data non valida');return s}
export function payload(table,b){
  if(!b||typeof b!=='object'||Array.isArray(b))bad('Dati non validi');
  if(table==='payment_methods'){const name=str(b.name,'nome carta',true);if(name.length>80)bad('Nome carta troppo lungo');return{name}}
  if(table==='vehicles')return{make:str(b.make,'marca',true),model:str(b.model,'modello',true),plate:str(b.plate,'targa'),year:number(b.year,'anno',1900,true,2100),fuel_type:str(b.fuel_type,'carburante',true),initial_mileage_km:number(b.initial_mileage_km,'chilometri iniziali',0,true),notes:str(b.notes,'note')};
  if(!uuid.test(b.vehicle_id))bad('Auto non valida');
  const common={vehicle_id:b.vehicle_id,notes:str(b.notes,'note')};
  if(table==='reminders')return{...common,title:str(b.title,'titolo',true),due_date:date(b.due_date),due_mileage_km:b.due_mileage_km===''||b.due_mileage_km==null?null:number(b.due_mileage_km,'chilometri scadenza',0,true),status:b.status==='COMPLETATA'?'COMPLETATA':'FUTURA',periodicity:['NESSUNA','MENSILE','ANNUALE','BIENNALE'].includes(b.periodicity)?b.periodicity:'NESSUNA'};
  const km=number(b.odometer_km,'chilometri',0,true);
  const result={...common,date:date(b.date)+'T12:00:00Z',odometer_km:km,payment_method:str(b.payment_method,'pagamento',true)};
  if(table==='refuels'){
    const liters_ml=number(b.liters_ml,'litri',1,true,1000000),total_cents=number(b.total_cents,'importo',1,true,100000000);
    const price=Math.round(total_cents*1000000/liters_ml);if(price>2000000000)bad('Prezzo al litro non valido');
    return{...result,liters_ml,total_cents,price_per_liter_milli_cents:price,station:str(b.station,'distributore'),location:str(b.location,'localita'),full_tank:b.full_tank===true,fuel_type:'BENZINA'};
  }
  if(table==='expenses'){if(!uuid.test(b.category_id))bad('Categoria non valida');return{...result,category_id:b.category_id,description:str(b.description,'descrizione',true),amount_cents:number(b.amount_cents,'importo',1,true),supplier:str(b.supplier,'fornitore')}}
  if(table==='maintenances')return{...result,type:str(b.type,'tipo',true),description:str(b.description,'descrizione',true),cost_cents:number(b.cost_cents,'importo',0,true),workshop:str(b.workshop,'officina')};
  bad('Operazione non valida');
}
async function db(env,path,method='GET',body){
  const response=await fetch(env.SUPABASE_URL+'/rest/v1/'+path,{method,headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json',Prefer:'return=representation'},body:body?JSON.stringify(body):undefined});
  if(!response.ok){console.error('Database request failed',response.status);throw Object.assign(new Error(response.status===409?'La voce esiste gia o e utilizzata.':'Operazione non riuscita. Riprova tra poco.'),{status:response.status===409?409:502})}
  return response.status===204?[]:response.json();
}
async function allRows(env,table){const rows=[];for(let offset=0;;offset+=1000){const batch=await db(env,table+'?select=*&order=id&limit=1000&offset='+offset);rows.push(...batch);if(batch.length<1000)return rows}}
export default{async fetch(request,env){
  const url=new URL(request.url);
  if(!request.headers.get('oai-authenticated-user-id'))return json({error:'Accedi al tuo account per aprire il garage.'},401);
  try{
    if(url.pathname==='/api/data'&&request.method==='GET'){
      if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY)return json({error:'Collegamento al database non configurato.'},503);
      const results=await Promise.all(tables.map(t=>allRows(env,t)));return json(Object.fromEntries(tables.map((t,i)=>[t,results[i]])));
    }
    if(url.pathname.startsWith('/api/')){
      if(request.headers.get('Origin')!==url.origin)return json({error:'Richiesta non consentita.'},403);
      const [,api,table,id]=url.pathname.split('/');
      if(!writable.includes(table)||id&&!uuid.test(id))return json({error:'Voce non valida.'},400);
      if(request.method==='DELETE'){
        if(!id||table==='vehicles')return json({error:'Operazione non consentita.'},400);
        const rows=await db(env,table+'?id=eq.'+id,'DELETE');return rows.length?json({ok:true}):json({error:'Voce non trovata.'},404);
      }
      if(!['POST','PATCH'].includes(request.method)||request.method==='PATCH'&&!id||request.method==='POST'&&id)return json({error:'Operazione non consentita.'},405);
      if(table==='vehicles'&&request.method!=='PATCH')return json({error:'Auto non modificabile.'},400);
      const text=await request.text();if(text.length>16000)return json({error:'Dati troppo lunghi.'},413);
      const body=payload(table,JSON.parse(text));
      const rows=await db(env,table+(id?'?id=eq.'+id:''),request.method,body);
      return rows.length?json(rows[0]):json({error:'Voce non trovata.'},404);
    }
    if(request.method!=='GET')return json({error:'Operazione non consentita.'},405);
    if(!(url.pathname in assets))return new Response('Non trovato',{status:404});
    return new Response(assets[url.pathname],{headers:{'Content-Type':url.pathname==='/'?'text/html; charset=utf-8':'text/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'}});
  }catch(e){return json({error:e.status?e.message:'Operazione non riuscita. Riprova.'},e.status||500)}
}};
