export const $ = (sel, el = document) => el.querySelector(sel);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Some phone browsers (private tabs, in-app QR scanners) refuse storage and throw. Fall back to memory.
const mem = new Map();
export const store = {
  get(k) { try { return localStorage.getItem(k) ?? mem.get(k) ?? null; } catch { return mem.get(k) ?? null; } },
  set(k, v) { mem.set(k, String(v)); try { localStorage.setItem(k, String(v)); } catch { /* memory only */ } },
  del(k) { mem.delete(k); try { localStorage.removeItem(k); } catch { /* memory only */ } },
  json(k) { try { return JSON.parse(this.get(k) || 'null'); } catch { return null; } },
};

export async function api(path, body) {
  let res;
  try { res = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined); }
  catch { throw new Error('Can’t reach the game. Check the Wi-Fi and try again.'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

// ---------- players ----------
export const playerHue = (name) => { let h = 11; for (const c of String(name)) h = (h * 37 + c.charCodeAt(0)) % 360; return h; };
/** A name chip with the player's own color dot, so people are recognizable at a glance. */
export const pchip = (name, cls = '', key = '') =>
  `<span class="chip pl ${cls}" ${key ? `data-key="${esc(key)}"` : ''} style="--ph:${playerHue(name)}"><i class="dot"></i>${esc(name)}</span>`;

// ---------- artwork ----------
const hue = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const badImgs = new Set(); // artwork URLs that failed to load; never retried, so no flicker
window.__badImg = (img) => { badImgs.add(img.getAttribute('src')); img.remove(); };
export function cover(song, extra = '') {
  const h = hue(song.title + song.artist);
  const show = song.cover && !badImgs.has(song.cover);
  const img = show ? `<img src="${esc(song.cover)}" alt="" referrerpolicy="no-referrer" onerror="window.__badImg(this)">` : '';
  return `<div class="cover ${extra}" style="background:linear-gradient(135deg,hsl(${h} 70% 45%),hsl(${(h + 60) % 360} 70% 30%))"><span class="initial">${esc(song.title[0] || '♪')}</span>${img}</div>`;
}

// ---------- DOM patching ----------
// Re-rendering by innerHTML makes images reload, animations replay and focus jump.
// morph() instead updates the existing DOM in place so only real changes touch the page.
// Give elements data-key to keep them matched across reorders.
export function morph(root, html) {
  // FLIP: remember where [data-flip] elements are, patch, then slide them from old to new position
  const before = new Map();
  root.querySelectorAll('[data-flip]').forEach((el) => before.set(el.dataset.key, el.getBoundingClientRect()));
  const t = document.createElement('template');
  t.innerHTML = html;
  patch(root, t.content);
  root.querySelectorAll('[data-flip]').forEach((el) => {
    const b = before.get(el.dataset.key);
    if (!b) return;
    const a = el.getBoundingClientRect(), dx = b.left - a.left, dy = b.top - a.top;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)' });
  });
}

const keyOf = (n) => (n.nodeType === 1 ? n.dataset.key : undefined);
const same = (a, b) => a.nodeType === b.nodeType && a.nodeName === b.nodeName;

function patch(a, b) {
  const keyed = new Map();
  for (const n of a.childNodes) { const k = keyOf(n); if (k) keyed.set(k, n); }
  const used = new Set();
  [...b.childNodes].forEach((bn, i) => {
    const k = keyOf(bn);
    let an = null;
    if (k) an = keyed.get(k) || null;
    else { const c = a.childNodes[i]; if (c && !keyOf(c) && !used.has(c)) an = c; }
    if (an && same(an, bn)) {
      used.add(an); update(an, bn);
      const at = a.childNodes[i];
      if (at !== an) a.insertBefore(an, at || null);
    } else {
      const nn = bn.cloneNode(true);
      a.insertBefore(nn, a.childNodes[i] || null);
      used.add(nn);
    }
  });
  for (const n of [...a.childNodes]) if (!used.has(n)) n.remove();
}

function update(a, b) {
  if (a.nodeType !== 1) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
  for (const { name } of [...a.attributes]) if (!b.hasAttribute(name)) a.removeAttribute(name);
  for (const { name, value } of [...b.attributes]) {
    if (a.getAttribute(name) !== value) a.setAttribute(name, value);
  }
  if (a.nodeName === 'INPUT') { // never clobber what someone is typing
    if (document.activeElement !== a && a.value !== (b.getAttribute('value') ?? '')) a.value = b.getAttribute('value') ?? '';
    return;
  }
  patch(a, b);
}

/** Connect to the SSE stream; EventSource reconnects by itself. Calls onGone if the room no longer exists. */
export function connect(url, onState, onGone, code) {
  const es = new EventSource(url);
  es.onmessage = (e) => onState(JSON.parse(e.data));
  let fails = 0;
  es.onerror = async () => {
    if (++fails < 2) return;
    try { const r = await fetch(`/api/exists?code=${encodeURIComponent(code)}`); if (r.status === 404) { es.close(); onGone?.(); } } catch { /* offline: keep retrying */ }
  };
  es.onopen = () => { fails = 0; };
  return es;
}
