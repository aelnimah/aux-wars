import test from 'node:test';
import assert from 'node:assert/strict';
import { config, createRoom, addPlayer, addBots, hostAction, castVote, viewFor, rooms, totalMatches, resetGame } from '../src/game.js';

config.botDelay = [0, 5];
config.music = {
  async resolveTrack(artist, title) { return { preview: `https://x/${title}.mp3`, cover: `https://x/${title}.jpg` }; },
  async chartTracks() { return []; },
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const until = async (fn, ms = 3000) => { const t = Date.now(); while (!fn()) { if (Date.now() - t > ms) throw new Error('timeout'); await wait(5); } };

test('full 4-qualifier game with simulated players reaches a champion', async () => {
  const room = createRoom({ qualifiers: 4, autoSeconds: 0, voteSeconds: 0 });
  addBots(room, 3);
  await hostAction(room, 'start');
  assert.equal(room.phase, 'reveal');
  const seen = new Set();
  let matches = 0;
  while (room.phase !== 'champion') {
    if (room.phase === 'reveal') {
      // players only ever see revealed songs
      const view = viewFor(room, 'player', [...room.players.keys()][0]);
      assert.equal(view.match.songs.length, room.match.revealed);
      await hostAction(room, 'reveal');
    } else if (room.phase === 'voting') {
      const v = viewFor(room, 'player', [...room.players.keys()][0]);
      assert.equal(v.match.result, undefined, 'results hidden while voting');
      await until(() => Object.keys(room.match.votes).length === room.players.size);
      await hostAction(room, 'closeVoting');
    } else if (room.phase === 'results') {
      if (room.match.result.tie) await hostAction(room, 'tiebreak');
      else {
        if (room.match.kind === 'qualifying' && room.match.seq) for (const s of room.match.songs) { assert(!seen.has(s.title), 'no repeats in qualifying'); seen.add(s.title); }
        matches++;
        await hostAction(room, 'next');
      }
    } else await wait(5);
  }
  assert.equal(matches, totalMatches(4));
  assert.ok(room.champion);
  const v = viewFor(room, 'host');
  assert.equal(v.champion.id, room.champion.id);
});

test('votes: changeable, hidden, stale rejected, only candidates', async () => {
  const room = createRoom({ qualifiers: 4, autoSeconds: 0 });
  const p = addPlayer(room, 'Ana'); const q = addPlayer(room, 'Ben');
  await hostAction(room, 'start');
  await hostAction(room, 'openVoting');
  const token = viewFor(room, 'player', p.id).match.token;
  const [a, b] = room.match.songs;
  castVote(room, p.id, token, a.id);
  castVote(room, p.id, token, b.id); // change
  assert.equal(room.match.votes[p.id], b.id);
  assert.throws(() => castVote(room, p.id, '999.1', a.id), /earlier round/);
  assert.throws(() => castVote(room, p.id, token, 'nope'), /not in this vote/);
  assert.equal(viewFor(room, 'player', q.id).me.vote, null);
  assert.equal(JSON.stringify(viewFor(room, 'player', q.id)).includes(b.id + '"', 0) && viewFor(room, 'player', q.id).match.result, undefined);
  castVote(room, q.id, token, a.id); // 1-1 tie
  await hostAction(room, 'closeVoting');
  assert.equal(room.match.result.tie, true);
  await hostAction(room, 'tiebreak');
  assert.equal(room.phase, 'voting');
  assert.equal(viewFor(room, 'player', p.id).match.songs.length, 2, 'only tied songs in tiebreak');
  assert.throws(() => castVote(room, p.id, token, a.id), /earlier round/, 'old token dead after tiebreak');
  const t2 = viewFor(room, 'player', p.id).match.token;
  castVote(room, p.id, t2, a.id); castVote(room, q.id, t2, a.id);
  await hostAction(room, 'closeVoting');
  assert.equal(room.match.result.winnerId, a.id);
  assert.deepEqual(room.match.result.tallies[a.id].voters.sort(), ['Ana', 'Ben']);
});

test('auto reveal advances and opens voting; vote timer closes it', async () => {
  const room = createRoom({ qualifiers: 4, autoSeconds: 8, voteSeconds: 30 });
  addPlayer(room, 'Ana');
  const realSetTimeout = global.setTimeout;
  const delays = [];
  global.setTimeout = (fn, ms, ...a) => { delays.push(ms); return realSetTimeout(fn, 0, ...a); };
  try {
    await hostAction(room, 'start');
    await until(() => room.phase === 'voting');
    assert.equal(room.match.revealed, 8);
    await until(() => room.phase === 'results');
    assert.ok(delays.includes(8000) && delays.includes(30000));
  } finally { global.setTimeout = realSetTimeout; }
});

test('too few songs gives a friendly error and returns to lobby', async () => {
  const room = createRoom({ qualifiers: 16, packs: ['pregame'] });
  addPlayer(room, 'Ana');
  await hostAction(room, 'start');
  assert.equal(room.phase, 'lobby');
  assert.match(room.error, /Not enough songs/);
});

test('reset returns to lobby and keeps players', async () => {
  const room = createRoom({ qualifiers: 4 });
  addPlayer(room, 'Ana');
  await hostAction(room, 'start');
  await hostAction(room, 'reset');
  assert.equal(room.phase, 'lobby');
  assert.equal(room.players.size, 1);
});

test.after(() => rooms.clear());
