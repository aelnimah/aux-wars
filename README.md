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

- **Themes** (`src/packs.js`) are 27 curated lists with a question each (pregame, breakup, 80s, country, Latin, karaoke...). Add your own: it's one line per song (`Artist - Title`).
- **Surprise me** mixes all themes at random, so every game is different and themes don't repeat.
- **Artist Spotlight** picks random artists from the live charts: "Best <artist> song?".
- **Live charts** pull Deezer's current top tracks per genre, so those rounds are different every time.
- **Previews and artwork** come from Deezer's free public API (no account or key). If Deezer can't be reached, the game still works:
  songs just show colored cards and have no audio (the host can play them from another app).

## Project layout

- `server.js`: tiny HTTP server (no framework). Live updates use Server-Sent Events.
- `src/game.js`: the whole game engine and what each screen is allowed to see.
- `src/packs.js`, `src/music.js`: themes and the Deezer lookup.
- `public/`: host screen, phone screen, styles (plain HTML/JS, no build step).
- `tests/`: `npm test` plays complete simulated games.

Rooms live in memory and expire after 24 hours; restarting the server ends all games.
