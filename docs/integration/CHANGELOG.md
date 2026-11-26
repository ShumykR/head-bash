# Bot API changelog

Within v1, fields and event types are only added; nothing is removed or renamed. A breaking change would get `/api/v2`, with v1 kept running for a transition period.

## 1.0.0 — 2026-11-26

- `POST /lobbies`, `GET /lobbies/{code}`, `POST /lobbies/{code}/cancel`, `GET /events`.
- Events: `lobby.player_joined`, `lobby.player_left`, `match.started`, `match.finished`, `lobby.closed`.
- Telegram players are identified by verified Mini App `initData` (`tgUserId`), with the bot's numeric id only.
