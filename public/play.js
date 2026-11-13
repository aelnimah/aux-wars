import { store, $, esc, api, cover, connect, morph, pchip } from './shared.js';

const app = $('#app');
const params = new URLSearchParams(location.search);
let code = (params.get('room') || '').toUpperCase();
let me = null;           // {pid, name}
let s = null;
let err = '';
let es = null;
let animKey = '';

const saved = () => { const x = store.json('aux-player'); return x && x.code === code ? x : null; };

// keep the screen awake during the game
let wake = null;
async function keepAwake() { try { wake = await navigator.wakeLock?.request('screen'); } catch { /* not supported */ } }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && me) keepAwake(); });

function joinHtml() {
  return `<div class="center"><a class="logo" href="/">Aux Wars</a>
    ${err ? `<div class="err">${esc(err)}</div>` : ''}
    <input type="text" id="code" class="code-input" placeholder="Room code" maxlength="6" aria-label="Room code" value="${esc(code)}" autocapitalize="characters" autocomplete="off">
    <input type="text" id="name" placeholder="Your name" maxlength="16" autocomplete="nickname" aria-label="Your name" value="${esc(store.get('aux-name') || '')}">
    <button class="btn primary big" data-act="join">Join game</button></div>`;
}

const row = (x, cls = '', { tag = 'div', act = '', right = '' } = {}) =>
  `<${tag} class="optrow ${cls}" data-key="${x.id}" ${act}>${cover(x)}<div class="txt"><div class="t">${esc(x.title)}</div><div class="a">${esc(x.artist)}</div></div>${right}</${tag}>`;
// The status bar is rendered outside the animated screen so it stays pinned to the bottom of the phone.
let barHtml = '';
const bar = (t) => { barHtml = `<div class="stickybar">${t}</div>`; return ''; };

function gameHtml() {
  const m = s.match;
  let body = '';
  barHtml = '';
  switch (s.phase) {
    case 'lobby':
      body = `<div class="center"><div class="em">🎧</div><h2>You’re in, ${esc(s.me.name)}!</h2><p class="muted">Waiting for the host to start. Keep an eye on the big screen.</p>
        <div class="players" style="justify-content:center">${s.players.map((p) => pchip(p.name, '', p.id)).join('')}</div>
        <button class="btn small" data-act="leave">Leave game</button></div>`;
      break;
    case 'loading':
      body = `<div class="center"><div class="spinner"></div><h2>${esc(s.loading?.question || 'Loading…')}</h2><p class="muted">${esc(s.loading?.label || '')}</p></div>`;
      break;
    case 'intro':
      body = `<div class="center" data-key="intro-${m.token}"><div class="em">${m.emoji}</div><p class="muted" style="font-weight:800;letter-spacing:.14em;text-transform:uppercase">${esc(m.label)}</p><h2 style="font-size:2.6rem">${esc(m.question)}</h2></div>`;
      break;
    case 'reveal':
      body = `<div class="heading"><small class="muted">${esc(m.label)}</small><h2>${esc(m.question)}</h2></div>
        <p class="muted" style="margin:8px 0 18px">🔊 Listen to the speakers. Voting opens soon.</p>
        ${m.songs.map((x) => row(x, m.nowPlaying === x.id ? 'playing' : '', { right: m.nowPlaying === x.id ? '<span class="eq"><i></i><i></i><i></i></span>' : '' })).join('')}
        ${bar(`${m.revealed} of ${m.total} revealed`)}`;
      break;
    case 'voting': {
      const mine = s.me.vote, voted = s.players.filter((p) => p.voted).length;
      body = `<div class="heading"><small class="muted">${esc(m.label)}${m.tiebreak ? ' · TIEBREAK' : ''}</small><h2>${esc(m.question)}</h2></div>
        <p class="muted" style="margin:8px 0 18px">${mine ? 'Locked in. Tap another to change your mind.' : 'Tap your favorite.'}</p>
        ${m.songs.map((x) => row(x, x.id === mine ? 'sel' : '', { tag: 'button', act: `data-act="vote" data-id="${x.id}"`, right: `<span class="tick">${x.id === mine ? '✓' : ''}</span>` })).join('')}
        ${bar(mine ? `<b>✓ Voted</b> · ${voted}/${s.players.length} in${m.deadline ? ` · <span data-deadline="${m.deadline}"></span>` : ''}` : `Pick one · ${voted}/${s.players.length} voted${m.deadline ? ` · <span data-deadline="${m.deadline}"></span>` : ''}`)}`;
      break;
    }
    case 'results': {
      const r = m.result, mine = s.me.vote;
      const msg = r.tie ? '🤝 Tie! Another vote is coming.' : mine === r.winnerId ? '🎉 Your pick won!' : mine ? 'Your pick lost this one.' : 'Results are in.';
      body = `<div class="heading"><small class="muted">${esc(m.label)}</small><h2>${msg}</h2></div><div style="height:16px"></div>
        ${[...m.songs].sort((p, q) => r.tallies[q.id].n - r.tallies[p.id].n).map((x) => row(x, `${r.winnerId === x.id ? 'win' : ''} ${mine === x.id ? 'mine' : ''}`, { right: `${mine === x.id ? '<span class="chip small">Your pick</span>' : ''}<span class="pctn">${r.tallies[x.id].pct}%</span>` })).join('')}
        ${bar('Watch the big screen')}`;
      break;
    }
    case 'champion':
      body = `<div class="center"><div class="em">👑</div><p class="muted">The aux belongs to</p><h2>${esc(s.champion.title)}</h2><p class="muted">${esc(s.champion.artist)}</p><div style="width:200px">${cover(s.champion)}</div>
        <p class="muted" style="margin-top:10px">Waiting for the host to play again…</p></div>`;
      break;
  }
  const screen = m && ['intro', 'reveal', 'voting', 'results'].includes(s.phase) ? 'm' + m.token : s.phase;
  return `<div class="topbar"><a class="logo" href="/" title="Main page">Aux Wars</a><span class="progress">${pchip(s.me.name, 'small')}${s.progress ? `<span>${s.progress.n}/${s.progress.of}</span>` : ''}</span></div>
    ${err ? `<div class="err" style="margin-bottom:12px">${esc(err)}</div>` : ''}<div class="screen" data-key="${screen}">${body}</div>${barHtml}`;
}

function render() {
  document.body.style.setProperty('--h', s?.match?.hue ?? 330);
  morph(app, !me || !s ? joinHtml() : gameHtml());
}

app.addEventListener('click', async (e) => {
  const t = e.target.closest('[data-act]');
  if (!t) return;
  if (t.dataset.act === 'join') {
    code = ($('#code').value || '').trim().toUpperCase();
    const name = ($('#name').value || '').trim();
    try {
      const r = await api('/api/join', { code, name });
      me = { pid: r.pid, name: r.name };
      store.set('aux-player', JSON.stringify({ code, ...me }));
      store.set('aux-name', name);
      history.replaceState(null, '', `/join?room=${code}`);
      err = ''; start(); keepAwake();
    } catch (x) { err = x.message; render(); }
  }
  if (t.dataset.act === 'leave') { store.del('aux-player'); location.href = '/'; return; }
  if (t.dataset.act === 'vote' && s?.phase === 'voting') {
    const id = t.dataset.id;
    if (s.me.vote === id) return;
    s.me.vote = id; render(); navigator.vibrate?.(30); // optimistic; the server broadcast confirms
    try { await api('/api/vote', { code, pid: me.pid, token: s.match.token, songId: id }); }
    catch (x) { err = x.message; render(); }
  }
});

function start() {
  es?.close();
  es = connect(`/api/events?code=${code}&pid=${me.pid}`, (st) => {
    if (st.phase === 'voting' && s?.phase !== 'voting') navigator.vibrate?.([40, 40, 40]); // nudge: voting is open
    s = st; err = ''; render();
  }, () => { store.del('aux-player'); me = null; s = null; err = 'That game has ended.'; render(); }, code);
}

setInterval(() => {
  const el = document.querySelector('[data-deadline]');
  if (el) el.textContent = `${Math.max(0, Math.ceil((Number(el.dataset.deadline) - Date.now()) / 1000))}s left`;
}, 250);

const prev = code && saved();
if (prev) { me = { pid: prev.pid, name: prev.name }; start(); keepAwake(); } // reconnect on the same device
render();
