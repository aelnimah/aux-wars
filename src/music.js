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
    } catch {
      return null; // don't cache failures
    }
    cache.set(key, out);
    return out;
  },

  /** Top tracks for a Deezer genre chart (0 = all genres). Returns fully resolved songs. */
  async chartTracks(genre) {
    if (OFFLINE) return [];
    const key = `chart:${genre}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < 3600_000) return hit.songs;
    try {
      const j = await getJson(`https://api.deezer.com/chart/${genre}/tracks?limit=100`);
      const songs = (j.data || [])
        .filter((t) => t.preview)
        .map((t) => ({ artist: t.artist?.name || 'Unknown', title: t.title_short || t.title, resolved: shape(t) }));
      cache.set(key, { at: Date.now(), songs });
      return songs;
    } catch {
      return [];
    }
  },

  /** Random artists currently on Deezer's charts: [{id, name}]. */
  async chartArtists() {
    if (OFFLINE) return [];
    const hit = cache.get('chart-artists');
    if (hit && Date.now() - hit.at < 3600_000) return hit.list;
    try {
      const j = await getJson('https://api.deezer.com/chart/0/artists?limit=60');
      const list = (j.data || []).map((a) => ({ id: a.id, name: a.name }));
      cache.set('chart-artists', { at: Date.now(), list });
      return list;
    } catch {
      return [];
    }
  },

  /** An artist's top tracks with previews, as resolved songs. */
  async artistTop(artist) {
    if (OFFLINE) return [];
    try {
      const j = await getJson(`https://api.deezer.com/artist/${artist.id}/top?limit=40`);
      return (j.data || [])
        .filter((t) => t.preview)
        .map((t) => ({ artist: artist.name, title: t.title_short || t.title, resolved: shape(t) }));
    } catch {
      return [];
    }
  },
};
