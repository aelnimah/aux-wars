import { $, esc, api, cover, connect, morph, pchip, playerHue as hueOf } from './shared.js';

const app = $('#app');
let session = JSON.parse(localStorage.getItem('aux-host') || 'null'); // {code, key, hostPid}
let s = null;                       // latest server state
let info = { urls: [], port: 3000 };
let meta = { packs: [], qualifiers: [] };
let form = { qualifiers: 8, mode: 'surprise', packs: null, autoSeconds: 12, voteSeconds: 0, autoNext: 0, hostPlays: true, more: false };
let err = '', notice = '';
let es = null;
let animKey = '';                   // which results screen already played its bar animation
let blocked = false;                // browser refused to autoplay

// ---------- audio (host speakers) ----------
const audio = new Audio();
let vol = Number(localStorage.getItem('aux-vol') ?? 80) / 100;
let muted = localStorage.getItem('aux-muted') === '1';
let lastPlayKey = '', fade = null;
const target = () => (muted ? 0 : vol);
function ramp(to, ms, done) {
  clearInterval(fade);
  const from = audio.volume, steps = 10; let i = 0;
  fade = setInterval(() => {
    i++; audio.volume = Math.max(0, Math.min(1, from + ((to - from) * i) / steps));
    if (i >= steps) { clearInterval(fade); done?.(); }
  }, ms / steps);
}
function stopAudio() { if (!audio.paused) ramp(0, 250, () => audio.pause()); }
function syncAudio() {
  const m = s?.match;
  if (!m || !['reveal', 'voting'].includes(s.phase)) { stopAudio(); lastPlayKey = ''; return; }
  const k = `${m.token}:${m.nowPlaying}:${m.playNonce}`;
  if (k === lastPlayKey) return;
  lastPlayKey = k;
  const song = m.songs.find((x) => x.id === m.nowPlaying);
  if (!song?.preview) { stopAudio(); return; }
  clearInterval(fade);
  audio.src = song.preview;
  audio.volume = 0;
  audio.play().then(() => { blocked = false; ramp(target(), 400); }).catch(() => { blocked = true; render(); });
}
$('#vol').value = Math.round(vol * 100);
$('#mute').textContent = muted ? '🔇' : '🔊';
$('#vol').oninput = (e) => { vol = e.target.value / 100; localStorage.setItem('aux-vol', e.target.value); if (!muted) audio.volume = vol; };
$('#mute').onclick = toggleMute;
function toggleMute() {
  muted = !muted; localStorage.setItem('aux-muted', muted ? '1' : '0');
  $('#mute').textContent = muted ? '🔇' : '🔊'; audio.volume = target();
}

// ---------- helpers ----------
const call = (action, extra = {}) =>
  api('/api/host', { code: session.code, key: session.key, action, ...extra }).catch((e) => { err = e.message; render(); });

function estimate() {
  const secs = form.autoSeconds || 12, q = form.qualifiers;
  const qual = q * (4 + 8 * secs + 45), ko = (q - 1) * (4 + 2 * secs + 35);
  return Math.max(5, Math.round((qual + ko) / 60 / 5) * 5);
}
let addrIdx = 0;
const joinUrl = (base = info.urls[addrIdx] || info.urls[0] || location.origin) => `${base}/join?room=${s.code}`;

// Small groups tie constantly, so after one tiebreak (or a big tie in a small room) a random draw is the sensible default.
const preferDraw = (m) => m.tieCount >= 1 || (m.result.tiedIds.length >= 3 && s.players.length <= 4);

// What the big button (and Space/Enter) does right now.
function primary() {
  if (!s) return null;
  const m = s.match;
  switch (s.phase) {
    case 'lobby': return s.players.length ? { act: 'start', label: 'Start game' } : null;
    case 'intro': return { act: 'reveal', label: 'Skip intro ▶' };
    case 'reveal': return m.revealed >= m.total ? { act: 'reveal', label: 'Open voting 🗳️' } : { act: 'reveal', label: 'Reveal next song ▶' };
    case 'voting': return { act: 'closeVoting', label: 'Reveal results' };
    case 'results':
      if (m.result.tie) return preferDraw(m) ? { act: 'randomTie', label: '🎲 Random draw' } : { act: 'tiebreak', label: 'Tiebreak vote' };
      return { act: 'next', label: s.progress.n >= s.progress.of ? 'Crown the champion 👑' : 'Next →' };
    case 'champion': return { act: 'again', label: 'Play again' };
  }
  return null;
}

// ---------- rendering ----------
function render() {
  document.body.style.setProperty('--h', s?.match?.hue ?? 330);
  morph(app, !session || !s ? setupHtml() : shellHtml());
  postRender();
}

function postRender() {
  const k = s?.match && s.phase === 'results' ? `${s.match.token}` : '';
  if (k && animKey !== k) {
    animKey = k;
    requestAnimationFrame(() => requestAnimationFrame(() => document.querySelectorAll('[data-w]').forEach((el) => { el.style.width = `${el.dataset.w}%`; })));
  }
}

function shellHtml() {
  const body = { lobby: lobbyHtml, loading: loadingHtml, intro: introHtml, reveal: matchHtml, voting: matchHtml, results: matchHtml, champion: championHtml }[s.phase]();
  const p = s.progress;
  const prog = p ? `<div class="mid"><div class="progress"><span>${s.match?.kind === 'knockout' ? '⚔️ Knockout' : 'Qualifying'}</span><span>Match ${p.n} of ${p.of}</span></div><div class="track"><i style="width:${Math.round(((p.n - (s.phase === 'champion' ? 0 : 1)) / p.of) * 100)}%"></i></div></div>` : '<div></div>';
  return `<div class="topbar"><a class="logo" href="/" data-act="home" title="Main page">AUX WARS</a>${prog}<span class="roomtag">Room <b>${esc(s.code)}</b> · ${s.players.length} ${s.players.length === 1 ? 'player' : 'players'}
      <button class="chip small" data-act="home">⌂ Home</button><button class="chip small" data-act="end">End game</button></span></div>
    ${blocked ? '<div class="banner" data-act="unmute">🔇 Your browser blocked sound. Click anywhere here to turn it on.</div>' : ''}
    ${err ? `<div class="err" style="margin-bottom:14px">${esc(err)}</div>` : ''}
    <div class="screen" data-key="${s.match && ['intro', 'reveal', 'voting', 'results'].includes(s.phase) ? 'm' + s.match.token : s.phase}">${body}</div>`;
}

function setupHtml() {
  if (!meta.packs.length) return '<div class="loading"><div><div class="spinner"></div></div></div>';
  if (!form.packs) form.packs = meta.packs.filter((p) => !p.live).map((p) => p.id);
  const on = (id) => form.packs.includes(id);
  const chip = (key, val, label) => `<button class="chip ${form[key] === val ? 'on' : ''}" data-act="set" data-setting="${key}" data-val="${val}">${label}</button>`;
  const len = (q, name, blurb) => `<button class="opt-card ${form.qualifiers === q ? 'on' : ''}" data-act="set" data-setting="qualifiers" data-val="${q}"><b>${name}</b><small>${q} rounds + ${q - 1} knockout matches · ${blurb}</small></button>`;
  return `<div class="setup">
    <div><a class="logo" href="/" style="font-size:1.5rem">AUX WARS</a><h2 style="margin-top:14px">Let’s set up the game</h2></div>
    ${notice ? `<div class="banner">${esc(notice)}</div>` : ''}${err ? `<div class="err">${esc(err)}</div>` : ''}
    <div class="sec"><h3>How long?</h3><div class="row">${len(4, 'Quick', 'short and sweet')}${len(8, 'Classic', 'the full experience')}${len(16, 'Marathon', 'serious aux energy')}</div>
      <p class="est" style="margin-top:12px">Roughly <b>${estimate()} minutes</b> with these settings.</p></div>
    <div class="sec"><h3>What are we voting on?</h3><div class="row">
      <button class="opt-card ${form.mode === 'surprise' ? 'on' : ''}" data-act="set" data-setting="mode" data-val="surprise"><b>🎲 Surprise me</b><small>Every round gets a random theme: pregame, breakup songs, Afrobeats, a random artist’s best… nobody picks.</small></button>
      <button class="opt-card ${form.mode === 'custom' ? 'on' : ''}" data-act="set" data-setting="mode" data-val="custom"><b>🎛️ I’ll choose</b><small>Pick exactly which themes can show up.</small></button></div></div>
    ${form.mode === 'custom' ? `<div class="sec"><h3>Themes · ${form.packs.length} picked <button class="chip small" data-act="allpacks">all</button> <button class="chip small" data-act="nopacks">none</button></h3>
      <div class="row">${meta.packs.map((p) => `<button class="pack ${on(p.id) ? 'on' : ''}" data-key="${p.id}" data-act="pack" data-id="${p.id}"><b>${p.emoji} ${esc(p.name)}${p.live ? ' · live' : ''}</b><small>${esc(p.desc)}</small></button>`).join('')}</div>
      <p class="note" style="margin-top:10px">Need ${form.qualifiers * 8} different songs. “Live” themes pull from the internet.</p></div>` : ''}
    <div class="sec"><button class="chip" data-act="more">${form.more ? '▾' : '▸'} Pace &amp; options</button></div>
    ${form.more ? `<div class="panel" style="display:grid;gap:22px">
      <div class="sec"><h3>Music per song (auto-reveal)</h3><div class="row">${chip('autoSeconds', 0, 'Manual')}${chip('autoSeconds', 8, '8 sec')}${chip('autoSeconds', 12, '12 sec')}${chip('autoSeconds', 20, '20 sec')}</div></div>
      <div class="sec"><h3>Voting timer</h3><div class="row">${chip('voteSeconds', 0, 'No timer')}${chip('voteSeconds', 30, '30 sec')}${chip('voteSeconds', 60, '60 sec')}</div></div>
      <div class="sec"><h3>After results</h3><div class="row">${chip('autoNext', 0, 'Wait for me')}${chip('autoNext', 6, 'Continue after 6 sec')}${chip('autoNext', 10, 'Continue after 10 sec')}</div></div>
      <div class="sec"><h3>You</h3><div class="row"><button class="chip ${form.hostPlays ? 'on' : ''}" data-act="toggle" data-setting="hostPlays">${form.hostPlays ? '✓' : ''} I’m playing too (vote from this screen)</button></div></div></div>` : ''}
    <div><button class="btn primary big" data-act="create">Create room →</button></div></div>`;
}

function lobbyHtml() {
  const url = joinUrl();
  const alt = info.urls.slice(1);
  return `<div class="lobby">
    <div><div class="qr"><img alt="Join QR code" src="/api/qr?text=${encodeURIComponent(url)}"></div>
      <div class="roomcode logo">${esc(s.code)}</div>
      <div class="joinurl">${esc(url.replace('http://', ''))}</div>
      <p class="note" style="margin-top:10px">${info.urls.length ? 'Phones must be on the same Wi-Fi as this computer.' : '⚠️ No Wi-Fi network found. Phones can’t join until this computer is online.'}</p>
      ${info.urls.length > 1 ? `<div class="addrs"><span class="muted">Phone can’t open it? Pick another address:</span><div class="row" style="gap:8px;margin-top:8px">${info.urls.map((u, i) => `<button class="chip small ${i === addrIdx ? 'on' : ''}" data-act="addr" data-i="${i}">${esc(u.replace('http://', ''))}${info.names?.[i] ? ` <span class="muted">· ${esc(info.names[i])}</span>` : ''}</button>`).join('')}</div></div>` : ''}
      <p class="note" style="margin-top:8px">Still stuck? Windows may be blocking Node. Allow it on Private networks when the firewall pops up.</p>
      <button class="btn small" style="margin-top:12px" data-act="copy">📋 Copy join link</button></div>
    <div><h2>${s.players.length ? `${s.players.length} in the room` : 'Waiting for players…'}</h2>
      <div class="players">${s.players.map((p) => `<span class="chip pl big ${p.online ? '' : 'off'}" data-key="${p.id}" style="--ph:${hueOf(p.name)}"><i class="dot"></i>${p.host ? '🎧 ' : ''}${esc(p.name)}${p.host ? '' : ` <button class="chip small x" data-act="kick" data-pid="${p.id}" title="Remove">✕</button>`}</span>`).join('') || '<span class="muted">Nobody yet. Scan the code!</span>'}</div>
      ${s.error ? `<div class="err" style="margin-bottom:16px">${esc(s.error)}</div>` : ''}
      <div class="row"><button class="btn primary big" data-act="start" ${s.players.length ? '' : 'disabled'}>Start game <kbd>Space</kbd></button>
        <button class="btn" data-act="bots">+ Add 3 test players 🤖</button></div>
      <p class="note" style="margin-top:16px">${s.settings.qualifiers} rounds · ${s.settings.mode === 'surprise' ? 'random themes' : s.settings.packs.length + ' themes'} · ${s.settings.autoSeconds ? s.settings.autoSeconds + ' sec of music per song' : 'manual reveals'}${s.settings.voteSeconds ? ' · ' + s.settings.voteSeconds + ' sec voting' : ''}</p>
      <div class="how"><div><b>1 · Listen</b>Songs are revealed one at a time</div><div><b>2 · Vote</b>Pick your favorite on your phone</div><div><b>3 · Survive</b>Winners fight in a knockout</div></div></div></div>`;
}

const loadingHtml = () => `<div class="loading"><div><div class="spinner"></div><div class="heading"><small>${esc(s.loading?.label || '')}</small><h2>${esc(s.loading?.question || 'Loading…')}</h2></div></div></div>`;

function introHtml() {
  const m = s.match;
  return `<div class="intro" data-key="intro-${m.token}"><div class="em">${m.emoji}</div><small>${esc(m.label)}</small><h1>${esc(m.question)}</h1>
    <div><button class="btn" data-act="reveal">Skip ▶</button></div></div>`;
}

function cardHtml(song, i, m, mode) {
  const res = m.result?.tallies?.[song.id];
  const win = m.result?.winnerId === song.id, tied = m.result?.tiedIds?.includes(song.id);
  const playing = m.nowPlaying === song.id && s.phase !== 'results';
  const mine = s.hostPlayer?.vote === song.id && s.phase === 'voting';
  const cls = ['card', s.phase !== 'results' ? 'clickable' : '', playing ? 'playing' : '', win ? 'winner' : '', tied ? 'tied' : '', mine ? 'mine' : '', m.result && !win && !tied ? 'dim' : ''].join(' ');
  const badge = win ? '<span class="badge crown">👑 WINNER</span>' : tied ? '<span class="badge">TIED</span>' : !song.hasPreview ? '<span class="badge">no preview</span>' : '';
  const hv = s.phase === 'voting' && s.hostPlayer ? `<button class="hostvote ${mine ? 'on' : ''}" data-act="hostvote" data-id="${song.id}">${mine ? '✓ Your vote' : 'Vote'}</button>` : '';
  const eq = playing ? '<span class="eq"><i></i><i></i><i></i></span>' : '';
  const from = song.from && m.kind === 'knockout' ? `<span class="from">👑 ${esc(song.from)}</span>` : '';
  let result = '';
  if (res) {
    const w = animKey === m.token ? res.pct : 0;
    result = `<div class="res"><div class="pct">${res.pct}%</div><div class="bar"><div data-w="${res.pct}" style="width:${w}%"></div></div>
      <div class="voters">${res.voters.map((n) => pchip(n, 'small')).join('')}</div></div>`;
  }
  return `<div class="${cls}" data-key="${song.id}" data-flip ${s.phase !== 'results' ? `role="button" tabindex="0" data-act="replay" data-id="${song.id}" title="Replay this song"` : ''} style="animation-delay:${i * 60}ms">
    ${hv}${badge}${cover(song)}<div class="meta"><div class="t">${eq}${esc(song.title)}</div><div class="a">${esc(song.artist)}</div>${from}${result}</div></div>`;
}

function matchHtml() {
  const m = s.match, versus = m.total === 2;
  // in results, rank by votes (stable), so the winner lands first and the rest slide into order
  const ordered = s.phase === 'results' && m.result ? [...m.songs].sort((a, b) => m.result.tallies[b.id].n - m.result.tallies[a.id].n) : m.songs;
  const cards = ordered.map((x, i) => cardHtml(x, i, m)).join('');
  let slots = '';
  if (s.phase === 'reveal') for (let i = m.songs.length; i < m.total; i++) slots += `<div class="card" data-key="slot-${m.token}-${i}"><div class="cover mystery">?</div><div class="meta"><div class="t">&nbsp;</div><div class="a">&nbsp;</div></div></div>`;
  const body = versus
    ? `<div class="versus">${m.songs[0] ? cardHtml(m.songs[0], 0, m) : slots}<div class="vs">VS</div>${m.songs[1] ? cardHtml(m.songs[1], 1, m) : slots}</div>`
    : `<div class="grid">${cards}${slots}</div>`;
  const p = primary();
  const big = (cls = '') => `<button class="btn primary big ${cls}" data-act="${p.act}">${p.label} <kbd>Space</kbd></button>`;
  let controls = '', bar = '';
  if (s.phase === 'reveal') {
    const last = m.revealed >= m.total;
    if (s.settings.autoSeconds) bar = `<div class="timerbar ${s.paused ? 'paused' : ''}"><i data-next="${m.nextAt || ''}" data-total="${s.settings.autoSeconds * 1000}" style="width:${m.nextAt ? 100 : 0}%"></i></div>`;
    controls = `${big()}${!last ? '<button class="btn" data-act="openVoting">Skip to voting</button>' : ''}
      ${s.settings.autoSeconds ? `<button class="btn" data-act="${s.paused ? 'resume' : 'pause'}">${s.paused ? '▶ Resume auto' : '⏸ Pause auto'}</button>` : ''}
      <span class="note">${s.paused ? 'Paused. ' : ''}Click any song to replay it.</span>`;
  } else if (s.phase === 'voting') {
    const voted = s.players.filter((x) => x.voted).length, all = s.players.filter((x) => x.online).every((x) => x.voted);
    controls = `<div class="votestatus"><span class="count">${all ? '✅ Everyone voted!' : `${voted}/${s.players.length} voted`}</span>
      ${s.players.map((x) => pchip(x.name, `small ${x.voted ? 'voted' : ''} ${x.online ? '' : 'off'}`, x.id).replace('</span>', x.voted ? ' ✓</span>' : x.online ? '</span>' : ' · offline</span>')).join('')}</div>
      <span class="grow"></span>${m.deadline ? `<span class="timer" data-deadline="${m.deadline}">&nbsp;</span>` : ''}${big(all ? 'pulse' : '')}`;
  } else if (s.phase === 'results') {
    const r = m.result;
    const note = r.tie ? `🤝 It’s a tie! ${preferDraw(m) ? 'Let fate decide?' : ''}` : r.drawn ? '🎲 Settled by random draw' : r.noVotes ? 'Nobody voted, so a song was picked at random.' : '';
    const tieBtns = r.tie ? (preferDraw(m) ? `<button class="btn" data-act="tiebreak">Another tiebreak vote</button>` : `<button class="btn" data-act="randomTie">🎲 Random draw</button>`) : '';
    controls = `<span class="count">${note}</span><span class="grow"></span>${m.nextAt && !r.tie ? `<span class="timer" data-until="${m.nextAt}">&nbsp;</span>` : ''}${tieBtns}${big()}`;
  }
  return `<div class="stage"><div class="heading"><small>${esc(m.label)}${m.tiebreak ? ` · TIEBREAK${m.tieCount > 1 ? ' #' + m.tieCount : ''}` : ''}</small><h2>${esc(m.question)}</h2></div>
    ${bar}${body}<div class="controls">${controls}</div></div>`;
}

function championHtml() {
  const c = s.champion, st = s.stats;
  const stat = (t, body) => `<div class="panel stat"><small>${t}</small>${body}</div>`;
  const stats = [
    st.closestMatch && stat('Closest music match', `<b>${esc(st.closestMatch.a)} + ${esc(st.closestMatch.b)}</b>agreed on ${st.closestMatch.pct}% of votes`),
    st.mostDivided && stat('Most divided round', `<b>${esc(st.mostDivided.question)}</b>${esc(st.mostDivided.winner.title)} squeaked by with ${st.mostDivided.pct}%`),
    st.championFans.length && stat('Champion’s fan club', `<b>${st.championFans.map(esc).join(', ')}</b>voted for the winner in the final`),
  ].filter(Boolean).join('');
  return `<div class="champion"><div class="crown">👑</div><div class="heading"><small>The aux belongs to</small></div>
    <div class="card winner">${cover(c)}<div class="meta"><div class="t" style="font-size:1.6rem">${esc(c.title)}</div><div class="a">${esc(c.artist)}</div></div></div>
    ${stats ? `<div class="stats">${stats}</div>` : ''}
    <div class="panel path"><h3 class="muted" style="font-size:.8rem;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">Qualifying winners</h3><ul style="padding:0">${s.path.map((p) => `<li><span>${esc(p.question)}</span><b>${esc(p.title)} · <span class="muted">${esc(p.artist)}</span></b></li>`).join('')}</ul></div>
    <button class="btn primary big" data-act="again">Play again <kbd>Space</kbd></button></div>`;
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

// ---------- actions ----------
async function perform(act, d = {}) {
  switch (act) {
    case 'set': form[d.setting] = d.setting === 'mode' ? d.val : Number(d.val); return render();
    case 'toggle': form[d.setting] = !form[d.setting]; return render();
    case 'more': form.more = !form.more; return render();
    case 'allpacks': form.packs = meta.packs.map((p) => p.id); return render();
    case 'nopacks': form.packs = []; return render();
    case 'pack': { const i = form.packs.indexOf(d.id); if (i >= 0) form.packs.splice(i, 1); else form.packs.push(d.id); return render(); }
    case 'create':
      try {
        const r = await api('/api/create', form);
        session = { code: r.code, key: r.key, hostPid: r.hostPid };
        localStorage.setItem('aux-host', JSON.stringify(session));
        err = ''; notice = ''; open();
      } catch (x) { err = x.message; render(); }
      return;
    case 'start': audio.play().catch(() => {}); return call('start'); // the click unlocks audio
    case 'bots': return call('addBots', { count: 3 });
    case 'kick': return call('kick', { pid: d.pid });
    case 'addr': addrIdx = Number(d.i) || 0; return render();
    case 'copy': try { await navigator.clipboard.writeText(joinUrl()); notice = ''; err = ''; } catch { /* ignore */ } return;
    case 'reveal': case 'openVoting': case 'closeVoting': case 'tiebreak': case 'randomTie': case 'next': case 'pause': case 'resume': return call(act);
    case 'replay': audio.play().catch(() => {}); return call('replay', { songId: d.id });
    case 'hostvote':
      return api('/api/vote', { code: session.code, pid: session.hostPid, token: s.match.token, songId: d.id }).catch((e) => { err = e.message; render(); });
    case 'unmute': blocked = false; lastPlayKey = ''; syncAudio(); return render();
    case 'home':
      if (s && !['lobby', 'champion'].includes(s.phase) && !confirm('Go to the main page? The game keeps running, and you can resume it from the main page.')) return;
      location.href = '/'; return;
    case 'end':
      if (!confirm('End this game for everyone? Players will be sent back to the main page.')) return;
      await api('/api/host', { code: session.code, key: session.key, action: 'close' }).catch(() => {});
      localStorage.removeItem('aux-host'); session = null; s = null; es?.close(); audio.pause(); return render();
    case 'again': return call('reset'); // back to the lobby with the same room and players
  }
}


app.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act]');
  if (!t || t.disabled) return;
  if (t.tagName === 'A') e.preventDefault();
  if (t.dataset.act === 'replay' && e.target.closest('[data-act=hostvote]')) return;
  perform(t.dataset.act, t.dataset);
});
document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === ' ' || e.key === 'Enter') {
    if (e.target.closest('[data-act]') && e.key === 'Enter') return; // let a focused button handle its own Enter
    const p = primary(); if (!p) return;
    e.preventDefault(); perform(p.act);
  } else if (e.key === 'p' && s?.phase === 'reveal' && s.settings.autoSeconds) perform(s.paused ? 'resume' : 'pause');
  else if (e.key === 'm') toggleMute();
});

function open() {
  es?.close();
  es = connect(`/api/events?role=host&code=${session.code}&key=${session.key}`, (st) => {
    const prev = s?.phase;
    s = st; render(); syncAudio();
    if (st.phase === 'champion' && prev !== 'champion') confetti();
  }, () => {
    localStorage.removeItem('aux-host'); session = null; s = null; es?.close();
    notice = 'That game has ended or the server restarted. Start a new one!'; render();
  }, session.code);
}

// live countdowns without re-rendering the page
setInterval(() => {
  const now = Date.now();
  const bar = document.querySelector('.timerbar > i');
  if (bar) { const nx = Number(bar.dataset.next), tot = Number(bar.dataset.total); if (nx) bar.style.width = `${Math.max(0, Math.min(100, ((nx - now) / tot) * 100))}%`; }
  const t1 = document.querySelector('[data-deadline]'); if (t1) t1.textContent = `${Math.max(0, Math.ceil((Number(t1.dataset.deadline) - now) / 1000))}s`;
  const t2 = document.querySelector('[data-until]'); if (t2) t2.textContent = `Next in ${Math.max(0, Math.ceil((Number(t2.dataset.until) - now) / 1000))}s`;
}, 200);

(async () => {
  [info, meta] = await Promise.all([api('/api/info'), api('/api/packs')]);
  if (session) open(); else render();
})();
