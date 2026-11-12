import { $, esc, api, cover, connect } from './shared.js';

const app = $('#app');
let session = JSON.parse(localStorage.getItem('aux-host') || 'null'); // {code, key}
let s = null;           // latest server state
let info = { urls: [], port: 3000 };
let meta = { packs: [], qualifiers: [] };
let form = { packs: null, qualifiers: 8, autoSeconds: 12, voteSeconds: 0 };
let err = '';
let es = null;
const audio = new Audio();
audio.volume = 1;
let lastPlayKey = '';
let blocked = false;
let tick = null;

const call = (action, extra = {}) => api('/api/host', { code: session.code, key: session.key, action, ...extra }).catch((e) => { err = e.message; render(); });

// ---------- audio ----------
function syncAudio() {
  const m = s?.match;
  if (!m || !['reveal', 'voting'].includes(s.phase)) { audio.pause(); lastPlayKey = ''; return; }
  const k = `${m.token}:${m.nowPlaying}:${m.playNonce}`;
  if (k === lastPlayKey) return;
  lastPlayKey = k;
  const song = m.songs.find((x) => x.id === m.nowPlaying);
  if (!song?.preview) { audio.pause(); return; }
  audio.src = song.preview;
  audio.play().then(() => { blocked = false; }).catch(() => { blocked = true; render(); });
}

// ---------- rendering ----------
function joinUrl() {
  const base = info.urls[0] || location.origin;
  return `${base}/join?room=${s.code}`;
}

function render() {
  if (!session || !s) return renderSetup();
  const parts = { lobby: renderLobby, loading: renderLoading, reveal: renderMatch, voting: renderMatch, results: renderMatch, champion: renderChampion }[s.phase];
  const prog = s.progress ? `<span class="progress">Match ${s.progress.n} of ${s.progress.of}</span>` : '';
  app.innerHTML = `
    <div class="topbar"><span class="logo">AUX WARS</span>${prog}
      <span class="progress">Room <b>${esc(s.code)}</b> · ${s.players.length} player${s.players.length === 1 ? '' : 's'}</span></div>
    ${blocked ? '<div class="banner" data-act="unmute">🔇 Your browser blocked sound. Click here to enable audio.</div>' : ''}
    ${err ? `<div class="err">${esc(err)}</div>` : ''}
    ${parts()}`;
  err = '';
}

function renderSetup() {
  if (!meta.packs.length) { app.innerHTML = '<div class="loading"><div><div class="spinner"></div></div></div>'; return; }
  if (!form.packs) form.packs = meta.packs.filter((p) => !p.live).map((p) => p.id);
  const on = (id) => form.packs.includes(id);
  const opt = (key, val, label) => `<button class="chip ${form[key] === val ? 'on' : ''}" data-act="set" data-key="${key}" data-val="${val}">${label}</button>`;
  const need = form.qualifiers * 8;
  app.innerHTML = `
    <div class="setup">
      <div><span class="logo" style="font-size:1.6rem">AUX WARS</span><h2 style="margin-top:14px">Set up the game</h2></div>
      ${err ? `<div class="err">${esc(err)}</div>` : ''}
      <div class="panel"><h3>Themes · each round asks a different question</h3>
        <div class="chips">${meta.packs.map((p) => `<button class="pack ${on(p.id) ? 'on' : ''}" data-act="pack" data-id="${p.id}"><b>${p.emoji} ${esc(p.name)}${p.live ? ' · live' : ''}</b><small>${esc(p.desc)}</small></button>`).join('')}</div>
        <p class="muted" style="margin-top:12px">Songs never repeat in a game. This game needs ${need} different songs. Live charts need an internet connection.</p></div>
      <div class="panel"><h3>Game length</h3><div class="chips">
        ${meta.qualifiers.map((x) => opt('qualifiers', x.q, `${x.q} qualifying rounds → ${x.total} matches`)).join('')}</div></div>
      <div class="panel"><h3>Reveal speed · seconds of music per song</h3><div class="chips">
        ${opt('autoSeconds', 0, 'Manual')}${opt('autoSeconds', 8, '8s')}${opt('autoSeconds', 12, '12s')}${opt('autoSeconds', 20, '20s')}</div></div>
      <div class="panel"><h3>Voting timer</h3><div class="chips">
        ${opt('voteSeconds', 0, 'No timer')}${opt('voteSeconds', 30, '30s')}${opt('voteSeconds', 60, '60s')}</div></div>
      <div><button class="btn primary big" data-act="create">Create room →</button></div>
    </div>`;
}

function renderLobby() {
  const url = joinUrl();
  const local = !info.urls.length;
  return `<div class="lobby">
    <div><div class="qr"><img alt="Join QR code" src="/api/qr?text=${encodeURIComponent(url)}"></div>
      <div class="roomcode logo">${esc(s.code)}</div>
      <div class="joinurl">${esc(url.replace('http://', ''))}</div>
      ${local ? '<p class="muted" style="margin-top:10px">No Wi-Fi network found. Phones can’t join until this computer is online.</p>' : '<p class="muted" style="margin-top:10px">Phones must be on the same Wi-Fi.</p>'}</div>
    <div><h2 style="font-size:2.4rem">Waiting for players…</h2>
      <div class="players">${s.players.map((p) => `<span class="chip">${esc(p.name)}${p.bot ? '' : ''} <button class="chip small" data-act="kick" data-pid="${p.id}" title="Remove">✕</button></span>`).join('') || '<span class="muted">Nobody yet. Scan the code!</span>'}</div>
      ${s.error ? `<div class="err" style="margin-bottom:16px">${esc(s.error)}</div>` : ''}
      <div class="chips"><button class="btn primary big" data-act="start" ${s.players.length ? '' : 'disabled'}>Start game</button>
        <button class="btn" data-act="bots">+ Add 3 test players 🤖</button></div>
      <p class="muted" style="margin-top:18px">${s.settings.qualifiers} qualifying rounds, then a ${s.settings.qualifiers}-song knockout · ${s.settings.autoSeconds ? s.settings.autoSeconds + 's per song' : 'manual reveals'}${s.settings.voteSeconds ? ' · ' + s.settings.voteSeconds + 's voting' : ''}</p>
    </div></div>`;
}

function renderLoading() {
  const l = s.loading || {};
  return `<div class="loading"><div><div class="spinner"></div><div class="heading"><small>${esc(l.label || '')}</small><h2>${esc(l.question || 'Loading…')}</h2></div></div></div>`;
}

function card(song, i, m) {
  const res = m.result?.tallies?.[song.id];
  const win = m.result?.winnerId === song.id;
  const tied = m.result?.tiedIds?.includes(song.id);
  const playing = m.nowPlaying === song.id && s.phase !== 'results';
  const cls = ['card', playing ? 'playing' : '', win ? 'winner' : '', tied ? 'tied' : '', m.result && !win && !tied ? 'dim' : ''].join(' ');
  const noPrev = !song.hasPreview ? '<span class="badge">no preview</span>' : '';
  const badge = win ? '<span class="badge crown">👑 WINNER</span>' : tied ? '<span class="badge">TIED</span>' : noPrev;
  const eq = playing ? '<span class="eq"><i></i><i></i><i></i></span>' : '';
  const result = res ? `<div class="pct">${res.pct}%</div><div class="bar"><div style="width:${res.pct}%"></div></div>
      <div class="voters">${res.voters.map((n) => `<span class="chip small">${esc(n)}</span>`).join('')}</div>` : '';
  const tag = s.phase === 'results' ? 'div' : 'button';
  return `<${tag} class="${cls}" ${tag === 'button' ? `data-act="replay" data-id="${song.id}" title="Play this song"` : ''} style="animation-delay:${i * 50}ms">
    ${cover(song)}${badge}<div class="meta"><div class="t">${eq}${esc(song.title)}</div><div class="a">${esc(song.artist)}</div>${result}</div></${tag}>`;
}

function renderMatch() {
  const m = s.match;
  const two = m.total === 2;
  let cards = m.songs.map((x, i) => card(x, i, m)).join('');
  if (s.phase === 'reveal') for (let i = m.songs.length; i < m.total; i++) cards += `<div class="card"><div class="cover mystery">?</div><div class="meta"><div class="t">&nbsp;</div><div class="a">&nbsp;</div></div></div>`;
  let controls = '';
  if (s.phase === 'reveal') {
    const last = m.revealed >= m.total;
    controls = `<button class="btn primary big" data-act="reveal">${last ? 'Open voting 🗳️' : 'Reveal next song ▶'}</button>
      ${!last ? '<button class="btn" data-act="openVoting">Skip to voting</button>' : ''}
      <span class="muted">${s.settings.autoSeconds ? 'Auto-reveal on · ' : ''}Click a song to replay it</span>`;
  } else if (s.phase === 'voting') {
    const voted = s.players.filter((p) => p.voted).length;
    controls = `<div class="votestatus"><span class="count">${voted}/${s.players.length} voted</span>
      ${s.players.map((p) => `<span class="chip small ${p.voted ? 'voted' : ''}">${p.voted ? '✓ ' : ''}${esc(p.name)}</span>`).join('')}</div>
      <span class="grow"></span>${m.deadline ? '<span class="timer" id="timer"></span>' : ''}
      <button class="btn primary big" data-act="closeVoting">Reveal results</button>`;
  } else if (s.phase === 'results') {
    const r = m.result;
    controls = r.tie
      ? `<span class="count">🤝 It’s a tie!</span><span class="grow"></span><button class="btn primary big" data-act="tiebreak">Tiebreak vote</button>`
      : `<span class="count">${r.noVotes ? 'Nobody voted, so a song was picked at random.' : ''}</span><span class="grow"></span><button class="btn primary big" data-act="next">${s.progress.n >= s.progress.of ? 'Crown the champion 👑' : 'Next →'}</button>`;
  }
  return `<div class="stage">
    <div class="heading"><small>${esc(m.label)}${m.tiebreak ? ' · TIEBREAK' : ''}</small><h2>${esc(m.question)}</h2></div>
    <div class="grid ${two || m.songs.length === 2 ? 'two' : ''}">${cards}</div>
    <div class="controls">${controls}</div></div>`;
}

function renderChampion() {
  const c = s.champion, st = s.stats;
  const stat = (t, body) => `<div class="panel stat"><small>${t}</small>${body}</div>`;
  const stats = [
    st.closestMatch && stat('Closest music match', `<b>${esc(st.closestMatch.a)} + ${esc(st.closestMatch.b)}</b>agreed on ${st.closestMatch.pct}% of votes`),
    st.mostDivided && stat('Most divided round', `<b>${esc(st.mostDivided.question)}</b>${esc(st.mostDivided.winner.title)} squeaked by with ${st.mostDivided.pct}%`),
    st.championFans.length && stat('Champion’s fan club', `<b>${st.championFans.map(esc).join(', ')}</b>voted for the winner in the final`),
  ].filter(Boolean).join('');
  return `<div class="champion"><div class="crown">👑</div><div class="heading"><small>The aux belongs to</small></div>
    <div class="card winner">${cover(c)}<div class="meta"><div class="t">${esc(c.title)}</div><div class="a">${esc(c.artist)}</div></div></div>
    ${stats ? `<div class="stats">${stats}</div>` : ''}
    <div class="panel path"><h3 class="muted" style="font-size:.85rem;text-transform:uppercase;letter-spacing:.08em">Qualifying winners</h3><ul style="padding:0">${s.path.map((p) => `<li><span>${esc(p.question)}</span><b>${esc(p.title)} · <span class="muted">${esc(p.artist)}</span></b></li>`).join('')}</ul></div>
    <button class="btn primary big" data-act="again">Play again</button></div>`;
}

function confetti() {
  const el = $('#confetti'); el.innerHTML = '';
  const colors = ['#ff3d81', '#ffb02e', '#2ee6a6', '#5aa9ff', '#fff'];
  for (let i = 0; i < 90; i++) {
    const p = document.createElement('i');
    p.style.cssText = `left:${Math.random() * 100}%;background:${colors[i % colors.length]};animation-duration:${2.5 + Math.random() * 3}s;animation-delay:${Math.random() * 1.5}s;transform:rotate(${Math.random() * 360}deg)`;
    el.appendChild(p);
  }
  setTimeout(() => (el.innerHTML = ''), 8000);
}

// ---------- events ----------
app.addEventListener('click', async (e) => {
  const t = e.target.closest('[data-act]');
  if (!t) return;
  const d = t.dataset;
  switch (d.act) {
    case 'set': form[d.key] = Number(d.val); renderSetup(); break;
    case 'pack': {
      const i = form.packs.indexOf(d.id);
      if (i >= 0) form.packs.splice(i, 1); else form.packs.push(d.id);
      renderSetup(); break;
    }
    case 'create':
      try {
        const r = await api('/api/create', form);
        session = { code: r.code, key: r.key };
        localStorage.setItem('aux-host', JSON.stringify(session));
        err = ''; open();
      } catch (x) { err = x.message; renderSetup(); }
      break;
    case 'start': audio.src = ''; audio.play().catch(() => {}); call('start'); break; // user gesture unlocks audio
    case 'bots': call('addBots', { count: 3 }); break;
    case 'kick': call('kick', { pid: d.pid }); break;
    case 'reveal': case 'openVoting': case 'closeVoting': case 'tiebreak': case 'next': call(d.act); break;
    case 'replay': audio.play().catch(() => {}); call('replay', { songId: d.id }); break;
    case 'unmute': blocked = false; lastPlayKey = ''; syncAudio(); render(); break;
    case 'again': localStorage.removeItem('aux-host'); await call('reset'); break;
  }
});

function open() {
  es?.close();
  es = connect(`/api/events?role=host&code=${session.code}&key=${session.key}`, (st) => {
    const prevPhase = s?.phase;
    s = st; render(); syncAudio();
    if (st.phase === 'champion' && prevPhase !== 'champion') confetti();
  }, () => { localStorage.removeItem('aux-host'); session = null; s = null; es?.close(); render(); }, session.code);
}

setInterval(() => {
  const el = $('#timer');
  if (el && s?.match?.deadline) el.textContent = `${Math.max(0, Math.ceil((s.match.deadline - Date.now()) / 1000))}s`;
}, 250);

(async () => {
  [info, meta] = await Promise.all([api('/api/info'), api('/api/packs')]);
  if (session) open(); else render();
})();
