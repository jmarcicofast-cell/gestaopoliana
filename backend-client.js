'use strict';
const teamClient=supabase.createClient(TEAM_CONFIG.url,TEAM_CONFIG.key,{auth:{storageKey:'gestaopoliana-auth-v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
let teamMember=null,resolveTeamReady;
const teamReady=new Promise(resolve=>resolveTeamReady=resolve);
const initialToken=new URLSearchParams(location.hash.slice(1)).get('ativar');
if(initialToken)history.replaceState(null,'',location.pathname+location.search);
let authMode=initialToken?'setup':'login';
function showAuth(mode,message=''){
 authMode=mode;document.body.classList.add('auth-locked');document.getElementById('auth-screen').hidden=false;
 const setup=mode==='setup',change=mode==='password';
 document.getElementById('auth-title').textContent=setup?'Ativar a administração':change?'Escolha sua nova senha':'Acesse sua equipe';
 document.getElementById('auth-description').textContent=setup?'Cadastre o primeiro acesso da diretoria. Depois, você poderá criar os acessos da equipe.':change?'Sua conta usa uma senha temporária. Defina uma senha pessoal para continuar.':'Use o e-mail e a senha cadastrados pela administradora.';
 document.getElementById('auth-name-wrap').hidden=!setup;
 document.getElementById('auth-email-wrap').hidden=change;
 document.getElementById('auth-password').autocomplete=mode==='login'?'current-password':'new-password';
 document.getElementById('auth-password').minLength=mode==='login'?1:12;
 document.getElementById('auth-name').required=setup;document.getElementById('auth-email').required=!change;
 document.getElementById('auth-submit').textContent=setup?'Ativar meu acesso':change?'Salvar nova senha':'Entrar';
 document.getElementById('auth-error').textContent=message;
}
async function teamApi(action,params={}){
 const {data:{session}}=await teamClient.auth.getSession();
 const r=await fetch(TEAM_CONFIG.url+'/functions/v1/team-api',{method:'POST',headers:{'Content-Type':'application/json','apikey':TEAM_CONFIG.key,...(session?{Authorization:'Bearer '+session.access_token}:{})},body:JSON.stringify({action,...params})});
 let d;try{d=await r.json()}catch{throw Error('O serviço não respondeu. Confira sua conexão e tente novamente.')}
 if(!r.ok){if(r.status===401&&action!=='setup')showAuth('login','Sua sessão expirou. Entre novamente.');const e=new Error(d.error||'Não foi possível concluir.');e.conflict=d.conflict;throw e}return d;
}
async function enterTeam(){
 const {member}=await teamApi('me');teamMember=member;
 if(member.must_change_password){showAuth('password');return}
 document.getElementById('auth-screen').hidden=true;document.body.classList.remove('auth-locked');
 document.getElementById('account-name').textContent=member.name;document.getElementById('manage-users').hidden=member.role!=='admin';
 resolveTeamReady();
}
document.getElementById('auth-form').onsubmit=async event=>{
 event.preventDefault();const button=document.getElementById('auth-submit');button.disabled=true;document.getElementById('auth-error').textContent='';
 try{
 const password=document.getElementById('auth-password').value,email=document.getElementById('auth-email').value.trim();
 if(authMode==='setup'){
  await teamApi('setup',{token:initialToken,name:document.getElementById('auth-name').value.trim(),email,password});
  const {error}=await teamClient.auth.signInWithPassword({email,password});if(error)throw Error('Acesso criado. Entre com seu e-mail e senha.');await enterTeam();
 }else if(authMode==='password'){
  await teamApi('password',{password});await teamClient.auth.signOut();document.getElementById('auth-password').value='';showAuth('login','Senha atualizada. Entre com a nova senha.');
 }else{
  const {error}=await teamClient.auth.signInWithPassword({email,password});if(error)throw Error('E-mail ou senha inválidos. Confira seus dados.');await enterTeam();
 }
 document.getElementById('auth-password').value='';
 }catch(e){document.getElementById('auth-error').textContent=e.message}finally{button.disabled=false}
};
async function teamLogout(){await teamClient.auth.signOut();location.reload()}
async function teamRequest(_url,options={}){
 await teamReady;
 try{const d=options.method==='PUT'?await teamApi('save',JSON.parse(options.body)):await teamApi('state');return {ok:true,json:async()=>d}}
 catch(e){return {ok:false,json:async()=>({error:e.message,conflict:e.conflict})}}
}
window.teamPassword=()=>showAuth('password');
showAuth(authMode);
if(!initialToken)teamClient.auth.getSession().then(async({data:{session}})=>{if(session)try{await enterTeam()}catch(e){showAuth('login',e.message)}});
