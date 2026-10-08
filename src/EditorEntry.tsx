import React,{useState,useEffect} from 'react';
import App from './App';
export default function EditorEntry(){
 const [session,setSession]=useState<any>(null),[password,setPassword]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(true),[configured,setConfigured]=useState(true);
 async function load(){
  setBusy(true);
  try{const r=await fetch('/api/editor');const d=await r.json();if(r.ok)setSession(d);else{setSession(null);setConfigured(r.status!==503);setMessage(r.status===401?'':d.error||'연결 실패');}}
  catch{setMessage('서버에 연결하지 못했습니다.');}finally{setBusy(false);}
 }
 useEffect(()=>{load();},[]);
 async function login(e:React.FormEvent){e.preventDefault();setBusy(true);try{const r=await fetch('/api/editor?action=login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});const d=await r.json();setPassword('');if(!r.ok)throw new Error(d.error);await load();}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
 if(session)return <><button style={{position:'fixed',bottom:20,right:20,zIndex:9999,background:'#222',color:'white',padding:12,border:'1px solid #777',borderRadius:12}} onClick={async()=>{try{await fetch('/api/editor?action=logout',{method:'POST'});}finally{setSession(null);location.reload();}}}>관리자 로그아웃</button><App initialData={session.data} initialSha={session.sha}/></>;
 return <main style={{minHeight:'100vh',background:'#171717',color:'white',display:'grid',placeItems:'center',padding:24}}><form onSubmit={login} style={{width:'100%',maxWidth:380,display:'grid',gap:20}}><h1 style={{fontSize:28}}>불한당 관리자 로그인</h1><label>관리자 비밀번호<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} style={{display:'block',width:'100%',padding:12,marginTop:8,background:'#262626',color:'white',border:'1px solid #777',borderRadius:8}}/></label><button disabled={busy||!configured} style={{padding:14,background:'#21f1a8',color:'#171717',borderRadius:8}}>{busy?'확인 중…':'로그인'}</button><p role="status">{message}</p><a href="/" style={{color:'#21f1a8'}}>포트폴리오 보기</a></form></main>;
}
