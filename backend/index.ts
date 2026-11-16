import {createClient} from 'npm:@supabase/supabase-js@2.95.0';
import {stateSchema,emptyState} from './state.ts';
import {mergeState} from './merge.ts';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const allowed=new Set(['https://jmarcicofast-cell.github.io','http://127.0.0.1:4173','http://localhost:4173']);
const audit=async(actor:string|null,action:string,target:string|null=null)=>{await db.from('team_audit').insert({actor,action,target})};
const passwordOK=(v:unknown)=>typeof v==='string'&&v.length>=12&&v.length<=128;
const emailOK=(v:unknown)=>typeof v==='string'&&v.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const hash=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
Deno.serve(async req=>{
 const origin=req.headers.get('Origin')||'';
 const headers:Record<string,string>={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
 if(allowed.has(origin)){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Headers']='authorization, apikey, content-type, x-client-info';headers['Access-Control-Allow-Methods']='POST, OPTIONS'}
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(origin&&!allowed.has(origin))return reply({error:'Origem não autorizada.'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply({error:'Método não permitido.'},405);
 try{
 const raw=await req.text();if(raw.length>6500000)return reply({error:'Solicitação muito grande.'},413);
 const b=JSON.parse(raw),action=b.action;
 if(action==='setup'){
  if(!emailOK(b.email)||!passwordOK(b.password)||typeof b.name!=='string'||!b.name.trim()||b.name.length>100||typeof b.token!=='string'||b.token.length!==64)return reply({error:'Confira os dados. A senha deve ter pelo menos 12 caracteres.'},400);
  const h=await hash(b.token);
  const {data:claim}=await db.from('team_setup').update({used:true}).eq('id','initial').eq('token_hash',h).eq('used',false).gt('expires_at',new Date().toISOString()).select('id').maybeSingle();
  if(!claim)return reply({error:'Código de ativação inválido, vencido ou já utilizado.'},403);
  let created:string|null=null;
  try{
   const {data,error}=await db.auth.admin.createUser({email:b.email.toLowerCase().trim(),password:b.password,email_confirm:true});if(error||!data.user)throw Error('Não foi possível criar essa conta. Confira o e-mail ou tente outro.');created=data.user.id;
   const {error:insertError}=await db.from('team_members').insert({user_id:created,name:b.name.trim(),email:b.email.toLowerCase().trim(),role:'admin'});if(insertError)throw Error('Não foi possível registrar o acesso.');
   await db.from('team_setup').update({token_hash:''}).eq('id','initial');await audit(created,'setup');return reply({ok:true});
  }catch(e){if(created)await db.auth.admin.deleteUser(created);await db.from('team_setup').update({used:false}).eq('id','initial').eq('token_hash',h);throw e}
 }
 const token=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
 const {data:auth,error:authError}=await db.auth.getUser(token);if(authError||!auth.user)return reply({error:'Entre novamente para continuar.'},401);
 const {data:member}=await db.from('team_members').select('*').eq('user_id',auth.user.id).maybeSingle();
 if(!member||!member.active)return reply({error:'Acesso não autorizado. Procure a administradora.'},403);
 let issued=0;try{issued=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).iat||0}catch{}
 if(issued<member.valid_after)return reply({error:'Seu acesso foi atualizado. Entre novamente.'},401);
 if(action==='me')return reply({member});
 if(action==='password'){
  if(!passwordOK(b.password))return reply({error:'Use uma senha entre 12 e 128 caracteres.'},400);
  const {error}=await db.auth.admin.updateUserById(member.user_id,{password:b.password});if(error)throw Error('Não foi possível alterar a senha.');
  const {error:pe}=await db.from('team_members').update({must_change_password:false,valid_after:Math.floor(Date.now()/1000)+1}).eq('user_id',member.user_id);if(pe)throw Error('Não foi possível concluir a troca.');await audit(member.user_id,'password');return reply({ok:true,relogin:true});
 }
 if(member.must_change_password)return reply({error:'Troque sua senha temporária antes de continuar.',changePassword:true},403);
 if(action==='state'){
  const {data,error}=await db.from('team_state').select('*').eq('id','main').single();if(error)throw Error('Não foi possível ler os dados.');return reply({state:data.data,revision:data.revision,updatedAt:data.updated_at});
 }
 if(action==='save'){
  const parsed=stateSchema.safeParse(b.state),old=stateSchema.safeParse(b.base);
  if(!parsed.success||!old.success)return reply({error:'Dados inválidos. Confira os lançamentos.'},400);
  for(let attempt=0;attempt<4;attempt++){
   const {data:current,error}=await db.from('team_state').select('*').eq('id','main').single();if(error)throw Error('Não foi possível ler os dados.');
   let merged;try{merged=stateSchema.parse(mergeState(old.data,parsed.data,current.data))}catch(e){return reply({error:e instanceof Error&&e.message.startsWith('Outra pessoa')?e.message:'A alteração gerou registros incompatíveis ou duplicados. Recarregue e confira.',conflict:true},409)}
   const now=new Date().toISOString();const {data:updated,error:ue}=await db.from('team_state').update({data:merged,revision:current.revision+1,updated_at:now}).eq('id','main').eq('revision',current.revision).select('revision').maybeSingle();if(ue)throw Error('Não foi possível salvar.');
   if(updated){await audit(member.user_id,'save',String(updated.revision));return reply({state:merged,revision:updated.revision,updatedAt:now})}
  }return reply({error:'Há alterações simultâneas. Tente salvar novamente.',conflict:true},409);
 }
 if(member.role!=='admin')return reply({error:'Somente administradoras podem gerenciar acessos.'},403);
 if(action==='users'){const {data,error}=await db.from('team_members').select('user_id,name,email,role,active,must_change_password,created_at').order('name');if(error)throw Error('Não foi possível listar os acessos.');return reply({users:data})}
 if(action==='create-user'){
  if(!emailOK(b.email)||!passwordOK(b.password)||typeof b.name!=='string'||!b.name.trim()||b.name.length>100||!['admin','member'].includes(b.role))return reply({error:'Confira nome, e-mail, perfil e senha de pelo menos 12 caracteres.'},400);
  const {data,error}=await db.auth.admin.createUser({email:b.email.toLowerCase().trim(),password:b.password,email_confirm:true});if(error||!data.user)throw Error('Não foi possível criar o usuário. O e-mail pode já estar cadastrado.');
  const {error:ie}=await db.from('team_members').insert({user_id:data.user.id,name:b.name.trim(),email:b.email.toLowerCase().trim(),role:b.role,must_change_password:true});if(ie){await db.auth.admin.deleteUser(data.user.id);throw Error('Não foi possível registrar o acesso.')};await audit(member.user_id,'create-user',data.user.id);return reply({ok:true});
 }
 if(action==='update-user'){
  if(b.user_id===member.user_id)return reply({error:'Use outro administrador para alterar seu próprio perfil.'},400);
  const {data:target}=await db.from('team_members').select('*').eq('user_id',b.user_id).maybeSingle();if(!target)return reply({error:'Usuário não encontrado.'},404);
  const changes:Record<string,unknown>={valid_after:Math.floor(Date.now()/1000)+1};
  if(typeof b.active==='boolean')changes.active=b.active;
  if(['admin','member'].includes(b.role))changes.role=b.role;
  if(b.password!==undefined){if(!passwordOK(b.password))return reply({error:'A senha temporária deve ter pelo menos 12 caracteres.'},400);const {error}=await db.auth.admin.updateUserById(b.user_id,{password:b.password});if(error)throw Error('Não foi possível redefinir a senha.');changes.must_change_password=true}
  const {error}=await db.from('team_members').update(changes).eq('user_id',b.user_id);if(error)throw Error('Não foi possível atualizar o acesso.');await audit(member.user_id,'update-user',b.user_id);return reply({ok:true});
 }
 return reply({error:'Ação não encontrada.'},404);
 }catch(e){return reply({error:e instanceof Error?e.message:'Não foi possível concluir a operação.'},400)}
});
