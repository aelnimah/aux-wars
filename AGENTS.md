# Aux Wars

This is an early music party game prototype. Work locally and keep hosting configuration deferred unless the user asks to deploy.

## Map
- `app/page.jsx`: host, join, voting, results, and solo-preview interface.
- `app/engine.js`: qualifying rounds, tiebreaks, and knockout progression.
- `app/catalog.js`: track metadata; commercial audio is not bundled.
- `app/api/game/route.ts`: room API, host controls, and voting.
- `db/schema.ts` and `drizzle/`: database schema and immutable migration history.

## Development
- Follow the README for first-run database setup.
- `npm run dev` starts the full app locally.
- `npm test` checks the game engine.
- `npm run typecheck` checks TypeScript.
- `npm run build` creates the Worker build.
- `npm run test:api` requires the local dev server and initialized database.

Preserve hidden votes until results, host-only controls, one changeable vote per player, and rejection of stale votes. Do not replace shared room state with browser-only storage. Do not commit local databases, credentials, generated builds, or music files.
