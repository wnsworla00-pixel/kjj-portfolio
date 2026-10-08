import test from 'node:test';
import assert from 'node:assert/strict';
import handler,{validSession,signature,validData} from '../api/editor.mjs';
test('signed sessions reject tampering, expiration and excessive lifetime',()=>{
 const key='test-secret'.repeat(4),now=Date.now(),expiry=String(now+60000);
 assert.equal(validSession(expiry+'.'+signature(expiry,key),key,now),true);
 assert.equal(validSession(expiry+'.bad',key,now),false);
 assert.equal(validSession(expiry+'.'+signature(expiry,key),'wrong',now),false);
 assert.equal(validSession(expiry+'.'+signature(expiry,key),key,now+60001),false);
 assert.equal(validSession('99999999999999.'+signature('99999999999999',key),key,now),false);
});
test('portfolio validation rejects duplicate IDs and unsafe image schemes',()=>{
 const p={id:'a',title:'공연',genre:'Theatre',role:'Designer',year:'2026',images:['/photo.jpg']};
 assert.equal(validData({projects:[p]}),true);
 assert.equal(validData({projects:[p,p]}),false);
 assert.equal(validData({projects:[{...p,images:['javascript:alert(1)']}]}),false);
 assert.equal(validData({projects:[]}),true);
});
test('API denies unconfigured, unauthenticated and cross-origin writes',async()=>{
 const response=()=>({code:0,body:null,headers:{},setHeader(k,v){this.headers[k]=v},status(c){this.code=c;return this},json(b){this.body=b;return this}});
 delete process.env.EDITOR_ADMIN_PASSWORD;
 let res=response();await handler({method:'GET',headers:{}},res);assert.equal(res.code,503);
 process.env.EDITOR_ADMIN_PASSWORD='x'.repeat(24);process.env.EDITOR_SESSION_SECRET='s'.repeat(32);process.env.EDITOR_GITHUB_TOKEN='test';
 res=response();await handler({method:'GET',headers:{}},res);assert.equal(res.code,401);
 res=response();await handler({method:'POST',headers:{host:'example.com',origin:'https://evil.com'},query:{action:'login'},body:{password:'x'.repeat(24)}},res);assert.equal(res.code,403);
 res=response();await handler({method:'POST',headers:{host:'example.com',origin:'https://example.com'},query:{action:'login'},body:{password:'bad'}},res);assert.equal(res.code,401);
 res=response();await handler({method:'POST',headers:{host:'example.com',origin:'https://example.com'},query:{action:'login'},body:{password:'x'.repeat(24)}},res);assert.equal(res.code,200);assert.match(res.headers['Set-Cookie'],/HttpOnly; Secure; SameSite=Strict/);
 const cookie=res.headers['Set-Cookie'].split(';')[0], original=global.fetch;
 try{
  global.fetch=async()=>({ok:true,json:async()=>({sha:'latest',content:Buffer.from('{"projects":[]}').toString('base64')})});
  res=response();await handler({method:'POST',headers:{host:'example.com',origin:'https://example.com',cookie},body:{sha:'stale',data:{projects:[]}}},res);assert.equal(res.code,409);
  let calls=0;
  global.fetch=async(_url,opts)=>{calls++;if(opts.method==='PUT'){assert.equal(JSON.parse(Buffer.from(JSON.parse(opts.body).content,'base64').toString()).projects.length,0);return {ok:true,json:async()=>({content:{sha:'saved'}})};}return {ok:true,json:async()=>({sha:'latest',content:Buffer.from('{"projects":[]}').toString('base64')})};};
  res=response();await handler({method:'POST',headers:{host:'example.com',origin:'https://example.com',cookie},body:{sha:'latest',data:{projects:[]}}},res);assert.equal(res.code,200);assert.equal(res.body.sha,'saved');assert.equal(calls,2);
 }finally{global.fetch=original;}
});
