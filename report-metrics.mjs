const DAY=86400000;
const number=v=>Number.isFinite(+v)?+v:0;
const sum=(rows,key)=>rows.reduce((n,r)=>n+number(r[key]),0);
const revenue=rows=>sum(rows,'tv')+sum(rows,'cv')+sum(rows,'ov');
const date=s=>new Date(s+'T12:00:00Z');
const iso=d=>d.toISOString().slice(0,10);
const inRange=(r,from,to,units)=>r.d>=from&&r.d<=to&&units.includes(r.u);
function summary(rows){const loads=sum(rows,'tq')+sum(rows,'cq'),loadRevenue=sum(rows,'tv')+sum(rows,'cv');return {revenue:revenue(rows),loads,area:sum(rows,'m2'),ticket:loads?loadRevenue/loads:null,truckCount:sum(rows,'tq'),truckRevenue:sum(rows,'tv'),trailerCount:sum(rows,'cq'),trailerRevenue:sum(rows,'cv'),otherRevenue:sum(rows,'ov'),records:rows.length}}
const variation=(current,previous,hasPrevious)=>hasPrevious&&previous>0?(current-previous)/previous*100:null;
export function buildReportMetrics(state,{from,to,units}){
 const start=date(from),end=date(to),days=Math.round((end-start)/DAY)+1;
 if(!Number.isFinite(days)||days<1||!units.length)throw Error('Período ou unidades inválidos.');
 const previousTo=iso(new Date(+start-DAY)),previousFrom=iso(new Date(+start-days*DAY));
 const select=(key,a=from,b=to)=>(state[key]||[]).filter(r=>inRange(r,a,b,units));
 const rows=select('res'),priorRows=select('res',previousFrom,previousTo),steel=select('aco'),priorSteel=select('aco',previousFrom,previousTo),awards=select('lan');
 const current=summary(rows),previous=summary(priorRows);
 current.change=variation(current.revenue,previous.revenue,priorRows.length>0);
 const unitRows=units.map(u=>{const r=rows.filter(x=>x.u===u),p=priorRows.filter(x=>x.u===u),s=summary(r),old=summary(p);return {unit:u,...s,share:current.revenue?s.revenue/current.revenue*100:0,previous:old.revenue,change:variation(s.revenue,old.revenue,p.length>0)}}).sort((a,b)=>b.revenue-a.revenue);
 const steelValue=sum(steel,'v'),steelQty=sum(steel,'q'),oldSteel=sum(priorSteel,'v');
 const productMap=new Map();steel.forEach(r=>{const p=productMap.get(r.p)||{name:r.p,value:0,quantity:0};p.value+=number(r.v);p.quantity+=number(r.q);productMap.set(r.p,p)});
 const products=Array.from(productMap.values()).map(p=>({...p,share:steelValue?p.value/steelValue*100:0})).sort((a,b)=>b.value-a.value);
 const steelUnits=units.map(unit=>{const r=steel.filter(x=>x.u===unit);return {unit,value:sum(r,'v'),quantity:sum(r,'q'),records:r.length}}).sort((a,b)=>b.value-a.value);
 const awardStatus=['Aguardando pagamento','Abrir chamado para pagamento','Pago'].map(status=>({status,value:sum(awards.filter(x=>x.s===status),'v'),count:awards.filter(x=>x.s===status).length}));
 const awardTotal=sum(awards,'v'),paid=awardStatus[2].value;
 const sameMonth=from.slice(0,7)===to.slice(0,7),month=to.slice(0,7);
 const goalRows=sameMonth?units.map(unit=>{const meta=state.metas?.[month]?.[unit]||{},r=(state.res||[]).filter(x=>x.u===unit&&x.d>=month+'-01'&&x.d<=to),a=(state.aco||[]).filter(x=>x.u===unit&&x.d>=month+'-01'&&x.d<=to),v=revenue(r),target=number(meta.val);return {unit,revenue:v,target:target||null,achieved:target?v/target*100:null,gap:target?Math.max(0,target-v):null,area:sum(r,'m2'),areaTarget:number(meta.m2)||null,steel:sum(a,'v'),steelTarget:number(meta.av)||null,steelQty:sum(a,'q'),steelQtyTarget:number(meta.aq)||null}}):[];
 const definedGoals=goalRows.filter(r=>r.target!==null),target=sum(definedGoals,'target'),goalRevenue=sum(definedGoals,'revenue');
 const maxPoints=31,binCount=Math.min(maxPoints,days),series=Array.from({length:binCount},(_,i)=>{const first=Math.floor(i*days/binCount),last=Math.floor((i+1)*days/binCount)-1,a=iso(new Date(+start+first*DAY)),b=iso(new Date(+start+last*DAY)),pa=iso(new Date(+date(previousFrom)+first*DAY)),pb=iso(new Date(+date(previousFrom)+last*DAY));return {from:a,to:b,previousFrom:pa,previousTo:pb,current:revenue(rows.filter(r=>r.d>=a&&r.d<=b)),previous:revenue(priorRows.filter(r=>r.d>=pa&&r.d<=pb)),steel:sum(steel.filter(r=>r.d>=a&&r.d<=b),'v'),previousSteel:sum(priorSteel.filter(r=>r.d>=pa&&r.d<=pb),'v')}});
 let acc=0,oldAcc=0,steelAcc=0,oldSteelAcc=0;series.forEach(p=>{p.cumulative=acc+=p.current;p.previousCumulative=oldAcc+=p.previous;p.steelCumulative=steelAcc+=p.steel;p.previousSteelCumulative=oldSteelAcc+=p.previousSteel});
 return {from,to,days,units:[...units],previousFrom,previousTo,current,previous,unitRows,series,sameMonth,month,goals:{rows:goalRows,defined:definedGoals.length,selected:units.length,target:target||null,actual:goalRevenue,achieved:target?goalRevenue/target*100:null,gap:target?Math.max(0,target-goalRevenue):null},steel:{value:steelValue,quantity:steelQty,average:steelQty?steelValue/steelQty:null,records:steel.length,previous:oldSteel,change:variation(steelValue,oldSteel,priorSteel.length>0),products,units:steelUnits},awards:{total:awardTotal,paid,unpaid:Math.max(0,awardTotal-paid),records:awards.length,status:awardStatus},recordDates:new Set(rows.map(r=>r.d)).size};
}
