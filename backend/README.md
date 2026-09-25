# Brawl Helper Backend

Backend Node.js per Brawl Helper. La chiave Brawl Stars resta esclusivamente sul server.

## Funzioni

- GET /api/health — stato backend e configurazione non sensibile.
- GET /api/player/<PLAYER_TAG> — recupera il profilo tramite proxy server-side.
- GET /api/database — database locale dell'app.
- GET /api/changelog — changelog locale.
- Cache in memoria dei profili.
- Fallback sul profilo cached se il provider upstream è temporaneamente indisponibile.
- Timeout e gestione errori 404/401/403/429.
- CORS configurabile tramite ALLOWED_ORIGINS.

## Configurazione

Copia `.env.example` in `.env` e imposta:

- `BRAWL_STARS_API_TOKEN`: secret del provider Brawl Stars/proxy. Non committarlo.
- `ALLOWED_ORIGINS`: uno o più origin separati da virgola.
- `PORT`, `PLAYER_CACHE_TTL_MS`, `BRAWL_API_TIMEOUT_MS`: parametri opzionali.

Avvio:

    npm install
    npm start

Test:

    http://localhost:3000/api/health
    http://localhost:3000/api/player/22QYOQRGY

## Produzione

Il frontend è pubblicato su GitHub Pages e il backend su un servizio HTTPS separato, ad esempio Render.

Su Render configurare almeno:

    BRAWL_STARS_API_TOKEN = <secret>
    ALLOWED_ORIGINS = https://ironsystem96.github.io

La chiave non deve mai essere inserita nel frontend, nel repository o nell'APK.

## Flusso account

Player Tag inserito dall'utente → Brawl Helper Backend → provider Brawl Stars → profilo JSON → frontend.

Il frontend salva localmente un solo Player Tag per installazione. Il profilo viene aggiornato automaticamente alla riapertura. Se il backend non è raggiungibile, viene usata la copia locale dell'ultimo profilo riuscito, con stato OFFLINE.

BlackShark (#22QYOQRGY) è previsto esclusivamente come profilo DEV quando `DEV_MODE=true`; non viene più creato automaticamente in produzione.
