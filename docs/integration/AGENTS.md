# AGENTS.md — integrating the Head Bash Arena bot API

Instructions for an AI coding agent working in the **Telegram bot's** repository (Node.js, Telegraf, SQLite). Human overview (Ukrainian): `README.md`. Contract: `openapi.yaml` (source of truth; if anything here disagrees with it, the OpenAPI file wins).

## What to build

A `/duel` command: create a lobby via the API, post a URL button that opens the game's Mini App in that lobby, then poll events and keep the chat message up to date (who joined, match started, who won).

## Facts you need

- Base URL: staging `https://head-bash-staging.headbash.workers.dev/api/v1`, production `https://head-bash.headbash.workers.dev/api/v1`. Read it from an env var (e.g. `HBA_API_URL`); never hard-code the key.
- Auth: header `Authorization: Bearer ${process.env.HBA_API_KEY}`. Different keys for staging and production. The key is a server-side secret: never send it to the Mini App, Vercel functions, logs or chats.
- Endpoints: `POST /lobbies` (body `{ meta?, ttlSec? }`, header `Idempotency-Key`), `GET /lobbies/{code}`, `POST /lobbies/{code}/cancel`, `GET /events?after=<cursor>&limit=<1..100>`.
- Lobby response fields: `code`, `status` (`waiting|playing|closed`), `startParam` (`l_<code>`), `miniAppUrl` (may be `null` → build `https://t.me/<botUsername>/<appShortName>?startapp=<startParam>`), `webUrl`, `expiresAt`, `players`, `lastResult`, `closedReason?`, `meta`.
- Events: `{ id, type, at, code, data, meta }`, types `lobby.player_joined`, `lobby.player_left`, `match.started`, `match.finished`, `lobby.closed`. `data` per type is in `openapi.yaml` → `Event`.
- Errors: `{ error: { code, message } }`; branch on `code` only.

## How to do it (recommended)

1. Copy `examples/node/hba-client.mjs` into the bot as is (no dependencies, Node 18+ `fetch`). Use `HbaClient`.
2. Start from `examples/node/telegraf-duel.mjs`; replace its in-memory `Map` and `cursor` with SQLite tables:
   - `hba_lobbies(code TEXT PRIMARY KEY, chat_id INTEGER, message_id INTEGER, created_at INTEGER)`
   - `hba_state(key TEXT PRIMARY KEY, value TEXT)` holding `events_cursor`.
3. In group chats use `Markup.button.url(text, miniAppUrl)`. Do **not** use `Markup.button.webApp` there (Telegram rejects `web_app` buttons in groups).
4. Pass `idempotencyKey: \`${chatId}:${commandMessageId}\`` to `createLobby` so a re-delivered update does not create a second lobby.
5. Poll with `hba.poll({ isActive, loadCursor, saveCursor, onEvent })`: `isActive` returns true only while `hba_lobbies` has rows; interval 3–5 s.
6. In `onEvent`: look up the lobby by `ev.code` (ignore unknown codes); `switch (ev.type)` with a `default` that ignores unknown types; on `lobby.closed` delete the row.
7. Handle `HbaError`: `status >= 500` or network errors → tell the user to try later; `401` → configuration error (wrong key or environment), log loudly.

## Do not

- Do not ask for or store the game's Cloudflare credentials; the bot needs only its API key.
- Do not send the Telegram bot token anywhere. The game server verifies players with the bot's numeric id only.
- Do not poll when there are no open lobbies, or faster than every 3 s.
- Do not rely on the event `message` texts or on field order; do not fail on unknown fields or event types.
- Do not try to pass match settings (arena, points, time); the host chooses them in the game.

## Checking your work

- Without Telegram: create a lobby with `curl` (`examples/curl.md`), open `webUrl` in two browser tabs, press «готовий» in both; your poller should see `lobby.player_joined` ×2, `match.started`, then (after a player concedes with the ⚑ button, or the match ends) `match.finished`.
- With Telegram: the same through `/duel` in a test group on the staging key.

## One-time setup the human must do (tell them if missing)

- Register the Mini App in @BotFather (`/newapp`, URL `https://shumykr.github.io/head-bash/`).
- Send the game owner: the bot's numeric id (token part before `:`; never the token), the bot username, the Mini App short name.
- Get the staging and production API keys from the game owner through a secure channel.
