let universityMonth=new Date().toLocaleDateString('en-CA').slice(0,7);
pages.splice(2,0,['Viaggi universitari','road']);
const garageRender=render;
render=function(page){garageRender(page);if(page==='Viaggi universitari'&&data)renderUniversity()};
const garageOpenEntry=openEntry;
openEntry=function(table,id=null){
  garageOpenEntry(table,id);
  if(table!=='expenses')return;
  const row=id?data.expenses.find(r=>r.id===id):{};
  document.querySelector('#fields input[name="odometer_km"]').required=false;
  const options=[['','Non collegato'],...records('university_trips').slice().sort((a,b)=>b.date.localeCompare(a.date)).map(t=>[t.id,tripLabel(t)])];
  document.querySelector('#fields').insertAdjacentHTML('beforeend',select('university_trip_id','Viaggio universitario (pedaggi)',options,row?.university_trip_id||''));
};
function tripLabel(t){return new Date(t.date+'T12:00:00').toLocaleDateString('it-IT')+' · '+(t.entry_station&&t.exit_station?t.entry_station+' → '+t.exit_station:'Viaggio universitario')+' · '+decimal(t.distance_km)+' km'}
function tripTolls(){
  const categories=data.expense_categories.filter(c=>/pedagg|telepass|autostrad/i.test(c.name)).map(c=>c.id);
  return records('expenses').filter(e=>categories.includes(e.category_id)).map(e=>({...e,trip_id:e.university_trip_id||null}));
}
function priorFuelPrice(day){const r=records('refuels').filter(r=>r.date.slice(0,10)<=day).sort((a,b)=>b.date.localeCompare(a.date)||b.odometer_km-a.odometer_km)[0];return r?r.total_cents*1000/r.liters_ml:null}
function universityTotals(month){
  const trips=records('university_trips').filter(t=>t.date.startsWith(month)),ids=new Set(trips.map(t=>t.id));
  const fuel=trips.reduce((s,t)=>s+t.fuel_cost_cents,0),toll=tripTolls().filter(e=>ids.has(e.trip_id)).reduce((s,e)=>s+e.amount_cents,0);
  const refunds=records('university_reimbursements').filter(r=>r.date.startsWith(month)).reduce((s,r)=>s+r.amount_cents,0);
  return {fuel,toll,refunds,total:fuel+toll,net:fuel+toll-refunds};
}
function universityChart(){
  const end=new Date(universityMonth+'-01T12:00:00');const months=Array.from({length:6},(_,i)=>new Date(end.getFullYear(),end.getMonth()-5+i,1));
  const totals=months.map(d=>universityTotals(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'))),max=Math.max(1,...totals.flatMap(t=>[t.total,t.refunds]));
  return '<div class="muted" style="font-size:13px">Spese viaggi · blu &nbsp; Rimborsi · verde</div><div class="bars">'+months.map((d,i)=>`<div class="bar-wrap"><span class="bar-value">${money(totals[i].total)} / ${money(totals[i].refunds)}</span><div style="height:140px;display:flex;align-items:end;gap:4px;width:75%"><div class="bar" title="Spese ${money(totals[i].total)}" style="width:50%;height:${totals[i].total/max*140}px"></div><div class="bar" title="Rimborsi ${money(totals[i].refunds)}" style="background:#2b865c;width:50%;height:${totals[i].refunds/max*140}px"></div></div><small>${d.toLocaleDateString('it-IT',{month:'short',year:'2-digit'})}</small></div>`).join('')+'</div>';
}
function universityActions(table,id){return `<div class="record-actions"><button class="icon-button" title="Modifica" onclick="openUniversity('${table}','${id}')">${icon('edit')}</button><button class="icon-button danger" title="Elimina" onclick="removeEntry('${table}','${id}')">${icon('trash')}</button></div>`}
function renderUniversity(){
  const sums=universityTotals(universityMonth),tolls=tripTolls(),trips=records('university_trips').filter(t=>t.date.startsWith(universityMonth)).sort((a,b)=>b.date.localeCompare(a.date));
  const refunds=records('university_reimbursements').filter(r=>r.date.startsWith(universityMonth)).sort((a,b)=>b.date.localeCompare(a.date));
  document.querySelector('#content').innerHTML=pageHeading('Viaggi universitari','Mantova, Padova e i costi dei tuoi viaggi.',`<button class="primary" onclick="openUniversity('university_trips')">${icon('plus')} Aggiungi viaggio</button>`)+
    `<div class="toolbar"><label>Mese <input type="month" value="${universityMonth}" onchange="if(this.value){universityMonth=this.value;renderUniversity()}"></label><button class="secondary" onclick="openUniversity('university_reimbursements')">${icon('plus')} Aggiungi rimborso</button></div>`+
    `<div class="stats">${[['Benzina utilizzata',sums.fuel],['Pedaggi collegati',sums.toll],['Rimborsi',sums.refunds],['Costo a tuo carico',sums.net]].map(([label,n])=>`<div class="stat"><div class="stat-label">${label}</div><strong>${money(n)}</strong><small>${label==='Costo a tuo carico'?'Spese '+money(sums.total)+' meno rimborsi':'Viaggi del mese selezionato'}</small></div>`).join('')}</div>`+
    universityChart()+`<div class="section-title"><h2>Viaggi</h2></div>`+(trips.length?trips.map(t=>{const linked=tolls.filter(e=>e.trip_id===t.id),toll=linked.reduce((s,e)=>s+e.amount_cents,0);return `<article class="record"><div><div class="record-title">${esc(t.entry_station&&t.exit_station?t.entry_station+' → '+t.exit_station:'Viaggio universitario')}</div><div class="record-meta">${new Date(t.date+'T12:00:00').toLocaleDateString('it-IT')} · ${decimal(t.distance_km)} km · ${decimal(t.consumption)} ${t.consumption_unit==='kml'?'km/l':'l/100 km'}<br>${decimal(t.liters_ml/1000,3)} L · Benzina ${money(t.fuel_cost_cents)} · Pedaggi ${linked.length?money(toll):'da collegare'}</div></div><span class="amount">${money(t.fuel_cost_cents+toll)}</span>${universityActions('university_trips',t.id)}</article>`}).join(''):empty('Nessun viaggio in questo mese',''))+
    `<div class="section-title divider"><h2>Rimborsi</h2></div>`+(refunds.length?refunds.map(r=>`<article class="record"><div><div class="record-title">${esc(records('university_trips').find(t=>t.id===r.trip_id)?tripLabel(records('university_trips').find(t=>t.id===r.trip_id)):'Rimborso da collegare')}</div><div class="record-meta">Viaggio ${new Date(r.date+'T12:00:00').toLocaleDateString('it-IT')}${r.received_date?' · Ricevuto '+new Date(r.received_date+'T12:00:00').toLocaleDateString('it-IT'):''} · ${esc(r.notes)}</div></div><span class="amount">${money(r.amount_cents)}</span>${universityActions('university_reimbursements',r.id)}</article>`).join(''):empty('Nessun rimborso in questo mese',''))+
    (tolls.some(e=>!e.trip_id&&e.date.startsWith(universityMonth))?`<div class="section-title divider"><h2>Pedaggi da abbinare</h2></div>`+tolls.filter(e=>!e.trip_id&&e.date.startsWith(universityMonth)).map(e=>`<article class="record"><div>${esc(e.description)}<div class="record-meta">${e.date.slice(0,10)}</div></div><span>${money(e.amount_cents)}</span><button class="secondary" onclick="openEntry('expenses','${e.id}')">Abbina</button></article>`).join(''):'');
}
function openUniversity(table,id=null){
  const trip=table==='university_trips',row=id?data[table].find(r=>r.id===id):{},day=row.date||today(),price=row.fuel_price_cents??priorFuelPrice(day);
  const trips=records('university_trips').slice().sort((a,b)=>b.date.localeCompare(a.date));
  if(!trip&&!trips.length){notify('Aggiungi prima il viaggio da rimborsare');return}
  const tolls=tripTolls().filter(e=>!e.trip_id||e.trip_id===id).sort((a,b)=>b.date.localeCompare(a.date));
  const linked=tolls.find(e=>e.trip_id===id);
  const dialog=document.createElement('dialog');dialog.innerHTML=`<h2>${id?'Modifica':trip?'Aggiungi viaggio':'Aggiungi rimborso'}</h2><form><div class="fields">`+
    field(trip?'date':'received_date',trip?'Data viaggio':'Data ricezione rimborso',trip?day:row.received_date||row.date||today(),'date','required')+
    (trip?field('entry_station','Entrata / partenza',row.entry_station||'','text','required')+field('exit_station','Uscita / destinazione',row.exit_station||'','text','required')+select('toll_id','Pedaggio registrato',[['','Da collegare dopo'],...tolls.map(e=>[e.id,new Date(e.date).toLocaleDateString('it-IT')+' · '+e.description+' · '+money(e.amount_cents)])],linked?.id||'')+field('distance_km','Chilometri percorsi',row.distance_km??'','number','required min="0.1" max="10000" step="0.1"')+field('consumption','Consumo medio',row.consumption??'','number','required min="0.01" max="1000" step="0.01"')+select('consumption_unit','Unita consumo',[['l100km','l/100 km'],['kml','km/l']],row.consumption_unit||'l100km')+field('price','Prezzo benzina (€/l)',price?(price/100).toFixed(3):'','number','required min="0.01" max="100" step="0.001"'):
      select('trip_id','Viaggio rimborsato',[['','Seleziona viaggio'],...trips.map(t=>[t.id,tripLabel(t)])],row.trip_id||'')+field('amount','Importo rimborsato (€)',row.amount_cents?row.amount_cents/100:'','number','required min="0.01" step="0.01"'))+
    `<label class="wide">Note<textarea name="notes">${esc(row.notes)}</textarea></label></div><p data-preview></p><p role="alert" style="color:#a22f39"></p><div style="display:flex;justify-content:flex-end;gap:12px"><button type="button" class="secondary" data-cancel>Annulla</button><button type="submit" class="primary">Salva</button></div></form>`;
  document.body.append(dialog);dialog.onclose=()=>dialog.remove();dialog.querySelector('[data-cancel]').onclick=()=>dialog.close();
  const form=dialog.querySelector('form');function preview(){if(!trip)return;const f=form.elements,km=Number(f.distance_km.value),c=Number(f.consumption.value),p=Number(f.price.value),liters=f.consumption_unit.value==='kml'?km/c:km*c/100;dialog.querySelector('[data-preview]').textContent=km>0&&c>0&&p>0?decimal(liters,3)+' L · Benzina stimata '+money(Math.round(liters*p*100)):''}
  form.oninput=preview;if(trip)form.elements.date.onchange=()=>{const p=priorFuelPrice(form.elements.date.value);form.elements.price.value=p?(p/100).toFixed(3):'';preview()};preview();
  if(!trip)form.elements.trip_id.required=true;
  form.onsubmit=async e=>{e.preventDefault();const body=Object.fromEntries(new FormData(form));body.vehicle_id=vehicle().id;if(trip){body.fuel_price_cents=Number(body.price)*100;}else{body.amount_cents=Math.round(Number(body.amount)*100);body.date=trips.find(t=>t.id===body.trip_id)?.date}const button=form.querySelector('[type="submit"]');button.disabled=true;try{await api(table+(id?'/'+id:''),id?'PATCH':'POST',body);dialog.close();await load();notify('Salvato')}catch(error){dialog.querySelector('[role="alert"]').textContent=error.message;button.disabled=false}};
  dialog.showModal();
}
function refreshUniversityGarage(){if(!document.hidden&&!saving&&!document.querySelector('dialog[open]'))load().catch(()=>{})}
window.addEventListener('focus',refreshUniversityGarage);
document.addEventListener('visibilitychange',refreshUniversityGarage);
setInterval(refreshUniversityGarage,30000);
