export const $ = (sel, el = document) => el.querySelector(sel);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function api(path, body) {
  const res = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

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
  const t = document.createElement('template');
  t.innerHTML = html;
  patch(root, t.content);
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
