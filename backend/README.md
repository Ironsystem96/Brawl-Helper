# Brawl Helper Backend

Questo servizio è separato dal frontend GitHub Pages.

1. Copia .env.example in .env.
2. Inserisci BRAWL_STARS_API_TOKEN.
3. Esegui npm install.
4. Esegui npm start.

Endpoint:
GET /api/health
GET /api/player/<PLAYER_TAG>

La chiave API resta esclusivamente sul server e non deve essere inserita nel frontend o nell'APK.

Per il test locale:
http://localhost:3000/api/player/22QYOQRGY

Per produzione usare un provider HTTPS/serverless e configurare ALLOWED_ORIGIN con il dominio dell'app.
