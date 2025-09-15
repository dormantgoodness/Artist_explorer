import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
// Remove the node-fetch import - it's not needed
import { addFavorite, removeFavorite, listFavorites } from './db.js';

dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;

app.use(morgan('dev'));
app.use(express.json());

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true
}));

const DEEZER_BASE = 'https://api.deezer.com';

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) {
    let body = await res.text();
    throw new Error(`Upstream error ${res.status}: ${body}`);
  }
  return res.json();
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// --- Search ---
app.get('/api/search', async (req, res) => {
  const q = (req.query.query || '').trim();
  if (!q) return res.status(400).json({ error: 'Missing query parameter' });
  try {
    const data = await fetchJson(`${DEEZER_BASE}/search/artist?q=${encodeURIComponent(q)}`);
    const artists = (data.data || []).map(a => ({
      id: String(a.id),
      name: a.name,
      picture: a.picture_medium || a.picture,
      nb_fan: a.nb_fan
    }));
    res.json({ artists });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// --- Artist top tracks ---
app.get('/api/artists/:id/top-tracks', async (req, res) => {
  try {
    const data = await fetchJson(`${DEEZER_BASE}/artist/${req.params.id}/top?limit=10`);
    const tracks = (data.data || []).map(t => ({
      id: String(t.id),
      title: t.title,
      preview: t.preview,
      duration: t.duration,
      album: {
        id: String(t.album?.id || ''),
        title: t.album?.title || '',
        cover: t.album?.cover_medium || t.album?.cover || ''
      }
    }));
    res.json({ tracks });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// --- Artist albums ---
app.get('/api/artists/:id/albums', async (req, res) => {
  try {
    const data = await fetchJson(`${DEEZER_BASE}/artist/${req.params.id}/albums`);
    const albums = (data.data || []).map(alb => ({
      id: String(alb.id),
      title: alb.title,
      cover: alb.cover_medium || alb.cover || '',
      tracklist: alb.tracklist
    }));
    res.json({ albums });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// --- Favorites ---
app.get('/api/favorites', (_req, res) => {
  const rows = listFavorites.all();
  res.json({ favorites: rows });
});

app.post('/api/favorites', (req, res) => {
  const { artistId, name, picture } = req.body || {};
  if (!artistId || !name) return res.status(400).json({ error: 'artistId and name are required' });
  try {
    addFavorite.run({ artist_id: String(artistId), name, picture: picture || null });
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/favorites/:artistId', (req, res) => {
  try {
    removeFavorite.run(String(req.params.artistId));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
