const canonical=(v:any):any=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const same=(a:unknown,b:unknown)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const keyed=new Set(['res','aco','lan','cash','steelClosures']);
export function mergeState(base:any,next:any,current:any,path=''):any {
 if(same(base,next))return current;
 if(same(base,current)||same(next,current))return next;
 if(keyed.has(path)&&[base,next,current].every(Array.isArray)){
  const maps=[base,next,current].map(a=>new Map(a.map((r:any)=>[r.id,r])));
  const ids=new Set([...maps[2].keys(),...maps[1].keys(),...maps[0].keys()]);
  return [...ids].map(id=>mergeState(maps[0].get(id),maps[1].get(id),maps[2].get(id),path+'.'+id)).filter(x=>x!==undefined);
 }
 if([base,next,current].every(x=>x&&typeof x==='object'&&!Array.isArray(x))){
  const result:any={};for(const k of new Set([...Object.keys(base),...Object.keys(next),...Object.keys(current)])){
   const value=mergeState(base[k],next[k],current[k],path?path+'.'+k:k);if(value!==undefined)result[k]=value;
  }return result;
 }
 throw Error('Outra pessoa alterou o mesmo campo. Seu rascunho foi preservado; recarregue os dados e confira antes de tentar novamente.');
}
