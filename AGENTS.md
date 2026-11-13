# Aux Wars

Music party game: host screen on a laptop, voting on phones. Plain Node (no framework, no build step) + vanilla JS front end.

## Map
- `server.js`: HTTP routes, SSE broadcast, host auth. Keep it thin.
- `src/game.js`: engine and per-role views (`viewFor`). All game rules live here.
- `src/packs.js`: themed song pools (no chart/current content). `src/music.js`: Deezer lookups (previews/artwork), always optional.
- `public/host.js`, `public/play.js`, `public/shared.js`, `public/style.css`: the two screens.

## Commands
- `npm start` runs the app. `npm test` runs engine tests. `AUXWARS_OFFLINE=1` skips Deezer.

## Rules to preserve
- Votes are hidden until results; players only see songs already revealed.
- Host actions require the host key. One changeable vote per player. Stale votes (old round or old tiebreak) are rejected.
- Game state stays on the server, never in browser-only storage. The game must work with no internet (no previews).
- Don't commit credentials or music files. Add a test in `tests/` for engine changes.
