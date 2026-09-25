# Brawl Helper Backend

Backend Node.js per Brawl Helper. La chiave Brawl Stars resta esclusivamente sul server.

## Funzioni attuali

- GET /api/health — stato del backend.
- GET /api/player/<PLAYER_TAG> — recupera il profilo completo dal Brawl Stars API.
- GET /api/database — database locale dell'app.
- GET /api/changelog — changelog locale.
- Cache in memoria dei profili per ridurre le chiamate ripetute.
- Timeout sulle chiamate al Brawl Stars API.
- Gestione degli errori 404/401/403/429.
- CORS limitato al dominio configurato.

## Configurazione locale

Copia `.env.example` in `.env` e imposta BRAWL_STARS_API_TOKEN, ALLOWED_ORIGIN, PORT, PLAYER_CACHE_TTL_MS e BRAWL_API_TIMEOUT_MS.

Poi esegui:

    npm install
    npm start

Test:

    http://localhost:3000/api/health
    http://localhost:3000/api/player/22QYOQRGY

## Produzione

Il frontend è su GitHub Pages, mentre il backend deve essere pubblicato su un servizio HTTPS separato, ad esempio Render.

Il frontend chiamerà https://<backend-domain>/api/player/22QYOQRGY.

La variabile BRAWL_STARS_API_TOKEN deve essere configurata come Secret/Environment Variable del provider. Non deve mai essere committata nel repository, inserita nel frontend o distribuita nell'APK.

## Flusso

Player Tag → Brawl Helper Backend → Brawl Stars API → profilo JSON → Brawl Helper

Il nome restituito dall'API (`name`) viene utilizzato dal frontend come nome automatico del profilo.
