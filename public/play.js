import { $, esc, api, cover, connect } from './shared.js';

const app = $('#app');
const params = new URLSearchParams(location.search);
let code = (params.get('room') || '').toUpperCase();
let me = null;      // {pid, name}
let s = null;
let err = '';
let es = null;
let busy = false;
const store = () => JSON.parse(localStorage.getItem('aux-player') || '{}');

function saved() { const x = store(); return x.code === code ? x : null; }

function renderJoin() {
  app.innerHTML = `<div class="center"><div class="logo" style="font-size:2.6rem;font-weight:900">AUX WARS</div>
    ${err ? `<div class="err">${esc(err)}</div>` : ''}
    <input type="text" id="code" class="code-input" placeholder="ROOM CODE" maxlength="6" value="${esc(code)}" autocapitalize="characters" autocomplete="off">
    <input type="text" id="name" placeholder="Your nickname" maxlength="16" autocomplete="off" style="width:min(300px,100%);text-align:center">
    <button class="btn primary big" data-act="join">Join game</button></div>`;
}

function render() {
  if (!me || !s) return renderJoin();
  const m = s.match;
  let body = '';
  if (s.phase === 'lobby') {
    body = `<div class="center"><div style="font-size:3rem">🎧</div><h2>You’re in, ${esc(s.me.name)}!</h2><p class="muted">Waiting for the host to start. Watch the big screen.</p>
      <div class="players" style="justify-content:center">${s.players.map((p) => `<span class="chip">${esc(p.name)}</span>`).join('')}</div></div>`;
  } else if (s.phase === 'loading') {
    body = `<div class="center"><div class="spinner"></div><h2>${esc(s.loading?.question || 'Loading…')}</h2><p class="muted">${esc(s.loading?.label || '')}</p></div>`;
  } else if (s.phase === 'reveal') {
    body = `<div class="heading"><small class="muted">${esc(m.label)}</small><h2>${esc(m.question)}</h2></div>
      <p class="muted" style="margin:8px 0 18px">🔊 Listen to the speakers. Voting opens soon.</p>
      ${m.songs.map((x) => opt(x, '')).join('')}
      ${bar(`${m.revealed} of ${m.total} revealed`)}`;
  } else if (s.phase === 'voting') {
    const mine = s.me.vote;
    body = `<div class="heading"><small class="muted">${esc(m.label)}${m.tiebreak ? ' · TIEBREAK' : ''}</small><h2>${esc(m.question)}</h2></div>
      <p class="muted" style="margin:8px 0 18px">${mine ? 'Vote locked in. Tap another to change it.' : 'Tap your favorite.'}</p>
      ${m.songs.map((x) => opt(x, x.id === mine ? 'sel' : '', true)).join('')}
      ${bar(mine ? '✓ Voted · you can change until the host closes voting' : 'Pick one')}`;
  } else if (s.phase === 'results') {
    const r = m.result, mine = s.me.vote;
    const msg = r.tie ? '🤝 Tie! Another vote is coming.' : mine === r.winnerId ? '🎉 Your pick won!' : mine ? 'Your pick lost this one.' : 'Results are in.';
    body = `<div class="heading"><small class="muted">${esc(m.label)}</small><h2>${msg}</h2></div><div style="height:16px"></div>
      ${m.songs.map((x) => `<div class="opt ${r.winnerId === x.id ? 'win' : ''} ${mine === x.id ? 'sel' : ''}">${cover(x)}<div class="txt"><div class="t">${r.winnerId === x.id ? '👑 ' : ''}${esc(x.title)}</div><div class="a">${esc(x.artist)}</div></div><b>${r.tallies[x.id].pct}%</b></div>`).join('')}
      ${bar('Watch the big screen')}`;
  } else if (s.phase === 'champion') {
    body = `<div class="center"><div style="font-size:3.5rem">👑</div><p class="muted">The aux belongs to</p><h2>${esc(s.champion.title)}</h2><p class="muted">${esc(s.champion.artist)}</p>
      <div style="width:200px">${cover(s.champion)}</div></div>`;
  }
  app.innerHTML = `<div class="topbar"><span class="logo">AUX WARS</span><span class="progress">${esc(s.me.name)}${s.progress ? ` · ${s.progress.n}/${s.progress.of}` : ''}</span></div>${err ? `<div class="err" style="margin-bottom:12px">${esc(err)}</div>` : ''}${body}`;
  err = '';
}

const opt = (x, cls, clickable) => `<${clickable ? 'button' : 'div'} class="opt ${cls}" ${clickable ? `data-act="vote" data-id="${x.id}"` : ''}>${cover(x)}<div class="txt"><div class="t">${esc(x.title)}</div><div class="a">${esc(x.artist)}</div></div>${clickable ? `<span class="tick">${cls === 'sel' ? '✓' : ''}</span>` : ''}</${clickable ? 'button' : 'div'}>`;
const bar = (t) => `<div class="stickybar">${t}</div>`;

app.addEventListener('click', async (e) => {
  const t = e.target.closest('[data-act]');
  if (!t) return;
  if (t.dataset.act === 'join') {
    code = ($('#code').value || '').trim().toUpperCase();
    const name = ($('#name').value || '').trim();
    try {
      const r = await api('/api/join', { code, name });
      me = { pid: r.pid, name: r.name };
      localStorage.setItem('aux-player', JSON.stringify({ code, ...me }));
      history.replaceState(null, '', `/join?room=${code}`);
      start();
    } catch (x) { err = x.message; renderJoin(); }
  }
  if (t.dataset.act === 'vote' && s?.phase === 'voting') {
    const id = t.dataset.id;
    s.me.vote = id; render(); // optimistic; the server broadcast confirms
    try { await api('/api/vote', { code, pid: me.pid, token: s.match.token, songId: id }); }
    catch (x) { err = x.message; }
  }
});

function start() {
  es?.close();
  es = connect(`/api/events?code=${code}&pid=${me.pid}`, (st) => { s = st; render(); }, () => { localStorage.removeItem('aux-player'); me = null; s = null; err = 'That game has ended.'; render(); }, code);
}

const prev = code && saved();
if (prev) { me = { pid: prev.pid, name: prev.name }; start(); } // reconnect on same device
render();
