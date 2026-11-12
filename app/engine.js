export function shuffle(items) { const a = [...items]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i+1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export function createGame(pool, rounds, host) {
 if (![16,24,32].includes(rounds) || pool.length < rounds*8) throw Error(`Choose more artists: ${rounds*8} unique songs are needed for ${rounds} rounds.`);
 const songs = shuffle(pool).slice(0,rounds*8);
 return { host, players: [], stage:'lobby', phase:'qualifying', rounds, round:0, epoch:0, groups:Array.from({length:rounds},(_,i)=>songs.slice(i*8,i*8+8)), options:[], revealed:0, votes:{}, winners:[], runners:[], bracket:[], bracketNext:[], history:[], tie:false, champion:null };
}
export function closeRound(g) {
 if(g.stage!=='voting') throw Error('Voting is not open.');
 const total=Object.keys(g.votes).length;
 if(!total) throw Error('At least one vote is needed.');
 const result=g.options.map(song=>({song,count:Object.values(g.votes).filter(id=>id===song.id).length})).sort((a,b)=>b.count-a.count);
 g.result=result; g.stage='results';
 const tied=result.filter(x=>x.count===result[0].count);
 g.tied=tied.map(x=>x.song); g.winner=tied.length===1?result[0].song:null;
 g.resultTotal=total;
}
export function advance(g) {
 if(g.stage==='lobby') { g.options=g.groups[0]; g.stage='reveal'; g.revealed=1; g.epoch++; return; }
 if(g.stage!=='results') throw Error('Close voting first.');
 if(!g.winner) { g.options=g.tied; g.stage='voting'; g.votes={}; g.epoch++; g.tie=true; return; }
 g.history.push({phase:g.phase,winner:g.winner,round:g.round});
 if(g.phase==='qualifying') {
   g.winners.push(g.winner);
   const runner=g.result.find(x=>x.song.id!==g.winner.id);
   if(runner) g.runners.push({song:runner.song,share:runner.count/g.resultTotal});
   g.round++;
   if(g.round<g.rounds) g.options=g.groups[g.round];
   else { const size=2**Math.ceil(Math.log2(g.rounds)); const extras=shuffle(g.runners).sort((a,b)=>b.share-a.share).slice(0,size-g.rounds).map(x=>x.song); g.bracket=shuffle([...g.winners,...extras]); g.bracketNext=[]; g.phase='knockout'; g.round=0; g.options=g.bracket.slice(0,2); }
 } else {
   g.bracketNext.push(g.winner); g.round++;
   if(g.round*2>=g.bracket.length) {
     if(g.bracketNext.length===1) { g.champion=g.bracketNext[0]; g.stage='champion'; return; }
     g.bracket=g.bracketNext; g.bracketNext=[]; g.round=0;
   }
   g.options=g.bracket.slice(g.round*2,g.round*2+2);
 }
 g.votes={}; g.revealed=1; g.stage='reveal'; g.epoch++; g.tie=false; g.result=[]; g.winner=null;
}
export function publicGame(g,token) {
 const host=token===g.host, player=g.players.find(p=>p.token===token);
 return { stage:g.stage,phase:g.phase,rounds:g.rounds,round:g.round,epoch:g.epoch,options:g.options.slice(0,g.revealed),revealed:g.revealed,optionCount:g.options.length,players:g.players.map(p=>({id:p.id,name:p.name,voted:!!g.votes[p.id],pick:g.stage==='results'?g.votes[p.id]:undefined})),voteCount:Object.keys(g.votes).length,myVote:player?g.votes[player.id]:null,isHost:host,playerId:player?.id,winners:g.winners,bracket:g.bracket,history:g.history,champion:g.champion,tie:g.tie,winner:g.stage==='results'?g.winner:null,result:g.stage==='results'?g.result:[],resultTotal:g.stage==='results'?g.resultTotal:0 };
}
