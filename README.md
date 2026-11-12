# Aux Wars

A music party game for friends: reveal eight tracks, vote on phones, show the room's picks, then settle the winners in a knockout tournament.

**Status:** first draft, under active local development. GitHub is the source repository. Hosting decisions and GitHub Pages deployment are deferred.

## What's here

- 276 track entries across 16 artists; a fresh shuffled lineup for each game.
- 16, 24, or 32 qualifiers, followed by a 16- or 32-song knockout.
- QR joining, nicknames, host controls, hidden votes, percentages, and tiebreaks.
- A solo preview with explicitly simulated players.
- Local audio-file playback on the host's computer. Commercial recordings and official artwork are not included.

## Run locally

Install Node.js **22.13 or newer**, with npm. No paid service account or API key is required for local development.

```sh
git clone https://github.com/aelnimah/aux-wars.git
cd aux-wars
npm ci
npm run build
npm run db:init
npm run dev
```

Open the Local URL printed by the dev server, normally `http://127.0.0.1:5173`.

`db:init` is a **first-run command** for a fresh checkout's local database. Run it once, after building. If it reports that `rooms` already exists, the database has already been initialized; continue with `npm run dev`. It does not modify the hosted database.

For subsequent sessions:

```sh
npm run dev
```

Choose **Try a solo preview** to explore quickly. To test real room voting on one computer, create a room in one browser tab and join using the room code in another. The default server binds to loopback: QR links from localhost are not reachable from a separate phone. Phone testing over a LAN or a development tunnel will be configured later.

The local database lives in `.wrangler/state` and survives a server restart. Rooms expire after 24 hours. Audio files stay on the host device and need to be loaded again after a refresh.

## Checks

```sh
npm test
npm run build
npm run typecheck
```

With the local server running and the database initialized:

```sh
npm run test:api
```

The API checks create test rooms in the local database. They check concurrent joins/votes, host-only controls, hidden picks, results, and late-vote rejection. GitHub Actions runs the engine tests, build, and TypeScript check on pushes and pull requests; it does not deploy anything.

## Project map

| Location | Purpose |
| --- | --- |
| `app/page.jsx` | Game screens and browser interactions |
| `app/globals.css` | Styling and responsive layout |
| `app/engine.js` | Tournament and voting-result rules |
| `app/catalog.js` | Artist and song metadata |
| `app/api/game/route.ts` | Shared room and vote API |
| `db/schema.ts`, `drizzle/` | D1/SQLite schema and migrations |
| `tests/` | Game engine and API checks |
| `worker/index.ts`, `vite.config.ts` | Full-stack runtime and build configuration |

The current stack is React, Vinext/Vite, a Cloudflare Worker-compatible backend, and D1 (locally emulated SQLite). The initial starter's UI components and runtime helpers remain available for future changes.

## Hosting later

The app needs a server for shared rooms and voting. GitHub Pages alone cannot run `app/api/game/route.ts` or the database. We can choose a full-stack host later, or split a Pages frontend from a separately hosted backend.

`.openai/hosting.json` records the existing prototype's hosting identity; it is not a credential. Nothing in the repository automatically redeploys that prototype. No GitHub Pages workflow is enabled.

Keep secrets, `.env` files, local databases, audio files, and generated builds out of Git. The repository does not currently grant an open-source license.
