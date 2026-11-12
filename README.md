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

1. **Setup:** pick themes (or leave them all on), game length (4, 8 or 16 qualifying rounds), reveal speed, optional vote timer.
2. **Lobby:** players scan the QR code or type the room code.
3. **Qualifying rounds:** eight songs are revealed one by one, each with a ~30 second preview playing from the host's speakers.
   Everyone votes for one favorite (changeable until the host closes voting). Votes stay hidden until the results reveal.
4. **Results:** percentages plus who voted for what. Ties trigger a tiebreak vote between only the tied songs.
5. **Knockout:** every qualifying winner is paired up head to head until a champion remains.
6. **Finale:** champion, plus fun stats (closest music match, most divided round).

4 qualifiers = 7 matches, 8 = 15, 16 = 31 (plus tiebreaks).

## Where the songs come from

- **Themes** (`src/packs.js`) are curated lists with a question each. Add your own: it's one line per song (`Artist - Title`).
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
