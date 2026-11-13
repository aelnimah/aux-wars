// Music lookup via Deezer's free public API (30-second previews + album art, no key).
// Everything degrades gracefully: if Deezer is unreachable the game still runs,
// songs just have no preview audio / artwork.

const OFFLINE = process.env.AUXWARS_OFFLINE === '1';
// Deezer preview links expire after a few hours, so nothing is remembered longer than that.
const TTL = 3 * 60 * 60 * 1000;
const store = new Map();
const cache = {
  has(k) { const e = store.get(k); if (e && Date.now() - e.at < TTL) return true; store.delete(k); return false; },
  get(k) { return this.has(k) ? store.get(k).v : undefined; },
  set(k, v) { if (store.size > 5000) store.clear(); store.set(k, { v, at: Date.now() }); },
};
const norm = (s) => String(s).toLowerCase().normalize('NFKD').replace(/\p{M}+/gu, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
// A title without its extras: "Yeah! (feat. Lil Jon)" and "Yeah! - Remastered" both become "yeah".
const core = (t) => { const c = norm(String(t).replace(/\s*[([][^)\]]*[)\]]/g, ' ').replace(/\s+-\s+.*$/, '').replace(/\bfeat(\.|uring)?\b.*$/i, '')); return c || norm(t); };
/** Is this hit really the song we asked for? Guards against "right artist, wrong song". */
export const titleMatches = (wanted, got) => { const a = core(wanted), b = core(got); return !!a && !!b && (a === b || (Math.min(a.length, b.length) >= 10 && (a.startsWith(b) || b.startsWith(a)))); };

async function getJson(url, ms = 7000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

const ALT = /\b(live|remix|karaoke|instrumental|acoustic|cover|tribute|sped up|slowed|re-?recorded|version|edit|mix)\b/i;
const shape = (hit) => ({
  name: `${hit.artist?.name || ''} - ${hit.title || ''}`, // what was actually matched, for the audit page
  rank: Number(hit.rank) || 0, // Deezer popularity; higher = more widely known
  preview: hit.preview || null,
  cover: hit.album?.cover_big || hit.album?.cover_medium || null,
});

export function artistMatches(spec, hit) {
  const a = norm(spec), b = norm(hit.artist?.name || '');
  if (!a || !b) return false;
  if (a === b) return true;
  // collaborations: "Brandy & Monica" should accept a hit credited to "Brandy" alone, and the reverse
  const words = (x) => ` ${x} `;
  return words(a).includes(words(b)) || words(b).includes(words(a));
}

// Apple's iTunes Search API is a keyless second source (30s previews + artwork), but it allows only
// ~20 requests/minute, so it is used only for songs Deezer misses, spaced a few seconds apart.
let lastItunes = 0;
async function itunesLookup(artist, title) {
  const slot = Math.max(Date.now(), lastItunes + 3200);
  lastItunes = slot;
  if (slot > Date.now()) await new Promise((r) => setTimeout(r, slot - Date.now()));
  const j = await getJson(`https://itunes.apple.com/search?term=${encodeURIComponent(`${artist} ${title}`)}&media=music&entity=song&limit=5`);
  const ok = (j.results || []).filter((r) => r.previewUrl && artistMatches(artist, { artist: { name: r.artistName } }) && titleMatches(title, r.trackName));
  const hit = ok.find((r) => !ALT.test(`${r.trackName} ${r.collectionName || ''}`) || ALT.test(title)) || ok[0];
  return hit ? { name: `${hit.artistName} - ${hit.trackName} (iTunes)`, rank: 0, preview: hit.previewUrl, cover: hit.artworkUrl100 ? hit.artworkUrl100.replace('100x100', '600x600') : null } : null;
}

export const music = {
  /** Look up one song by artist + title. Returns {preview, cover} or null. */
  async resolveTrack(artist, title) {
    if (OFFLINE) return null;
    const key = norm(`${artist} ${title}`);
    if (cache.has(key)) return cache.get(key);
    let out = null;
    try {
      // Prefer the original recording: the best-known match that isn't a live cut, remix, cover or karaoke take.
      const pick = (list) => {
        const ok = (list || []).filter((h) => h.preview && artistMatches(artist, h) && titleMatches(title, h.title_short || h.title));
        const clean = ok.filter((h) => !ALT.test(`${h.title || ''} ${h.album?.title || ''}`) || ALT.test(title));
        return (clean.length ? clean : ok).sort((x, y) => (y.rank || 0) - (x.rank || 0))[0] || null;
      };
      const strict = `artist:"${artist}" track:"${title}"`;
      let j = await getJson(`https://api.deezer.com/search?q=${encodeURIComponent(strict)}&limit=8`);
      let hit = pick(j.data);
      if (!hit) {
        j = await getJson(`https://api.deezer.com/search?q=${encodeURIComponent(`${artist} ${title}`)}&limit=10`);
        hit = pick(j.data);
      }
      if (hit) out = shape(hit);
      else out = await itunesLookup(artist, title).catch(() => null);
    } catch {
      return null; // don't cache failures
    }
    cache.set(key, out);
    return out;
  },

  /** An artist's best-known songs (with previews), found by name. Returns resolved songs. */
  async spotlightTracks(name) {
    if (OFFLINE) return [];
    try {
      const k = `artist:${norm(name)}`;
      let id = cache.get(k);
      if (!id) {
        const j = await getJson(`https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=3`);
        const hit = (j.data || []).find((a) => norm(a.name) === norm(name)) || (j.data || [])[0];
        if (!hit) return [];
        id = hit.id; cache.set(k, id);
      }
      const tk = `top:${id}`;
      if (cache.has(tk)) return cache.get(tk);
      const j = await getJson(`https://api.deezer.com/artist/${id}/top?limit=40`);
      // best-known first, one entry per song (no remixes or live doubles)
      const seen = new Set();
      const out = (j.data || [])
        .filter((t) => t.preview && !ALT.test(t.title || ''))
        .sort((x, y) => (y.rank || 0) - (x.rank || 0))
        .filter((t) => { const k = norm(t.title_short || t.title); if (seen.has(k)) return false; seen.add(k); return true; })
        .map((t) => ({ artist: name, title: t.title_short || t.title, resolved: shape(t) }));
      if (out.length) cache.set(tk, out);
      return out;
    } catch {
      return [];
    }
  },
};
