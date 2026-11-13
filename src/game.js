// Aux Wars game engine. Pure in-memory state machine; the server wires it to HTTP.
//
// Flow: lobby -> (loading -> reveal -> voting -> results [-> tiebreak voting]) x N qualifiers
//       -> knockout matches (same cycle, 2 songs each) -> champion.
//
// Invariants (do not break): votes stay hidden until results; only the host can drive
// the game; one changeable vote per player; stale votes (old round / old tiebreak) are rejected.

import crypto from 'node:crypto';
import { packById, FIXED_PACKS, ALL_PACKS, SPOTLIGHT_ARTISTS, hueOf } from './packs.js';
import { music as defaultMusic } from './music.js';

export class GameError extends Error {}
const fail = (msg) => { throw new GameError(msg); };

export const ROUND_SIZE = 8;
export const QUALIFIER_OPTIONS = [4, 8, 16];
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const ROOM_TTL_MS = 24 * 3600 * 1000;
const MAX_PLAYERS = 24;

export const rooms = new Map();
export const config = { music: defaultMusic, botDelay: [1200, 4500], introMs: 2500 }; // tests override

export const shuffle = (arr, rng = Math.random) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const rid = () => crypto.randomBytes(6).toString('hex');
const key = (artist, title) => `${artist}|${title}`.toLowerCase();

export const koLabel = (n) => (n === 2 ? 'Final' : n === 4 ? 'Semifinal' : n === 8 ? 'Quarterfinal' : `Round of ${n}`);
export const totalMatches = (q) => q + (q - 1);

// ---------- rooms & players ----------

export function createRoom(input = {}) {
  if (rooms.size >= 300) fail('Too many games are running right now. Try again in a few minutes.');
  const q = Number(input.qualifiers) || 8;
  if (!QUALIFIER_OPTIONS.includes(q)) fail('Pick 4, 8 or 16 qualifying rounds.');
  const auto = Number(input.autoSeconds ?? 12);
  if (![0, 8, 12, 20].includes(auto)) fail('Bad reveal speed.');
  const vote = Number(input.voteSeconds ?? 0);
  if (![0, 30, 60].includes(vote)) fail('Bad vote timer.');
  const autoNext = Number(input.autoNext ?? 0);
  if (![0, 6, 10].includes(autoNext)) fail('Bad auto-continue setting.');
  const mode = input.mode === 'custom' ? 'custom' : 'surprise';
  const picked = (Array.isArray(input.packs) ? input.packs : []).filter(packById);
  const packs = mode === 'surprise' ? ALL_PACKS : picked.length ? picked : FIXED_PACKS;
  if (!packs.length) fail('Pick at least one theme.');

  let code;
  do { code = Array.from({ length: 6 }, () => CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]).join(''); } while (rooms.has(code));
  const room = {
    code, hostKey: crypto.randomBytes(16).toString('hex'), createdAt: Date.now(),
    settings: { qualifiers: q, autoSeconds: auto, voteSeconds: vote, autoNext, mode, packs, hostPlays: !!input.hostPlays },
    players: new Map(), notify: null, timers: { reveal: null, vote: null, next: null, bots: [] },
  };
  resetGame(room);
  if (room.settings.hostPlays) room.hostPid = addPlayer(room, 'Host', { host: true }).id;
  rooms.set(code, room);
  return room;
}

export function resetGame(room) {
  clearTimers(room);
  room.gameId = (room.gameId || 0) + 1;
  room.phase = 'lobby';
  room.seq = 0;
  room.plan = [];
  room.roundPromises = [];
  room.qIndex = 0;
  room.qualifiers = [];
  room.ko = null;
  room.history = [];
  room.match = null;
  room.loading = null;
  room.champion = null;
  room.error = null;
  room.paused = false;
}

export function closeRoom(room) {
  clearTimers(room);
  room.gameId++;
  rooms.delete(room.code);
}

export function sweepRooms(now = Date.now()) {
  for (const [code, r] of rooms) if (now - r.createdAt > ROOM_TTL_MS) { clearTimers(r); rooms.delete(code); }
}

function clearTimers(room) {
  clearTimeout(room.timers.reveal); clearTimeout(room.timers.vote); clearTimeout(room.timers.next);
  room.timers.bots.forEach(clearTimeout);
  room.timers = { reveal: null, vote: null, next: null, bots: [] };
}
const emit = (room) => room.notify?.();

export function addPlayer(room, rawName, { bot = false, host = false } = {}) {
  if (room.players.size >= MAX_PLAYERS) fail('This room is full.');
  let name = String(rawName ?? '').replace(/\s+/g, ' ').trim().slice(0, 16);
  if (!name) fail('Pick a nickname.');
  const taken = new Set([...room.players.values()].map((p) => p.name.toLowerCase()));
  let n = name, i = 2;
  while (taken.has(n.toLowerCase())) n = `${name.slice(0, 13)} ${i++}`;
  const p = { id: rid(), name: n, bot, host, joinedAt: Date.now() };
  room.players.set(p.id, p);
  emit(room);
  return p;
}

const BOT_NAMES = ['Alex', 'Sam', 'Jordan', 'Riley', 'Casey', 'Taylor', 'Morgan', 'Jamie'];
export function addBots(room, count = 3) {
  const used = new Set([...room.players.values()].map((p) => p.name));
  const pool = BOT_NAMES.filter((n) => !used.has(`${n} 🤖`));
  for (let i = 0; i < count && pool.length; i++) addPlayer(room, `${pool.shift()} 🤖`, { bot: true });
}

// ---------- planning ----------

const EXTRA = 3; // extra candidates per round, so the least-known can be dropped

async function planGame(room) {
  const { qualifiers: q, packs } = room.settings;
  const pools = [];
  for (const id of packs) {
    const pack = packById(id);
    if (pack.spotlight) {
      // a few random artists, each its own "Best <artist> song?" round
      let made = 0;
      for (const name of shuffle(SPOTLIGHT_ARTISTS).slice(0, 10)) {
        if (made >= 3) break;
        const tracks = await config.music.spotlightTracks(name);
        if (tracks.length >= ROUND_SIZE) {
          pools.push({ pack: { id: `spot-${name}`, emoji: '🎯', question: `Best ${name} song?` }, specs: shuffle(tracks.slice(0, ROUND_SIZE + EXTRA)) });
          made++;
        }
      }
      continue;
    }
    const specs = pack.songs.map(([artist, title]) => ({ artist, title }));
    if (specs.length >= 4) pools.push({ pack, specs: shuffle(specs) });
  }
  if (!pools.length) fail('No songs available. Check your connection or pick other themes.');
  const used = new Set();
  // Take n unused songs from a pool. Variety first: one song per artist, then a second if the pool runs short.
  const take = (pool, n, have = []) => {
    const out = [];
    const count = (artist) => [...have, ...out].filter((x) => x.artist.toLowerCase() === artist.toLowerCase()).length;
    for (const cap of pool.pack.id.startsWith('spot-') ? [Infinity] : [1, 2, Infinity]) {
      for (let j = pool.specs.length - 1; j >= 0 && out.length < n; j--) {
        const sp = pool.specs[j], k = key(sp.artist, sp.title);
        if (used.has(k)) { pool.specs.splice(j, 1); continue; }
        if (count(sp.artist) >= cap) continue;
        used.add(k); out.push(sp); pool.specs.splice(j, 1);
      }
      if (out.length >= n) break;
    }
    return out;
  };
  const order = shuffle(pools);
  // Make sure a spotlight round shows up if one is available and the game is long enough.
  const spot = order.findIndex((pl) => pl.pack.id.startsWith('spot-'));
  if (spot >= q && q >= 8) { const at = Math.floor(Math.random() * q); [order[at], order[spot]] = [order[spot], order[at]]; }
  const plan = [];
  for (let i = 0; i < q; i++) {
    const pool = order[i % order.length];
    const specs = take(pool, ROUND_SIZE + EXTRA);
    // top up from the fullest other pools if this theme ran dry
    while (specs.length < ROUND_SIZE + EXTRA) {
      const other = [...order].sort((a, b) => b.specs.length - a.specs.length)[0];
      if (!other || !other.specs.length) break;
      specs.push(...take(other, ROUND_SIZE + EXTRA - specs.length, specs));
    }
    if (specs.length < ROUND_SIZE) fail(`Not enough songs for ${q} rounds. Pick more themes or fewer rounds.`);
    plan.push({ pack: pool.pack, question: pool.pack.question, specs: shuffle(specs) });
  }
  return plan;
}

async function resolveRound(room, i) {
  const { specs } = room.plan[i];
  const all = specs.map((s) => ({ id: `s${i}_${rid().slice(0, 4)}`, title: s.title, artist: s.artist, cover: null, preview: null, rank: -1 }));
  const queue = specs.map((s, idx) => idx);
  const worker = async () => {
    while (queue.length) {
      const idx = queue.shift();
      const spec = specs[idx];
      const r = spec.resolved || (await config.music.resolveTrack(spec.artist, spec.title)) || (await config.music.resolveTrack(spec.artist, spec.title));
      if (r) { all[idx].cover = r.cover || null; all[idx].preview = r.preview || null; all[idx].rank = r.rank ?? 0; }
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  // A few extra candidates are looked up so we can keep the best-known ones (Deezer popularity rank).
  const keep = all.map((s, idx) => ({ s, idx })).sort((a, b) => b.s.rank - a.s.rank || a.idx - b.idx).slice(0, ROUND_SIZE);
  return keep.sort((a, b) => a.idx - b.idx).map(({ s }) => { delete s.rank; return s; });
}
const roundSongs = (room, i) => (room.roundPromises[i] ||= resolveRound(room, i));

// ---------- match lifecycle ----------

function newMatch(room, fields) {
  return {
    seq: ++room.seq, vseq: 1, revealed: 0, candidates: null, votes: {}, result: null,
    nowPlaying: null, playNonce: 0, deadline: null, nextAt: null, emoji: '🎵', hue: 330, ...fields,
  };
}

function matchNumber(room) {
  const q = room.settings.qualifiers;
  return room.ko ? q + room.ko.done + 1 : room.qIndex + 1;
}

async function beginQualifying(room) {
  const gid = room.gameId, i = room.qIndex;
  room.phase = 'loading';
  room.match = null;
  room.loading = { label: `Round ${i + 1} of ${room.settings.qualifiers}`, question: room.plan[i].question };
  emit(room);
  const songs = await roundSongs(room, i);
  if (room.gameId !== gid) return;
  const pack = room.plan[i].pack;
  room.match = newMatch(room, { kind: 'qualifying', label: `Round ${i + 1} of ${room.settings.qualifiers}`, question: pack.question, emoji: pack.emoji, hue: hueOf(pack.id), songs });
  startIntro(room);
  if (i + 1 < room.plan.length) roundSongs(room, i + 1).catch(() => {});
}

function beginKnockout(room) {
  const ko = room.ko;
  const a = ko.current[ko.idx * 2], b = ko.current[ko.idx * 2 + 1];
  room.match = newMatch(room, {
    kind: 'knockout', label: koLabel(ko.current.length), emoji: '⚔️', hue: 350,
    question: `Match ${ko.idx + 1} of ${ko.current.length / 2}`, songs: [a, b],
  });
  startIntro(room);
}

function startKnockout(room) {
  let best = null, bestScore = Infinity;
  for (let t = 0; t < 60; t++) {
    const order = shuffle(room.qualifiers.map((w) => w.song));
    let clashes = 0;
    for (let i = 0; i < order.length; i += 2) if (order[i].artist === order[i + 1].artist) clashes++;
    if (clashes < bestScore) { best = order; bestScore = clashes; if (!clashes) break; }
  }
  room.ko = { current: best, next: [], idx: 0, done: 0 };
  beginKnockout(room);
}

// A short splash showing the round's question before the first song plays.
function startIntro(room) {
  room.loading = null;
  room.paused = false;
  if (!config.introMs) return startReveal(room);
  room.phase = 'intro';
  const gid = room.gameId, seq = room.match.seq;
  clearTimeout(room.timers.reveal);
  room.timers.reveal = setTimeout(() => {
    if (room.gameId === gid && room.match?.seq === seq && room.phase === 'intro') startReveal(room);
  }, config.introMs);
  emit(room);
}

function startReveal(room) {
  clearTimeout(room.timers.reveal);
  room.phase = 'reveal';
  revealNext(room);
}

// After each reveal, wait one listening window, then show the next song (or open voting).
function scheduleStep(room) {
  const m = room.match;
  clearTimeout(room.timers.reveal);
  m.nextAt = null;
  const secs = room.settings.autoSeconds;
  if (!(secs > 0) || room.paused) return;
  const gid = room.gameId, seq = m.seq;
  m.nextAt = Date.now() + secs * 1000;
  room.timers.reveal = setTimeout(() => {
    if (room.gameId !== gid || room.match?.seq !== seq || room.phase !== 'reveal' || room.paused) return;
    if (m.revealed < m.songs.length) revealNext(room); else openVoting(room);
  }, secs * 1000);
}

function revealNext(room) {
  const m = room.match;
  if (room.phase !== 'reveal' || m.revealed >= m.songs.length) return;
  m.revealed++;
  m.nowPlaying = m.songs[m.revealed - 1].id;
  m.playNonce++;
  scheduleStep(room);
  emit(room);
}

function openVoting(room) {
  const m = room.match;
  clearTimeout(room.timers.reveal);
  m.nextAt = null;
  room.phase = 'voting';
  m.revealed = m.songs.length;
  m.nowPlaying = null;
  m.candidates = m.songs.map((s) => s.id);
  startVote(room);
}

function startVote(room) {
  const m = room.match;
  m.votes = {};
  m.result = null;
  const secs = room.settings.voteSeconds;
  clearTimeout(room.timers.vote);
  m.deadline = secs > 0 ? Date.now() + secs * 1000 : null;
  if (secs > 0) {
    const gid = room.gameId, seq = m.seq, vseq = m.vseq;
    room.timers.vote = setTimeout(() => {
      if (room.gameId === gid && room.match?.seq === seq && room.match.vseq === vseq && room.phase === 'voting') closeVoting(room);
    }, secs * 1000);
  }
  // simulated players
  const gid = room.gameId, seq = m.seq, vseq = m.vseq;
  for (const p of room.players.values()) {
    if (!p.bot) continue;
    const [lo, hi] = config.botDelay;
    const t = setTimeout(() => {
      const cur = room.match;
      if (room.gameId !== gid || !cur || cur.seq !== seq || cur.vseq !== vseq || room.phase !== 'voting') return;
      cur.votes[p.id] = cur.candidates[Math.floor(Math.random() * cur.candidates.length)];
      emit(room);
    }, lo + Math.random() * (hi - lo));
    room.timers.bots.push(t);
  }
  emit(room);
}

export function castVote(room, pid, token, songId) {
  const m = room.match;
  if (!room.players.has(pid)) fail('Unknown player.');
  if (room.phase !== 'voting' || !m) fail('Voting is not open.');
  if (token !== `${m.seq}.${m.vseq}`) fail('That vote is for an earlier round.');
  if (!m.candidates.includes(songId)) fail('That song is not in this vote.');
  m.votes[pid] = songId;
  emit(room);
}

function closeVoting(room) {
  const m = room.match;
  clearTimeout(room.timers.vote);
  room.timers.bots.forEach(clearTimeout);
  const counts = Object.fromEntries(m.candidates.map((id) => [id, []]));
  for (const [pid, sid] of Object.entries(m.votes)) {
    const p = room.players.get(pid);
    if (p && counts[sid]) counts[sid].push(p.name);
  }
  const total = Object.values(counts).reduce((a, v) => a + v.length, 0);
  const max = Math.max(...Object.values(counts).map((v) => v.length));
  let winners = m.candidates.filter((id) => counts[id].length === max);
  const noVotes = total === 0;
  if (noVotes) winners = [winners[Math.floor(Math.random() * winners.length)]];
  const tie = winners.length > 1;
  const tallies = {};
  for (const id of m.candidates) tallies[id] = { n: counts[id].length, pct: total ? Math.round((counts[id].length / total) * 100) : 0, voters: counts[id] };
  m.result = { tallies, total, tie, tiedIds: tie ? winners : null, winnerId: tie ? null : winners[0], noVotes };
  m.deadline = null;
  room.phase = 'results';
  scheduleNext(room);
  emit(room);
}

// Optional: continue on its own a few seconds after a decided result.
function scheduleNext(room) {
  const m = room.match;
  clearTimeout(room.timers.next);
  m.nextAt = null;
  const secs = room.settings.autoNext;
  if (!secs || m.result.tie) return;
  const gid = room.gameId, seq = m.seq;
  m.nextAt = Date.now() + secs * 1000;
  room.timers.next = setTimeout(() => {
    if (room.gameId === gid && room.match?.seq === seq && room.phase === 'results' && !room.match.result.tie) advance(room);
  }, secs * 1000);
}

function advance(room) {
  const m = room.match;
  clearTimeout(room.timers.next);
  const winner = m.songs.find((s) => s.id === m.result.winnerId);
  if (m.kind === 'qualifying') winner.from = m.question; // shown on knockout cards
  const pct = m.result.tallies[winner.id].pct;
  room.history.push({
    kind: m.kind, label: m.label, question: m.question,
    songs: m.songs.map(({ id, title, artist }) => ({ id, title, artist })),
    votes: { ...m.votes }, winnerId: winner.id, winnerPct: pct, candidates: [...m.candidates],
  });
  if (m.kind === 'qualifying') {
    room.qualifiers.push({ song: winner, pct, question: m.question });
    room.qIndex++;
    return room.qIndex < room.plan.length ? beginQualifying(room) : startKnockout(room);
  }
  const ko = room.ko;
  ko.next.push(winner);
  ko.idx++; ko.done++;
  if (ko.idx * 2 >= ko.current.length) {
    if (ko.next.length === 1) {
      room.champion = winner;
      room.phase = 'champion';
      room.match = m; // keep final on screen for stats
      clearTimers(room);
      return emit(room);
    }
    ko.current = ko.next; ko.next = []; ko.idx = 0;
  }
  beginKnockout(room);
}

// ---------- host actions ----------

export async function hostAction(room, action, args = {}) {
  const m = room.match;
  switch (action) {
    case 'addBots':
      addBots(room, Math.min(Number(args.count) || 3, 8));
      return;
    case 'kick':
      if (room.phase !== 'lobby') fail('You can only remove players in the lobby.');
      if (args.pid === room.hostPid) fail('That is you!');
      room.players.delete(args.pid); emit(room); return;
    case 'start': {
      if (room.phase !== 'lobby') fail('Game already started.');
      if (!room.players.size) fail('Wait for at least one player (or add test players).');
      room.error = null;
      room.phase = 'loading';
      room.loading = { label: 'Building your lineup', question: 'Digging up tracks…' };
      emit(room);
      const gid = room.gameId;
      try {
        const plan = await planGame(room);
        if (room.gameId !== gid) return;
        room.plan = plan;
        await beginQualifying(room);
      } catch (e) {
        resetGame(room);
        room.error = e instanceof GameError ? e.message : 'Could not build the lineup.';
        emit(room);
        if (!(e instanceof GameError)) console.error(e);
      }
      return;
    }
    case 'reveal':
      if (room.phase === 'intro') return startReveal(room); // skip the splash
      if (room.phase !== 'reveal') fail('Not revealing right now.');
      if (m.revealed < m.songs.length) revealNext(room); else openVoting(room);
      return;
    case 'pause':
      if (room.phase !== 'reveal') fail('Nothing to pause.');
      room.paused = true; scheduleStep(room); emit(room); return;
    case 'resume':
      if (room.phase !== 'reveal') fail('Nothing to resume.');
      room.paused = false; scheduleStep(room); emit(room); return;
    case 'randomTie': {
      if (room.phase !== 'results' || !m.result.tie) fail('There is no tie to break.');
      const ids = m.result.tiedIds;
      m.result.winnerId = ids[Math.floor(Math.random() * ids.length)];
      m.result.tie = false; m.result.tiedIds = null; m.result.drawn = true;
      scheduleNext(room); emit(room); return;
    }
    case 'openVoting':
      if (room.phase !== 'reveal' && room.phase !== 'intro') fail('Voting can only open after a reveal.');
      return openVoting(room);
    case 'closeVoting':
      if (room.phase !== 'voting') fail('Voting is not open.');
      return closeVoting(room);
    case 'tiebreak':
      if (room.phase !== 'results' || !m.result.tie) fail('There is no tie to break.');
      m.candidates = m.result.tiedIds; m.vseq++; room.phase = 'voting';
      return startVote(room);
    case 'next':
      if (room.phase !== 'results' || m.result.tie) fail('Resolve the current round first.');
      return advance(room);
    case 'replay': {
      if (!['reveal', 'voting'].includes(room.phase)) fail('Nothing to replay.');
      const s = m.songs.find((x) => x.id === args.songId);
      if (!s) fail('Unknown song.');
      m.nowPlaying = s.id; m.playNonce++; emit(room); return;
    }
    case 'reset':
      resetGame(room); emit(room); return;
    default:
      fail('Unknown action.');
  }
}

// ---------- end-of-game stats ----------

export function computeStats(room) {
  const humans = [...room.players.values()].filter((p) => !p.bot);
  const group = humans.length >= 2 ? humans : [...room.players.values()];
  let match = null;
  for (let i = 0; i < group.length; i++) for (let j = i + 1; j < group.length; j++) {
    let both = 0, same = 0;
    for (const h of room.history) {
      const a = h.votes[group[i].id], b = h.votes[group[j].id];
      if (a && b) { both++; if (a === b) same++; }
    }
    if (both >= 3 && (!match || same / both > match.rate)) match = { a: group[i].name, b: group[j].name, rate: same / both, same, both };
  }
  const decided = room.history.filter((h) => h.kind === 'qualifying' && Object.keys(h.votes).length >= 2);
  const divided = decided.sort((x, y) => x.winnerPct - y.winnerPct)[0];
  const song = (h) => h.songs.find((s) => s.id === h.winnerId);
  const final = room.history[room.history.length - 1];
  const fans = final ? Object.entries(final.votes).filter(([, s]) => s === final.winnerId).map(([pid]) => room.players.get(pid)?.name).filter(Boolean) : [];
  return {
    closestMatch: match && { a: match.a, b: match.b, pct: Math.round(match.rate * 100) },
    mostDivided: divided && { question: divided.question, label: divided.label, winner: song(divided), pct: divided.winnerPct },
    championFans: fans,
  };
}

// ---------- views (what each client is allowed to see) ----------

const songView = (s, host) => ({ id: s.id, title: s.title, artist: s.artist, cover: s.cover, from: s.from || null, ...(host ? { preview: s.preview } : {}), hasPreview: !!s.preview });

export function viewFor(room, role, pid) {
  const host = role === 'host';
  const m = room.match;
  const v = {
    code: room.code, phase: room.phase, settings: room.settings, error: room.error, loading: room.loading,
    paused: room.paused,
    players: [...room.players.values()].map((p) => ({ id: p.id, name: p.name, bot: p.bot, host: p.host, online: p.bot || p.host || !room.online || room.online.has(p.id), voted: room.phase === 'voting' && !!m?.votes[p.id] })),
    progress: room.phase === 'lobby' ? null : { n: Math.min(matchNumber(room), totalMatches(room.settings.qualifiers)), of: totalMatches(room.settings.qualifiers) },
  };
  if (host && room.hostPid) v.hostPlayer = { id: room.hostPid, vote: m?.votes[room.hostPid] ?? null };
  if (!host) {
    const me = room.players.get(pid);
    v.me = me ? { id: me.id, name: me.name, vote: m?.votes[pid] ?? null } : null;
  }
  if (m && ['intro', 'reveal', 'voting', 'results', 'champion'].includes(room.phase)) {
    let songs;
    if (room.phase === 'intro') songs = [];
    else if (room.phase === 'reveal') songs = m.songs.slice(0, m.revealed);
    else songs = m.candidates ? m.songs.filter((s) => m.candidates.includes(s.id)) : m.songs;
    v.match = {
      kind: m.kind, label: m.label, question: m.question, emoji: m.emoji, hue: m.hue, token: `${m.seq}.${m.vseq}`, tiebreak: m.vseq > 1, tieCount: m.vseq - 1, nextAt: m.nextAt,
      total: m.songs.length, revealed: m.revealed, songs: songs.map((s) => songView(s, host)),
      nowPlaying: m.nowPlaying, playNonce: m.playNonce, deadline: m.deadline,
    };
    if (['results', 'champion'].includes(room.phase)) v.match.result = m.result; // votes become visible only now
  }
  if (room.phase === 'champion') {
    v.champion = songView(room.champion, host);
    v.stats = computeStats(room);
    v.path = room.qualifiers.map((w) => ({ question: w.question, title: w.song.title, artist: w.song.artist }));
  }
  return v;
}
