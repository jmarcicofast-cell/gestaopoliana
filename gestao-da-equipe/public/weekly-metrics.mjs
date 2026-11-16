const DAY=86400000;
const date=s=>new Date(s+'T12:00:00Z'),iso=d=>d.toISOString().slice(0,10),add=(s,n)=>iso(new Date(+date(s)+n*DAY));
const num=v=>Number.isFinite(+v)?+v:0,sum=(a,k)=>a.reduce((v,r)=>v+num(r[k]),0),revenue=a=>sum(a,'tv')+sum(a,'cv')+sum(a,'ov');
export const DIRECTOR_UNITS=[
 {key:'Atacado B2B',label:'B2B SP',manager:'Osmar'},
 {key:'Televendas',label:'Televendas Porto',manager:'Juliana'},
 {key:'Atacado BA',label:'Televendas BA',manager:'Bruno'},
 {key:'Lojas Rio',label:'Lojas do Rio',manager:'Fran'},
 {key:'Lojas de Fora',label:'Lojas de Fora',manager:'Carlos'}
];
export function monday(s){const dow=date(s).getUTCDay();return add(s,-((dow+6)%7))}
function range(a,b){const out=[];for(let s=a;s<=b;s=add(s,1))out.push(s);return out}
function workday(s,holidays){const d=date(s).getUTCDay();return d!==0&&d!==6&&!holidays.has(s)}
export function reportWeeks(month,excluded=[]){const last=iso(new Date(Date.UTC(+month.slice(0,4),+month.slice(5),0,12))),first=month+'-01',holidays=new Set(excluded),out=[];for(let s=monday(first);s<=last;s=add(s,7)){const start=s<first?first:s,end=add(s,6)>last?last:add(s,6),days=range(start,end).filter(d=>workday(d,holidays));if(range(start,end).some(d=>{const dow=date(d).getUTCDay();return dow!==0&&dow!==6}))out.push({key:s,start,end,workEnd:add(s,4)>last?last:add(s,4),days,index:out.length+1})}return out}
function pace(ratio,expected){return ratio===null?'neutral':ratio>=expected?'good':ratio>=expected*.65?'watch':'bad'}
function steelPosition(state,unit,start,cutoff,expectedDays){
 const ledger=(state.aco||[]).filter(r=>r.u===unit&&r.d>=start&&r.d<=cutoff),closures=(state.steelClosures||[]).filter(r=>r.u===unit&&r.d>=start&&r.d<=cutoff);
 const baseline=closures.filter(r=>r.kind==='month').sort((a,b)=>b.d.localeCompare(a.d)||b.id-a.id)[0]||null,byDay=new Map();
 ledger.forEach(r=>{const value=byDay.get(r.d)||{d:r.d,v:0,source:'products'};value.v+=num(r.v);byDay.set(r.d,value)});
 closures.filter(r=>r.kind==='day').forEach(r=>byDay.set(r.d,{d:r.d,v:num(r.v),source:'day',note:r.note}));
 const after=[...byDay.values()].filter(r=>!baseline||r.d>baseline.d).sort((a,b)=>a.d.localeCompare(b.d));
 const missing=expectedDays.filter(d=>(!baseline||d>baseline.d)&&!byDay.has(d));
 const hasData=!!baseline||after.length>0,total=(baseline?num(baseline.v):0)+sum(after,'v');
 return {value:total,hasData,partial:missing.length>0,missing,baseline,details:after,closures:closures.length,zeroReported:hasData&&total===0};
}
export function buildWeeklyReport(state,{cutoff,units}){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(cutoff)||!units.length)throw Error('Data de corte ou unidades inválidas.');
 const month=cutoff.slice(0,7),first=month+'-01',last=iso(new Date(Date.UTC(+month.slice(0,4),+month.slice(5),0,12))),settings=state.diretoria||{},holidays=new Set(settings.holidays||[]),weeks=reportWeeks(month,[...holidays]);
 const week=weeks.find(w=>cutoff>=w.start&&cutoff<=w.end)||weeks[0],weekStart=week.start,weekCutoff=cutoff<weekStart?cutoff:cutoff>week.end?week.end:cutoff;
 const monthBusinessDays=range(first,last).filter(d=>workday(d,holidays)),monthExpected=monthBusinessDays.filter(d=>d<=cutoff),weekExpected=range(weekStart,weekCutoff).filter(d=>workday(d,holidays));
 const order=DIRECTOR_UNITS.filter(u=>units.includes(u.key)),allRows=state.res||[],weekDates=range(weekStart,weekCutoff).filter(d=>workday(d,holidays)||allRows.some(r=>r.d===d&&units.includes(r.u)));
 const priorStart=add(week.key,-7),priorEnd=add(week.key,-1),priorExpected=range(priorStart,priorEnd).filter(d=>workday(d,holidays)),weeklyExpected=week.days.length?weekExpected.length/week.days.length*100:100,monthlyExpected=monthBusinessDays.length?monthExpected.length/monthBusinessDays.length*100:100;
 const rows=order.map(u=>{const display=settings.units?.[u.key]||{},r=allRows.filter(x=>x.u===u.key),monthRows=r.filter(x=>x.d>=first&&x.d<=cutoff),weekRows=r.filter(x=>x.d>=weekStart&&x.d<=weekCutoff),priorRows=r.filter(x=>x.d>=priorStart&&x.d<=priorEnd),byDay=new Map(r.map(x=>[x.d,x]));
 const target=num(state.metas?.[month]?.[u.key]?.val),steelTarget=num(state.metas?.[month]?.[u.key]?.av),override=settings.weeklyTargets?.[week.key]?.[u.key],weeklyTarget=override!==undefined?num(override):(target&&monthBusinessDays.length?target*week.days.length/monthBusinessDays.length:0),weekly=revenue(weekRows),monthly=revenue(monthRows),weeklyPct=weeklyTarget&&weekRows.length?weekly/weeklyTarget*100:null,monthlyPct=target&&monthRows.length?monthly/target*100:null;
 const missing=weekExpected.filter(d=>!byDay.has(d)),monthMissing=monthExpected.filter(d=>!byDay.has(d)),priorMissing=priorExpected.filter(d=>!byDay.has(d)),steel=steelPosition(state,u.key,first,cutoff,monthExpected),steelPct=steelTarget&&steel.hasData?steel.value/steelTarget*100:null;
 return {key:u.key,label:display.label||u.label,manager:display.manager??u.manager,target,weeklyTarget,weeklyTargetSource:override!==undefined?'manual':'rateio',weekly,monthly,weeklyPct,monthlyPct,weeklyHasData:weekRows.length>0,monthlyHasData:monthRows.length>0,prior:revenue(priorRows),priorHasData:priorRows.length>0,priorPartial:priorMissing.length>0,days:weekDates.map(d=>({d,value:byDay.has(d)?revenue([byDay.get(d)]):null})),missing,monthMissing,partial:missing.length>0,monthPartial:monthMissing.length>0,weeklyTone:pace(weeklyPct,weeklyExpected),monthTone:pace(monthlyPct,monthlyExpected),steel:{...steel,target:steelTarget,pct:steelPct,tone:pace(steelPct,monthlyExpected)}};
 });
 const totals={target:sum(rows,'target'),weeklyTarget:sum(rows,'weeklyTarget'),weekly:sum(rows,'weekly'),monthly:sum(rows,'monthly'),prior:sum(rows,'prior'),weeklyHasData:rows.some(r=>r.weeklyHasData),monthlyHasData:rows.some(r=>r.monthlyHasData),priorHasData:rows.some(r=>r.priorHasData),partial:rows.some(r=>r.partial),monthPartial:rows.some(r=>r.monthPartial),priorPartial:rows.some(r=>r.priorPartial),days:weekDates.map(d=>({d,value:rows.reduce((s,r)=>s+(r.days.find(p=>p.d===d)?.value||0),0),hasData:rows.some(r=>r.days.find(p=>p.d===d)?.value!==null),partial:rows.some(r=>r.days.find(p=>p.d===d)?.value===null)}))};
 const weeklyTargetsDefined=rows.filter(r=>r.weeklyTarget>0),monthlyTargetsDefined=rows.filter(r=>r.target>0);totals.weeklyMetaCount=weeklyTargetsDefined.length;totals.monthlyMetaCount=monthlyTargetsDefined.length;
 totals.weeklyPct=totals.weeklyTarget&&weeklyTargetsDefined.some(r=>r.weeklyHasData)?sum(weeklyTargetsDefined,'weekly')/totals.weeklyTarget*100:null;totals.monthlyPct=totals.target&&monthlyTargetsDefined.some(r=>r.monthlyHasData)?sum(monthlyTargetsDefined,'monthly')/totals.target*100:null;totals.weeklyTone=pace(totals.weeklyPct,weeklyExpected);totals.monthTone=pace(totals.monthlyPct,monthlyExpected);totals.monthGap=totals.target?Math.max(0,totals.target-sum(monthlyTargetsDefined,'monthly')):null;
 const steelTotal=rows.reduce((s,r)=>s+r.steel.value,0),steelTargets=rows.filter(r=>r.steel.target>0),steelTarget=steelTargets.reduce((s,r)=>s+r.steel.target,0),steelActualWithTarget=steelTargets.reduce((s,r)=>s+r.steel.value,0),steelHasData=rows.some(r=>r.steel.hasData);
 const cash=(state.cash||[]).filter(r=>units.includes(r.u)&&r.d>=first&&r.d<=cutoff).map(r=>({...r,label:rows.find(u=>u.key===r.u)?.label||r.u})).sort((a,b)=>a.d.localeCompare(b.d));
 return {month,first,last,cutoff,week,weekCutoff,weekDates,weeks,priorStart,priorEnd,priorLabel:week.index>1?'S'+(week.index-1):'Semana anterior',monthBusinessDays:monthBusinessDays.length,weekBusinessDays:week.days.length,weekElapsed:weekExpected.length,monthElapsed:monthExpected.length,expectedWeeklyPct:weeklyExpected,expectedMonthlyPct:monthlyExpected,rows,totals,steel:{value:steelTotal,target:steelTarget,metaCount:steelTargets.length,hasData:steelHasData,partial:rows.some(r=>r.steel.partial),pct:steelTarget&&steelTargets.some(r=>r.steel.hasData)?steelActualWithTarget/steelTarget*100:null},cash,cashTotal:sum(cash,'v'),note:settings.notes?.[week.key]||'',holidays:[...holidays].filter(d=>d.startsWith(month))};
}
