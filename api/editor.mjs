import {createHmac, timingSafeEqual, createHash} from 'node:crypto';
const COOKIE='bhd_admin';
const repo='wnsworla00-pixel/kjj-portfolio';
const file='src/portfolio.json';
const digest=s=>createHash('sha256').update(String(s)).digest();
export const equal=(a,b)=>timingSafeEqual(digest(a),digest(b));
export function signature(value,secret){return createHmac('sha256',secret).update(value).digest('hex');}
export function validSession(token,secret,now=Date.now()){
 if(!secret||!token)return false;
 const [expires,sig,...rest]=token.split('.');
 return !rest.length&&/^\d+$/.test(expires)&&Number(expires)>now&&Number(expires)<=now+8*3600000&&equal(signature(expires,secret),sig||'');
}
export function validData(data){
 if(!data||typeof data!=='object'||!Array.isArray(data.projects)||data.projects.length>2000)return false;
 const ids=new Set();
 return data.projects.every(p=>{
  if(!p||typeof p.id!=='string'||!p.id||ids.has(p.id)||typeof p.title!=='string'||!p.title.trim())return false;
  ids.add(p.id);
  return ['genre','role','year'].every(k=>typeof p[k]==='string')&&
   (!p.images||(Array.isArray(p.images)&&p.images.every(x=>typeof x==='string'&&/^(https?:\/\/|\/(?!\/)|data:image\/(png|jpeg|webp);base64,|$)/i.test(x))));
 });
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const send=(status,body)=>res.status(status).json(body);
 const password=process.env.EDITOR_ADMIN_PASSWORD, secret=process.env.EDITOR_SESSION_SECRET, github=process.env.EDITOR_GITHUB_TOKEN;
 if(!password||password.length<24||!secret||secret.length<32||!github)return send(503,{error:'관리자 로그인 설정이 아직 완료되지 않았습니다.'});
 const cookie=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
 const action=req.query?.action||'data';
 if(!['GET','POST','DELETE'].includes(req.method)){res.setHeader('Allow','GET, POST, DELETE');return send(405,{error:'지원하지 않는 요청입니다.'});}
 if(req.method!=='GET'){
  const origin=req.headers.origin;
  let originHost;try{originHost=origin?new URL(origin).host:null;}catch{originHost=null;}
  if(!originHost||originHost!==req.headers.host)return send(403,{error:'요청 출처를 확인할 수 없습니다.'});
 }
 let body=req.body;
 if(typeof body==='string'){try{body=JSON.parse(body);}catch{return send(400,{error:'잘못된 데이터입니다.'});}}
 if(action==='login'&&req.method==='POST'){
  if(!equal(body?.password||'',password))return send(401,{error:'비밀번호가 일치하지 않습니다.'});
  const expires=String(Date.now()+8*3600000);
  res.setHeader('Set-Cookie',COOKIE+'='+expires+'.'+signature(expires,secret)+'; HttpOnly; Secure; SameSite=Strict; Path=/api/editor; Max-Age=28800');
  return send(200,{ok:true});
 }
 if(!validSession(cookie,secret))return send(401,{error:'관리자 로그인이 필요합니다.'});
 if(action==='logout'&&req.method==='POST'){
  res.setHeader('Set-Cookie',COOKIE+'=; HttpOnly; Secure; SameSite=Strict; Path=/api/editor; Max-Age=0');return send(200,{ok:true});
 }
 if(action!=='data')return send(404,{error:'없는 기능입니다.'});
 const headers={Authorization:'Bearer '+github,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
 try{
  const url='https://api.github.com/repos/'+repo+'/contents/'+file;
  const current=await fetch(url+'?ref=main',{headers});
  if(!current.ok)throw new Error('read');
  const record=await current.json();
  if(req.method==='GET')return send(200,{data:JSON.parse(Buffer.from(record.content,'base64').toString('utf8')),sha:record.sha});
  if(req.method!=='POST')return send(405,{error:'지원하지 않는 요청입니다.'});
  if(body?.sha!==record.sha)return send(409,{error:'다른 곳에서 수정되었습니다. 새로고침 후 최신 내용으로 다시 수정해 주세요.'});
  if(!validData(body?.data))return send(400,{error:'공연명·ID·연도 또는 사진 형식을 확인해 주세요.'});
  const json=JSON.stringify(body.data,null,2)+'\n';
  if(Buffer.byteLength(json)>3000000)return send(413,{error:'데이터가 너무 큽니다. 사진은 외부 링크로 넣어 주세요.'});
  const saved=await fetch(url,{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({message:'Update portfolio from authenticated editor',content:Buffer.from(json).toString('base64'),sha:record.sha,branch:'main'})});
  if(saved.status===409)return send(409,{error:'다른 수정과 충돌했습니다. 새로고침 후 다시 시도해 주세요.'});
  if(!saved.ok)throw new Error('write');
  const result=await saved.json();
  return send(200,{saved:true,published:true,sha:result.content.sha});
 }catch{return send(502,{error:'저장소 연결에 실패했습니다. 수정 내용은 현재 화면에 남아 있습니다.'});}
}
