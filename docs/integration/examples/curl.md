# Приклади запитів (curl)

```bash
export HBA=https://head-bash-staging.headbash.workers.dev/api/v1
export KEY=…   # BOT_API_KEY_STAGING
```

## Створити лобі

```bash
curl -s -X POST "$HBA/lobbies" \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -H "Idempotency-Key: -1001234567890:5512" \
  -d '{"meta":{"chatId":-1001234567890},"ttlSec":600}'
```

```json
{
  "code": "K7Q2M",
  "status": "waiting",
  "startParam": "l_K7Q2M",
  "miniAppUrl": "https://t.me/your_bot/arena?startapp=l_K7Q2M",
  "webUrl": "https://shumykr.github.io/head-bash/?room=K7Q2M",
  "expiresAt": "2026-12-01T12:10:00.000Z",
  "players": [],
  "lastResult": null,
  "meta": { "chatId": -1001234567890 }
}
```

`miniAppUrl` дорівнює `null`, доки на сервері не вписані username бота й коротка назва Mini App.

## Стан лобі

```bash
curl -s "$HBA/lobbies/K7Q2M" -H "Authorization: Bearer $KEY"
```

## Скасувати (до початку матчу)

```bash
curl -s -X POST "$HBA/lobbies/K7Q2M/cancel" -H "Authorization: Bearer $KEY"
```

## Події

```bash
curl -s "$HBA/events?after=0" -H "Authorization: Bearer $KEY"
```

```json
{
  "events": [
    { "id": 41, "type": "lobby.player_joined", "at": "2026-12-01T12:00:05.120Z", "code": "K7Q2M",
      "data": { "player": { "slot": 0, "name": "Олег", "tgUserId": 111111 } }, "meta": { "chatId": -1001234567890 } },
    { "id": 42, "type": "lobby.player_joined", "at": "2026-12-01T12:00:21.004Z", "code": "K7Q2M",
      "data": { "player": { "slot": 1, "name": "Ігор", "tgUserId": 222222 } }, "meta": { "chatId": -1001234567890 } },
    { "id": 43, "type": "match.started", "at": "2026-12-01T12:00:40.500Z", "code": "K7Q2M",
      "data": { "players": [ { "slot": 0, "name": "Олег", "tgUserId": 111111 }, { "slot": 1, "name": "Ігор", "tgUserId": 222222 } ] },
      "meta": { "chatId": -1001234567890 } },
    { "id": 44, "type": "match.finished", "at": "2026-12-01T12:04:02.871Z", "code": "K7Q2M",
      "data": { "winner": { "slot": 1, "name": "Ігор", "tgUserId": 222222 }, "scores": [3, 5], "reason": "score",
                "players": [ { "slot": 0, "name": "Олег", "tgUserId": 111111 }, { "slot": 1, "name": "Ігор", "tgUserId": 222222 } ] },
      "meta": { "chatId": -1001234567890 } },
    { "id": 45, "type": "lobby.closed", "at": "2026-12-01T12:07:30.000Z", "code": "K7Q2M",
      "data": { "reason": "empty" }, "meta": { "chatId": -1001234567890 } }
  ],
  "cursor": "45"
}
```

Наступний запит: `?after=45`.

## Помилки

```json
{ "error": { "code": "lobby_not_found", "message": "No lobby ZZZZZ" } }
```

| HTTP | `code` | Що робити |
|---|---|---|
| 400 | `bad_json`, `meta_too_large`, `bad_ttl`, `bad_idempotency_key`, `bad_cursor` | виправити запит |
| 401 | `unauthorized` | перевірити ключ і середовище (staging/production) |
| 404 | `lobby_not_found` | лобі немає (або воно давно закрите) |
| 409 | `match_in_progress` | скасувати не можна: матч уже йде |
| 503 | `api_disabled` | на сервері не налаштований ключ; написати нам |
| 500 | `internal` | повторити пізніше |
