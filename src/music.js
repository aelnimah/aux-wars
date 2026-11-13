// Music lookup via Deezer's free public API (30-second previews + album art, no key).
// Everything degrades gracefully: if Deezer is unreachable the game still runs,
// songs just have no preview audio / artwork.

const OFFLINE = process.env.AUXWARS_OFFLINE === '1';
const cache = new Map();
const norm = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();

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

const shape = (hit) => ({
  preview: hit.preview || null,
  cover: hit.album?.cover_big || hit.album?.cover_medium || null,
});

function artistMatches(spec, hit) {
  const a = norm(spec);
  const b = norm(hit.artist?.name || '');
  return !!a && !!b && (b.includes(a) || a.includes(b) || b.split(' ')[0] === a.split(' ')[0]);
}

// Apple's iTunes Search API is a keyless second source (30s previews + artwork), but it allows only
// ~20 requests/minute, so it is used only for songs Deezer misses, spaced a few seconds apart.
let lastItunes = 0;
async function itunesLookup(artist, title) {
  const slot = Math.max(Date.now(), lastItunes + 3200);
  lastItunes = slot;
  if (slot > Date.now()) await new Promise((r) => setTimeout(r, slot - Date.now()));
  const j = await getJson(`https://itunes.apple.com/search?term=${encodeURIComponent(`${artist} ${title}`)}&media=music&entity=song&limit=5`);
  const hit = (j.results || []).find((r) => r.previewUrl && artistMatches(artist, { artist: { name: r.artistName } }));
  return hit ? { preview: hit.previewUrl, cover: hit.artworkUrl100 ? hit.artworkUrl100.replace('100x100', '600x600') : null } : null;
}

export const music = {
  /** Look up one song by artist + title. Returns {preview, cover} or null. */
  async resolveTrack(artist, title) {
    if (OFFLINE) return null;
    const key = norm(`${artist} ${title}`);
    if (cache.has(key)) return cache.get(key);
    let out = null;
    try {
      const strict = `artist:"${artist}" track:"${title}"`;
      let j = await getJson(`https://api.deezer.com/search?q=${encodeURIComponent(strict)}&limit=5`);
      let hit = (j.data || []).find((h) => h.preview);
      if (!hit) {
        j = await getJson(`https://api.deezer.com/search?q=${encodeURIComponent(`${artist} ${title}`)}&limit=8`);
        hit = (j.data || []).find((h) => h.preview && artistMatches(artist, h));
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
      const j = await getJson(`https://api.deezer.com/artist/${id}/top?limit=40`);
      return (j.data || [])
        .filter((t) => t.preview)
        .map((t) => ({ artist: name, title: t.title_short || t.title, resolved: shape(t) }));
    } catch {
      return [];
    }
  },
};
