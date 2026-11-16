import {z} from 'zod';
const amount=z.number().finite().min(0).max(1e12),count=amount.int(),name=z.string().trim().min(1).max(300);
const unit=z.enum(['Televendas','Atacado BA','Atacado B2B','Lojas Rio','Lojas de Fora']);
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>!isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s);
const base={id:z.number().finite().positive(),d:date,u:unit},month=z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const director=z.object({
 units:z.record(unit,z.object({label:name,manager:z.string().trim().max(300)})).optional(),
 holidays:z.array(date).max(1000).optional(),
 weeklyTargets:z.record(date,z.record(unit,amount)).optional(),
 notes:z.record(date,z.string().max(5000)).optional()
}).optional();
export const stateSchema=z.object({
 res:z.array(z.object({...base,g:name,tq:count,tv:amount,cq:count,cv:amount,ov:amount,m2:amount})).max(10000),
 aco:z.array(z.object({...base,p:name,q:count.positive(),v:amount})).max(10000),
 lan:z.array(z.object({...base,vd:name,r:name,c:z.string().max(300),q:count.positive(),v:amount,s:z.enum(['Aguardando pagamento','Abrir chamado para pagamento','Pago'])})).max(10000),
 regras:z.record(month,z.array(z.object({n:name,t:name,v:amount,d:z.string().max(2000)})).max(100)),
 metas:z.record(month,z.record(unit,z.object({m2:amount.optional(),val:amount.optional(),aq:count.optional(),av:amount.optional()}))),
 pts:z.array(z.tuple([name,amount])).max(100),cat:z.array(z.tuple([z.string().max(100),name])).max(1000),
 cash:z.array(z.object({...base,v:amount.positive(),note:z.string().trim().max(1000)})).max(10000).optional(),
 steelClosures:z.array(z.object({...base,kind:z.enum(['day','month']),v:amount,note:z.string().trim().max(1000)})).max(10000).optional(),
 diretoria:director
}).superRefine((s,c)=>{
 for(const k of ['res','aco','lan','cash','steelClosures'] as const){const rows=s[k]||[];if(new Set(rows.map(x=>x.id)).size!==rows.length)c.addIssue({code:'custom',message:'IDs duplicados'});}
 if(new Set(s.res.map(x=>x.d+'|'+x.u)).size!==s.res.length)c.addIssue({code:'custom',message:'Resumos duplicados'});
 const closures=s.steelClosures||[];if(new Set(closures.map(x=>x.d+'|'+x.u+'|'+x.kind)).size!==closures.length)c.addIssue({code:'custom',message:'Fechamentos de aço duplicados'});
});
export function emptyState(){return {res:[],aco:[],lan:[],regras:{},metas:{},cash:[],steelClosures:[],diretoria:{},pts:[['Aço',2],['Placa cimentícia',2],['Fita hobby',2],['Demais itens, exceto placas',1],['Placas em geral',0]],cat:[['DW00012','Guia drywall 48 mm 0,43 3m'],['DW00026','Montante drywall 48 mm 0,43 3m'],['DW00003','CANTONEIRA DRYWALL 25x30 - 3.00 M']]}}
