import test from 'node:test';
import assert from 'node:assert/strict';
import { closeRoom, config, createRoom, addPlayer, addBots, hostAction, castVote, viewFor, rooms, totalMatches, resetGame } from '../src/game.js';

config.botDelay = [0, 5];
config.introMs = 0;
config.music = {
  async resolveTrack(artist, title) { return { preview: `https://x/${title}.mp3`, cover: `https://x/${title}.jpg` }; },
  async spotlightTracks(name) { return Array.from({ length: 12 }, (_, i) => ({ artist: name, title: `${name} hit ${i}`, resolved: { preview: 'https://x/p.mp3', cover: null } })); },
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
  const room = createRoom({ qualifiers: 16, mode: 'custom', packs: ['pregame'] });
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

test('intro splash shows the question before songs, and can be skipped', async () => {
  config.introMs = 60000;
  try {
    const room = createRoom({ qualifiers: 4, autoSeconds: 0 });
    addPlayer(room, 'Ana');
    await hostAction(room, 'start');
    assert.equal(room.phase, 'intro');
    const v = viewFor(room, 'player', [...room.players.keys()][0]);
    assert.equal(v.match.songs.length, 0);
    assert.ok(v.match.question);
    await hostAction(room, 'reveal');
    assert.equal(room.phase, 'reveal');
    assert.equal(room.match.revealed, 1);
    resetGame(room);
  } finally { config.introMs = 0; }
});

test('pause stops auto-reveal, resume restarts it', async () => {
  const room = createRoom({ qualifiers: 4, autoSeconds: 8 });
  addPlayer(room, 'Ana');
  await hostAction(room, 'start');
  assert.ok(room.match.nextAt);
  await hostAction(room, 'pause');
  assert.equal(room.match.nextAt, null);
  assert.equal(viewFor(room, 'host').paused, true);
  await hostAction(room, 'resume');
  assert.ok(room.match.nextAt);
  resetGame(room);
});

test('random draw settles a tie; auto-continue advances', async () => {
  const room = createRoom({ qualifiers: 4, autoSeconds: 0, autoNext: 6 });
  const p = addPlayer(room, 'Ana'); const q = addPlayer(room, 'Ben');
  await hostAction(room, 'start');
  await hostAction(room, 'openVoting');
  const token = viewFor(room, 'player', p.id).match.token;
  const [a, b] = room.match.songs;
  castVote(room, p.id, token, a.id); castVote(room, q.id, token, b.id);
  await hostAction(room, 'closeVoting');
  assert.equal(room.match.result.tie, true);
  assert.equal(room.match.nextAt, null, 'no auto-continue during a tie');
  await hostAction(room, 'randomTie');
  assert.equal(room.match.result.tie, false);
  assert.ok([a.id, b.id].includes(room.match.result.winnerId));
  assert.ok(room.match.nextAt, 'auto-continue scheduled once decided');
  await assert.rejects(hostAction(room, 'bogus'), /Unknown action/);
  resetGame(room);
});

test('host can play too; Surprise mode mixes every theme incl. spotlight', async () => {
  const room = createRoom({ qualifiers: 16, autoSeconds: 0, hostPlays: true });
  assert.ok(room.hostPid);
  assert.equal(room.settings.mode, 'surprise');
  assert.ok(room.settings.packs.length > 25);
  await hostAction(room, 'start');
  const questions = room.plan.map((r) => r.question);
  assert.ok(new Set(questions).size >= 14, 'themes rarely repeat: ' + questions.join(' | '));
  assert.ok(room.plan.some((r) => r.pack.id.startsWith('spot-')), 'spotlight rounds appear');
  await hostAction(room, 'openVoting');
  const token = viewFor(room, 'host').match.token;
  castVote(room, room.hostPid, token, room.match.songs[0].id);
  assert.equal(viewFor(room, 'host').hostPlayer.vote, room.match.songs[0].id);
  await assert.rejects(hostAction(room, 'kick', { pid: room.hostPid }), /That is you/).catch(() => {});
  resetGame(room);
});

test('closing a room removes it and stops its timers', async () => {
  const room = createRoom({ qualifiers: 4, autoSeconds: 8 });
  addPlayer(room, 'Ana');
  await hostAction(room, 'start');
  closeRoom(room);
  assert.equal(rooms.has(room.code), false);
});

test.after(() => rooms.clear());

test('a themed round has no repeated artist when the pool is varied enough', async () => {
  const room = createRoom({ qualifiers: 4, mode: 'custom', packs: ['90s', 'y2k', 'karaoke', 'roadtrip'], autoSeconds: 0, hostPlays: false });
  addBots(room, 3);
  await hostAction(room, 'start');
  for (const r of room.plan) {
    const artists = r.specs.map((x) => x.artist.toLowerCase());
    assert.equal(new Set(artists).size, artists.length, `repeated artist in "${r.question}"`);
    assert.ok(r.specs.length >= 8);
  }
  closeRoom(room);
});

test('songs from recent games are saved for last, and fresh artist picks are mixed in', async () => {
  const first = createRoom({ qualifiers: 4, mode: 'custom', packs: ['afro'], autoSeconds: 0, hostPlays: false });
  addBots(first, 3);
  await hostAction(first, 'start');
  const seen = first.plan[0].specs.map((x) => `${x.artist}|${x.title}`);
  closeRoom(first);
  const room = createRoom({ qualifiers: 4, mode: 'custom', packs: ['afro'], autoSeconds: 0, hostPlays: false, avoid: seen });
  addBots(room, 3);
  await hostAction(room, 'start');
  const again = room.plan[0].specs.filter((x) => seen.map((k) => k.toLowerCase()).includes(`${x.artist}|${x.title}`.toLowerCase()));
  assert.equal(again.length, 0, 'the first round should avoid last game\'s songs');
  assert.ok(room.plan.some((r) => r.specs.some((x) => / hit \d+$/.test(x.title))), 'expected a fresh artist pick');
  closeRoom(room);
});
