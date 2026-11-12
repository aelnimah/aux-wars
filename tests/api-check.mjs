import assert from 'node:assert/strict';
import {artists} from '../app/catalog.js';
const base='http://127.0.0.1:5173/api/game';
async function call(body,token=''){const r=await fetch(base,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)});return {status:r.status,...await r.json()};}
const host=await call({action:'create',artists,rounds:16});assert.equal(host.status,200);
const code=host.code;
const players=await Promise.all(Array.from({length:5},(_,i)=>call({action:'join',code,name:`QA ${i}`})));
assert.ok(players.every(p=>p.status===200));
let g=await call({action:'advance',code,epoch:0,stage:'lobby'},host.token);assert.equal(g.players.length,5);
g=await call({action:'open',code,epoch:g.epoch,stage:g.stage},host.token);
let denied=await call({action:'close',code,epoch:g.epoch,stage:g.stage},players[0].token);assert.equal(denied.status,403);
await Promise.all(players.map(p=>call({action:'vote',code,epoch:g.epoch,song:g.options[0].id},p.token)));
const before=await (await fetch(`${base}?code=${code}`)).json();assert.equal(before.voteCount,5);assert.ok(before.players.every(p=>!p.pick));
g=await call({action:'close',code,epoch:g.epoch,stage:g.stage},host.token);assert.equal(g.result[0].count,5);assert.ok(g.players.every(p=>p.pick===g.winner.id));
const late=await call({action:'vote',code,epoch:g.epoch,song:g.options[1].id},players[0].token);assert.equal(late.status,400);
console.log('API checks passed: concurrent joins/votes, host-only controls, hidden picks, reveal, late-vote rejection.');
