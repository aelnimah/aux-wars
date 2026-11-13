# Aux Wars

A music party game. The host runs it on a laptop plugged into speakers; everyone else votes on their phone.
Each round asks a question ("Best pregame song?"), reveals eight songs with a short preview of each, and the room votes.
Round winners enter a knockout bracket until one song is left.

## Run it

Needs [Node.js](https://nodejs.org) 20 or newer.

```sh
npm install
npm start
```

Open **http://localhost:3000/host** on the laptop. The terminal also prints an "On your Wi-Fi" address: that's what phones use.
Phones must be on the same Wi-Fi. If Windows asks about the firewall the first time, allow access on private networks.
No Wi-Fi handy? Use **+ Add test players** in the lobby to play alone against simulated voters.

## How a game goes

1. **Setup:** pick a length (Quick 4 / Classic 8 / Marathon 16 rounds) and leave **Surprise me** on, or choose themes yourself.
   "Pace & options" has reveal speed, a voting timer, auto-continue after results, and whether you vote too.
2. **Lobby:** players scan the QR code or type the room code.
3. **Each round** opens with a splash showing the question ("Best breakup song?"), then eight songs are revealed one at a time with
   a ~30 second preview playing from the host's speakers. Everyone votes for one favorite (changeable until voting closes).
   Votes stay hidden until the results reveal.
4. **Results:** percentages plus who voted for what. Ties get a tiebreak vote between only the tied songs, or a random draw.
5. **Knockout:** every qualifying winner is paired up head to head until a champion remains.
6. **Finale:** champion, plus fun stats (closest music match, most divided round). "Play again" returns to the lobby.

4 qualifiers = 7 matches, 8 = 15, 16 = 31 (plus tiebreaks).

Host keys: **Space** = the big button, **P** = pause/resume auto-reveal, **M** = mute.

## Where the songs come from

- **Themes** (`src/packs.js`) are 31 curated lists with a question each: hip-hop, R&B, pop, Afrobeats, dancehall, Latin, plus classics (Whitney, Michael Jackson, 80s, disco, karaoke). Rock, metal, country and EDM are deliberately left out. Add your own: it's one line per song (`Artist - Title`).
- **Surprise me** mixes all themes at random, so every game is different and themes don't repeat.
- **Artist Spotlight** picks a few random artists from a list in `src/packs.js` ("Best Drake song?") and pulls their best-known songs. Established artists only; there is no "current charts" content.
- **Previews and artwork** come from Deezer's free public API (no account or key). Songs Deezer can't find fall back to Apple's iTunes Search API (also keyless, but limited to ~20 requests/minute, so it's only used for misses). If Deezer can't be reached, the game still works:
  songs just show colored cards and have no audio (the host can play them from another app).

## Project layout

- `server.js`: tiny HTTP server (no framework). Live updates use Server-Sent Events.
- `src/game.js`: the whole game engine and what each screen is allowed to see.
- `src/packs.js`, `src/music.js`: themes and the Deezer lookup.
- `public/`: host screen, phone screen, styles (plain HTML/JS, no build step).
- `tests/`: `npm test` plays complete simulated games.

## Trying changes

- `npm run dev` restarts the server automatically when server code changes; refresh the browser for screen changes.
- `npm test` plays complete simulated games in a few seconds, no browser or internet needed.
- `AUXWARS_OFFLINE=1 npm start` skips all music lookups (colored cards, no audio) for quick UI checks.
- Pulling updates: `git pull`, then `npm install` only if `package.json` changed.

Rooms live in memory and expire after 24 hours; restarting the server ends all games.

## Phones can't open the join link?

A blank or black page on the phone almost always means the phone never reached the laptop.

1. Put the phone on the same Wi-Fi as the laptop (not guest Wi-Fi, not mobile data).
2. On Windows, double-click `fix-firewall.cmd` and choose Yes. It removes any "block" rule Windows made for Node and allows port 3000. Then restart the game.
3. If the laptop has several network addresses, the lobby's "Phone shows a blank screen?" box lets you switch the QR code to another one.

The lobby warns you when it detects that Windows Firewall is blocking phones.

## Play from anywhere (no shared Wi-Fi)

Put the game on the internet once, then use that link every time. Anyone with the link or QR code can join from any network.

1. Sign in at render.com with your GitHub account (free, no card).
2. New > Blueprint > choose the `aux-wars` repo > Apply. Render reads `render.yaml` and builds it.
3. Open the address Render gives you (like `https://aux-wars.onrender.com`). Host there; the QR code now points at that address.

On the free plan the site sleeps when unused, so the first visit can take about a minute to wake up. Games live in memory: if the site restarts, running games end.
