// Music lookup via Deezer's free public API (30-second previews + album art, no key).
// Everything degrades gracefully: if Deezer is unreachable the game still runs,
// songs just have no preview audio / artwork.

const OFFLINE = process.env.AUXWARS_OFFLINE === '1';
// Deezer preview links expire after a few hours, so nothing is remembered longer than that.
const TTL = 3 * 60 * 60 * 1000;
const store = new Map();
const cache = {
  has(k) { const e = store.get(k); if (e && Date.now() - e.at < (e.ttl || TTL)) return true; store.delete(k); return false; },
  get(k) { return this.has(k) ? store.get(k).v : undefined; },
  set(k, v, ttl) { if (store.size > 5000) store.clear(); store.set(k, { v, at: Date.now(), ttl }); },
};
const norm = (s) => String(s).toLowerCase().normalize('NFKD').replace(/\p{M}+/gu, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
// A title without its extras: "Yeah! (feat. Lil Jon)" and "Yeah! - Remastered" both become "yeah".
const core = (t) => { const c = norm(String(t).replace(/\s*[([][^)\]]*[)\]]/g, ' ').replace(/\s+-\s+.*$/, '').replace(/\bfeat(\.|uring)?\b.*$/i, '')); return c || norm(t); };
/** Is this hit really the song we asked for? Guards against "right artist, wrong song". */
export const titleMatches = (wanted, got) => { const a = core(wanted), b = core(got); return !!a && !!b && (a === b || (Math.min(a.length, b.length) >= 10 && (a.startsWith(b) || b.startsWith(a)))); };

// Deezer allows about 50 requests per 5 seconds. Calls are spaced out, and a "quota" answer is retried,
// so a busy game start never silently loses songs.
let nextSlot = 0;
async function getJson(url, ms = 7000, tries = 3) {
  if (url.includes('api.deezer.com')) {
    const at = Math.max(Date.now(), nextSlot); nextSlot = at + 120;
    if (at > Date.now()) await new Promise((r) => setTimeout(r, at - Date.now()));
  }
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  let j;
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    j = await res.json();
  } finally {
    clearTimeout(t);
  }
  if (j?.error) {
    if (tries > 1 && (j.error.code === 4 || /quota/i.test(j.error.message || ''))) { await new Promise((r) => setTimeout(r, 1500)); return getJson(url, ms, tries - 1); }
    throw new Error(j.error.message || 'music source error');
  }
  return j;
}

// Release year of an album (never changes, so it is remembered for good). Used to keep brand-new releases out.
const albumDates = new Map();
async function isBrandNew(albumId) {
  if (!albumId) return false;
  if (!albumDates.has(albumId)) {
    try { const j = await getJson(`https://api.deezer.com/album/${albumId}`); albumDates.set(albumId, j.release_date || ''); }
    catch { return false; }
  }
  const d = Date.parse(albumDates.get(albumId));
  return Number.isFinite(d) && Date.now() - d < 548 * 24 * 60 * 60 * 1000; // about 18 months
}

// Never substitute these for the original recording.
const HARD = /\b(live|remix|remixed|rmx|karaoke|instrumental|acoustic|cover|tribute|sped up|slowed|nightcore|re-?record(?:ed|ing)?|rerecorded|mashup|bootleg|demo|a ?cappella|made famous|in the style of|commentary|piano version|reprise|refreak|originally performed|voice memo)\b/i;
// Fine as a second choice: same recording, different cut.
const SOFT = /\b(version|edit|mix|remaster(ed)?|mono|stereo|single|club|extended|deluxe)\b/i;
const ALT = HARD;
// Bits in brackets or after a dash that still mean "the normal recording".
const PLAINWORDS = new Set('album version explicit clean dirty original radio edit single main remaster remastered mono stereo lp'.split(' '));
const HARMLESS = { test: (e) => /^(feat|ft|with|featuring)\b/i.test(e) || /^taylor.s version$/i.test(e) || /^from\b|soundtrack/i.test(e) || norm(e).split(' ').every((w) => PLAINWORDS.has(w) || /^\d{4}$/.test(w)) };
const extras = (t) => [...String(t).matchAll(/[([]([^)\]]*)[)\]]/g)].map((m) => m[1].trim()).concat((String(t).split(/\s+[-\/]\s+/).slice(1)).map((x) => x.trim()));
/** Does this title carry anything the asked-for title doesn't (a remix name, "Bamboo", "12\" Mix"…)? */
const isPlain = (wanted, got) => { const w = norm(wanted); return extras(got).every((e) => HARMLESS.test(e) || w.includes(norm(e))); };
const shape = (hit) => ({
  name: `${hit.artist?.name || ''} - ${hit.title || ''}`, // what was actually matched, for the audit page
  rank: Number(hit.rank) || 0, // Deezer popularity; higher = more widely known
  preview: hit.preview || null,
  cover: hit.album?.cover_big || hit.album?.cover_medium || null,
});

// "Hello I'm Adele" and "Made famous by Wiz Khalifa" are tribute acts, so a loose "contains the name" test is not enough.
const parts = (x) => String(x).split(/\s*(?:,|&|\bx\b|\band\b|\bfeat\.?|\bwith\b|\bvs\.?)\s*/i).map((p) => norm(p).replace(/^the /, '')).filter(Boolean);
export function artistMatches(spec, hit) {
  const a = norm(spec).replace(/^the /, ''), b = norm(hit.artist?.name || '').replace(/^the /, '');
  if (!a || !b) return false;
  if (a === b) return true;
  if (b.startsWith(`${a} `)) return !/\b(experience|tribute|karaoke|covers?|band|orchestra|singers|players|all stars|ensemble|project)\b/.test(b.slice(a.length)); // "Soulja Boy Tell'em" yes, "Elton John Experience" no
  if (HARD.test(hit.artist?.name || '')) return false;
  // collaborations: "Brandy & Monica" accepts "Brandy", and "Macklemore" accepts "Macklemore & Ryan Lewis"
  return parts(spec).includes(b) || parts(hit.artist?.name || '').includes(a);
}

// Apple's iTunes Search API is a keyless second source (30s previews + artwork), but it allows only
// ~20 requests/minute, so it is used only for songs Deezer misses, spaced a few seconds apart.
let lastItunes = 0;
async function itunesLookup(artist, title) {
  const slot = Math.max(Date.now(), lastItunes + 3200);
  lastItunes = slot;
  if (slot > Date.now()) await new Promise((r) => setTimeout(r, slot - Date.now()));
  const j = await getJson(`https://itunes.apple.com/search?term=${encodeURIComponent(`${artist} ${title}`)}&media=music&entity=song&limit=5`);
  const ok = (j.results || []).filter((r) => r.previewUrl && artistMatches(artist, { artist: { name: r.artistName } }) && titleMatches(title, r.trackName))
    .filter((r) => !HARD.test(r.trackName) || HARD.test(title));
  const exact = (r) => norm(r.artistName) === norm(artist) || norm(r.artistName).startsWith(`${norm(artist)} `);
  const plain = ok.filter((r) => isPlain(title, r.trackName) && !HARD.test(r.collectionName || ''));
  const hit = plain.find(exact) || plain[0] || ok.find(exact); // a different act with a different cut is not the song
  return hit ? { apple: true, name: `${hit.artistName} - ${hit.trackName} (Apple)`, plain: plain.includes(hit), rank: 500000, preview: hit.previewUrl, cover: hit.artworkUrl100 ? hit.artworkUrl100.replace('100x100', '600x600') : null } : null;
}

export const music = {
  /** True when the song came out in roughly the last 18 months. */
  isBrandNew: (albumId) => (OFFLINE ? Promise.resolve(false) : isBrandNew(albumId)),
  /** Debug: every candidate the music source returns for a song. */
  async candidates(artist, title) {
    const out = [];
    for (const q of [`artist:"${artist}" track:"${title}"`, `${artist} ${title}`]) {
      const j = await getJson(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=12`).catch((e) => ({ error: String(e) }));
      out.push({ q, total: j.total, error: j.error, hits: (j.data || []).map((h) => `${h.artist?.name} - ${h.title} | album: ${h.album?.title} | rank ${h.rank} | preview ${h.preview ? 'yes' : 'NO'} | readable ${h.readable}`) });
    }
    return out;
  },
  /** Look up one song by artist + title. Returns {preview, cover} or null. */
  async resolveTrack(artist, title) {
    if (OFFLINE) return null;
    const key = norm(`${artist} ${title}`);
    if (cache.has(key)) return cache.get(key);
    let out = null;
    try {
      // Prefer the original recording: the best-known match that isn't a live cut, remix, cover or karaoke take.
      // Candidates must be the right artist and title, and never a remix, live cut, cover or karaoke take.
      const usable = (list) => (list || []).filter((h) => h.preview && artistMatches(artist, h) && titleMatches(title, h.title_short || h.title))
        .filter((h) => !HARD.test(`${h.title || ''} ${h.title_version || ''}`) || HARD.test(title));
      const byRank = (x, y) => (y.rank || 0) - (x.rank || 0);
      const exactArtist = (h) => norm(h.artist?.name || '').replace(/^the /, '') === norm(artist).replace(/^the /, '');
      const plainOf = (list) => { const p = list.filter((h) => isPlain(title, h.title || '') && !HARD.test(h.album?.title || '')); return (p.some(exactArtist) ? p.filter(exactArtist) : p).sort(byRank)[0]; };
      let found = usable((await getJson(`https://api.deezer.com/search?q=${encodeURIComponent(`artist:"${artist}" track:"${title}"`)}&limit=15`)).data);
      let hit = plainOf(found);
      if (!hit) {
        found = found.concat(usable((await getJson(`https://api.deezer.com/search?q=${encodeURIComponent(`${artist} ${title}`)}&limit=15`)).data));
        hit = plainOf(found);
      }
      // No clean original on Deezer: Apple usually has it. Only then settle for an alternate cut.
      let apple = null;
      if (!hit) apple = await itunesLookup(artist, title).catch(() => null);
      if (!hit && !apple?.plain) hit = found.sort(byRank)[0] || null;
      if (!hit && apple) out = apple;
      if (hit) out = shape(hit);
      else if (apple) out = apple;
    } catch {
      return null; // don't cache failures
    }
    // Apple's preview links last, and Apple is slow to ask (20 a minute), so those answers are kept for a day.
    cache.set(key, out, out?.apple ? 24 * 60 * 60 * 1000 : undefined);
    return out;
  },

  /** An artist's best-known songs (with previews), found by name. Returns resolved songs. */
  async spotlightTracks(name) {
    if (OFFLINE) return [];
    try {
      const k = `artist:${norm(name)}`;
      let id = cache.get(k);
      if (!id) {
        const j = await getJson(`https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=8`);
        // several artists can share a name: take the one with the most fans
        const same = (j.data || []).filter((a) => norm(a.name) === norm(name)).sort((x, y) => (y.nb_fan || 0) - (x.nb_fan || 0));
        const hit = same[0] || (j.data || [])[0];
        if (!hit) return [];
        id = hit.id; cache.set(k, id);
      }
      const tk = `top:${id}`;
      if (cache.has(tk)) return cache.get(tk);
      const j = await getJson(`https://api.deezer.com/artist/${id}/top?limit=50`);
      // Their own songs only (no guest spots on someone else's track), best-known first, one entry per song.
      const seen = new Set();
      const own = (j.data || [])
        .filter((t) => t.preview && norm(t.artist?.name || '') === norm(name) && !HARD.test(t.title || '') && isPlain(t.title_short || '', t.title || ''))
        .sort((x, y) => (y.rank || 0) - (x.rank || 0))
        .filter((t) => { const k = core(t.title_short || t.title); if (seen.has(k)) return false; seen.add(k); return true; })
        .slice(0, 16);
      const out = own.map((t) => ({ artist: name, title: t.title_short || t.title, albumId: t.album?.id, resolved: shape(t) }));
      if (out.length) cache.set(tk, out);
      return out;
    } catch {
      return [];
    }
  },
};
