require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

const PORT = Number(process.env.PORT || 3000);
const TOKEN = process.env.BRAWL_STARS_API_TOKEN;
const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN || 'https://ironsystem96.github.io').split(',').map(x => x.trim()).filter(Boolean);
const CACHE_TTL_MS = Number(process.env.PLAYER_CACHE_TTL_MS || 5 * 60 * 1000);
const REQUEST_TIMEOUT_MS = Number(process.env.BRAWL_API_TIMEOUT_MS || 8000);

const { getDb, getChangelog } = require('./db');

const playerCache = new Map();

app.disable('x-powered-by');
app.use(cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('Origin non autorizzata'));
  },
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Client-Id'],
  exposedHeaders: ['X-Brawl-Helper-Cache', 'X-Brawl-Helper-Sync-At']
}));
app.use(express.json({ limit: '16kb' }));

function normalizeTag(value) {
  return String(value || '')
    .trim()
    .replace(/^#/, '')
    .toUpperCase();
}

function validTag(tag) {
  return /^[A-Z0-9]+$/.test(tag) && tag.length >= 3 && tag.length <= 20;
}

function cachedPlayer(tag) {
  const hit = playerCache.get(tag);
  if (!hit) return null;
  if (Date.now() - hit.timestamp > CACHE_TTL_MS) {
    playerCache.delete(tag);
    return null;
  }
  return hit.data;
}

function storePlayer(tag, data) {
  playerCache.set(tag, { timestamp: Date.now(), data });

  // Keep memory bounded on a long-running instance.
  if (playerCache.size > 100) {
    const oldest = [...playerCache.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]?.[0];
    if (oldest) playerCache.delete(oldest);
  }
}

async function brawlApi(path) {
  if (!TOKEN) {
    const error = new Error('BRAWL_STARS_API_TOKEN non configurato');
    error.status = 500;
    throw error;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch('https://bsproxy.royaleapi.dev/v1' + path, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + TOKEN,
        Accept: 'application/json'
      },
      signal: controller.signal
    });

    const text = await response.text();
    let body;

    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      body = { error: 'Risposta non JSON da Brawl Stars API' };
    }

    return { response, body };
  } finally {
    clearTimeout(timer);
  }
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'brawl-helper-backend',
    version: '1.0.0',
    brawlApiConfigured: Boolean(TOKEN),
    cache: {
      entries: playerCache.size,
      ttlMs: CACHE_TTL_MS
    },
    cors: { allowedOrigins: ALLOWED_ORIGINS }
  });
});

app.get('/api/database', (req, res) => {
  try {
    res.json(getDb());
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database unavailable' });
  }
});

app.get('/api/changelog', (req, res) => {
  try {
    res.json(getChangelog());
  } catch (error) {
    console.error('Changelog error:', error);
    res.status(500).json({ error: 'Changelog unavailable' });
  }
});

app.get('/api/player/:tag', async (req, res) => {
  const tag = normalizeTag(req.params.tag);

  if (!validTag(tag)) {
    return res.status(400).json({
      error: 'Player Tag non valido',
      expected: 'Esempio: #22QYOQRGY'
    });
  }

  const cached = cachedPlayer(tag);
  if (cached) {
    res.set('X-Brawl-Helper-Cache', 'HIT');
    return res.json(cached);
  }

  try {
    const { response, body } = await brawlApi('/players/%23' + encodeURIComponent(tag));

    if (response.ok) {
      storePlayer(tag, body);
      res.set('X-Brawl-Helper-Cache', 'MISS');
      res.set('X-Brawl-Helper-Sync-At', new Date().toISOString());
      return res.status(200).json(body);
    }

    // If Brawl Stars is temporarily unavailable, serve the last known profile.
    // This keeps the companion usable without pretending the data is fresh.
    const stale = playerCache.get(tag);
    if (stale && response.status >= 500) {
      res.set('X-Brawl-Helper-Cache', 'STALE');
      res.set('X-Brawl-Helper-Sync-At', new Date(stale.timestamp).toISOString());
      return res.status(200).json(stale.data);
    }

    if (response.status === 404) {
      return res.status(404).json({
        error: 'Player non trovato',
        tag: '#' + tag
      });
    }

    if (response.status === 401 || response.status === 403) {
      console.error('Brawl API authentication/authorization error:', response.status, body);
      return res.status(502).json({
        error: 'Il backend non è autorizzato a chiamare Brawl Stars API'
      });
    }

    if (response.status === 429) {
      return res.status(429).json({
        error: 'Limite richieste Brawl Stars API raggiunto'
      });
    }

    console.error('Brawl API error:', response.status, body);
    return res.status(502).json({
      error: 'Brawl Stars API ha restituito un errore',
      upstreamStatus: response.status
    });
  } catch (error) {
    console.error('Player request failed:', error);

    if (error.name === 'AbortError') {
      return res.status(504).json({
        error: 'Timeout nella chiamata a Brawl Stars API'
      });
    }

    return res.status(error.status || 502).json({
      error: error.status === 500
        ? 'Backend non configurato: manca BRAWL_STARS_API_TOKEN'
        : 'Errore di collegamento a Brawl Stars API'
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Brawl Helper backend listening on port ' + PORT);
});