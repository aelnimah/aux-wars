export const $ = (sel, el = document) => el.querySelector(sel);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function api(path, body) {
  const res = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

const hue = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
export function cover(song, extra = '') {
  const h = hue(song.title + song.artist);
  const img = song.cover ? `<img src="${esc(song.cover)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : '';
  return `<div class="cover ${extra}" style="background:linear-gradient(135deg,hsl(${h} 70% 45%),hsl(${(h + 60) % 360} 70% 30%))"><span class="initial">${esc(song.title[0] || '♪')}</span>${img}</div>`;
}

/** Connect to the SSE stream; reconnects automatically (EventSource) and reports hard failures. */
export function connect(url, onState, onGone, code) {
  const es = new EventSource(url);
  es.onmessage = (e) => onState(JSON.parse(e.data));
  let fails = 0;
  es.onerror = async () => {
    // EventSource retries on its own; if the room is gone the server answers 400, so check.
    if (++fails < 2) return;
    try { const r = await fetch(`/api/exists?code=${encodeURIComponent(code)}`); if (r.status === 404) { es.close(); onGone?.(); } } catch { /* offline, keep retrying */ }
  };
  es.onopen = () => { fails = 0; };
  return es;
}
