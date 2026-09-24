# Brawl Helper Backend

Backend separato dal frontend GitHub Pages. La chiave API non deve mai essere inserita in index.html, app.js, manifest o APK.

## Avvio locale
```bash
cd backend
npm install
set BRAWL_STARS_API_TOKEN=INSERISCI_LA_TUA_CHIAVE
node server.js
```

Linux/macOS:
```bash
BRAWL_STARS_API_TOKEN=INSERISCI_LA_TUA_CHIAVE node server.js
```

Endpoint:
`GET /api/health`
`GET /api/player/22QYOQRGY`

Il frontend può essere configurato con l'URL del backend dalla schermata Profili.

## Produzione
Usare HTTPS, secret manager/env vars, rate limiting, logging minimo e CORS limitato al dominio dell'app. Il backend interroga esclusivamente l'API ufficiale configurata per Brawl Stars.
