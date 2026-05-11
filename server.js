require('dotenv').config();
const express = require('express');
const fetch   = require('node-fetch');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
const RAPID_KEY  = process.env.RAPIDAPI_KEY;
const RAPID_HOST = 'the-sneaker-database.p.rapidapi.com';
const BASE       = `https://${RAPID_HOST}`;

app.use(cors());
app.use(express.json());

app.use('/css',        express.static(path.join(__dirname, 'css')));
app.use('/javascript', express.static(path.join(__dirname, 'javascript')));
app.use('/html',       express.static(path.join(__dirname, 'html')));

app.get('/', (req, res) => {
  const p = path.join(__dirname, 'html', 'index.html');
  res.sendFile(p, err => { if (err) res.status(404).send('index.html not found: ' + p); });
});

const headers = () => ({
  'Content-Type':    'application/json',
  'x-rapidapi-host': RAPID_HOST,
  'x-rapidapi-key':  RAPID_KEY
});

// ── Search by name
app.get('/api/products', async (req, res) => {
  try {
    const { query = '', limit = 100 } = req.query;
    const url  = `${BASE}/sneakers?name=${encodeURIComponent(query)}&limit=${limit}`;
    const r    = await fetch(url, { headers: headers() });
    const body = await r.json();
    if (!r.ok) return res.status(r.status).json(body);
    res.json(body);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Browse with pagination — fetches multiple pages and merges
app.get('/api/browse', async (req, res) => {
  try {
    const { brand, gender, pages = 3 } = req.query;
    const pageCount = Math.min(parseInt(pages) || 3, 10); // max 10 pages
    const pageSize  = 100; // max per request on TSDB

    // Build base params
    const baseParams = new URLSearchParams({ limit: pageSize });
    if (brand)  baseParams.append('brand',  brand);
    if (gender) baseParams.append('gender', gender);

    // Fetch pages in parallel
    const fetches = [];
    for (let page = 1; page <= pageCount; page++) {
      const params = new URLSearchParams(baseParams);
      params.set('page', page);
      fetches.push(
        fetch(`${BASE}/sneakers?${params.toString()}`, { headers: headers() })
          .then(r => r.json())
          .then(d => d.results || [])
          .catch(() => [])
      );
    }

    const arrays = await Promise.all(fetches);

    // Merge and deduplicate by id
    const seen    = new Set();
    const results = [];
    arrays.flat().forEach(p => {
      if (p.id && !seen.has(p.id)) {
        seen.add(p.id);
        results.push(p);
      }
    });

    res.json({ results, count: results.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Get single sneaker by id
app.get('/api/products/:id', async (req, res) => {
  try {
    const url  = `${BASE}/sneakers/${encodeURIComponent(req.params.id)}`;
    const r    = await fetch(url, { headers: headers() });
    const body = await r.json();
    if (!r.ok) return res.status(r.status).json(body);
    res.json(body);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Sales history (not on free tier)
app.get('/api/products/:id/sales/daily', async (req, res) => {
  res.json({ data: [] });
});

// ── Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    apiKeySet: !!RAPID_KEY && RAPID_KEY !== 'your_rapidapi_key_here',
    port: PORT
  });
});

app.listen(PORT, () => {
  console.log(`\n  VAULT → http://localhost:${PORT}\n`);
  if (!RAPID_KEY || RAPID_KEY === 'your_rapidapi_key_here') {
    console.warn('  ⚠  No RAPIDAPI_KEY in .env\n');
  }
});