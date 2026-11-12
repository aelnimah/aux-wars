import { env } from 'cloudflare:workers';
import { catalog } from '../../catalog';
import { createGame, advance, closeRound, publicGame } from '../../engine';
export const dynamic='force-dynamic';
const json=(data:any,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const tokenOf=(r:Request)=>r.headers.get('authorization')?.replace(/^Bearer /,'')||'';
export async function GET(r:Request){
 const code=new URL(r.url).searchParams.get('code')?.toUpperCase();
 const row=await env.DB!.prepare('SELECT state,expires FROM rooms WHERE code=?').bind(code||'').first<any>();
 if(!row||row.expires<Date.now()) return json({error:'Room not found or expired. Create a new room.'},404);
 return json({code,...publicGame(JSON.parse(row.state),tokenOf(r))});
}
export async function POST(r:Request){
 try {
 const b=await r.json() as any, token=tokenOf(r);
 if(b.action==='create') {
  const host=crypto.randomUUID(), pool=catalog.filter(s=>(b.artists||[]).includes(s.artist));
  const g=createGame(pool,Number(b.rounds),host);
  for(let i=0;i<5;i++) {const code=Array.from(crypto.getRandomValues(new Uint8Array(6))).map(x=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x%32]).join('');
   try {await env.DB!.prepare('INSERT INTO rooms (code,state,version,expires) VALUES (?,?,0,?)').bind(code,JSON.stringify(g),Date.now()+86400000).run();return json({code,token:host,...publicGame(g,host)});}catch(e){if(i===4) throw e;}
  }
 }
 for(let retry=0;retry<8;retry++){
 const code=String(b.code||'').toUpperCase();
 const row=await env.DB!.prepare('SELECT * FROM rooms WHERE code=?').bind(code).first<any>();
 if(!row||row.expires<Date.now()) return json({error:'Room not found or expired.'},404);
 const g=JSON.parse(row.state); let returnedToken=token;
 if(b.action==='join') {
  const existing=g.players.find((p:any)=>p.token===token);
  if(existing)return json({code,token,...publicGame(g,token)});
  const name=String(b.name||'').trim().slice(0,24);
  if(!name)throw Error('Enter your name.');
  if(g.players.length>=50)throw Error('This room is full.');
  if(g.players.some((p:any)=>p.name.toLowerCase()===name.toLowerCase()))throw Error('That name is taken. Try another.');
  returnedToken=crypto.randomUUID();g.players.push({id:crypto.randomUUID(),token:returnedToken,name});
 } else if(b.action==='vote') {
  const p=g.players.find((p:any)=>p.token===token);
  if(!p) return json({error:'Join this room to vote.'},403);
  if(g.stage!=='voting'||b.epoch!==g.epoch)throw Error('This vote has closed.');
  if(!g.options.some((s:any)=>s.id===b.song))throw Error('Invalid song.');
  g.votes[p.id]=b.song;
 } else {
  if(token!==g.host)return json({error:'Only the host can do that.'},403);
  if(b.epoch!==g.epoch||b.stage!==g.stage)throw Error('The round changed. Try again.');
  if(b.action==='advance')advance(g);
  else if(b.action==='reveal') {if(g.stage!=='reveal')throw Error('Reveal is closed.');g.revealed=Math.min(g.options.length,g.revealed+1);}
  else if(b.action==='open') {if(g.stage!=='reveal')throw Error('Round already started.');g.revealed=g.options.length;g.stage='voting';}
  else if(b.action==='close')closeRound(g);
  else throw Error('Unknown action.');
 }
 const result=await env.DB!.prepare('UPDATE rooms SET state=?,version=version+1 WHERE code=? AND version=?').bind(JSON.stringify(g),code,row.version).run();
 if(result.meta.changes)return json({code,token:returnedToken,...publicGame(g,returnedToken)});
 }
 return json({error:'The room is busy. Please try again.'},409);
 }catch(e:any){return json({error:e.message||'Something went wrong.'},400);}
}
