require('dotenv').config();
const express   = require('express');
const fetch     = require('node-fetch');
const cors      = require('cors');
const path      = require('path');

const app       = express();
const PORT      = process.env.PORT || 3000;
const KEY       = process.env.KICKSDB_API_KEY;
const BASE      = 'https://api.kicks.dev/v3';

app.use(cors());
app.use(express.json());

app.use('/css',        express.static(path.join(__dirname, 'css')));
app.use('/javascript', express.static(path.join(__dirname, 'javascript')));
app.use('/html',       express.static(path.join(__dirname, 'html')));

app.get('/', (req, res) => {
  const p = path.join(__dirname, 'html', 'index.html');
  res.sendFile(p, err => { if (err) res.status(404).send('index.html not found: ' + p); });
});

const headers = () => ({ 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' });

// ── Search products
app.get('/api/products', async (req, res) => {
  try {
    const { query = '', limit = 48 } = req.query;
    const url = `${BASE}/stockx/products?query=${encodeURIComponent(query)}&limit=${limit}`;
    const r   = await fetch(url, { headers: headers() });
    const body = await r.json();
    if (!r.ok) return res.status(r.status).json(body);
    res.json(body);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Browse (no keyword — fetch by brand)
app.get('/api/browse', async (req, res) => {
  try {
    const { brand = '', limit = 48 } = req.query;
    const url = `${BASE}/stockx/products?query=${encodeURIComponent(brand)}&limit=${limit}`;
    const r   = await fetch(url, { headers: headers() });
    const body = await r.json();
    if (!r.ok) return res.status(r.status).json(body);
    res.json(body);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const url  = `${BASE}/stockx/products/${encodeURIComponent(req.params.id)}`;
    const r    = await fetch(url, { headers: headers() });
    const body = await r.json();
    if (!r.ok) return res.status(r.status).json(body);
    res.json(body);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Daily sales history
app.get('/api/products/:id/sales/daily', async (req, res) => {
  try {
    const url  = `${BASE}/stockx/products/${encodeURIComponent(req.params.id)}/sales/daily`;
    const r    = await fetch(url, { headers: headers() });
    const body = await r.json();
    if (!r.ok) return res.status(r.status).json({ data: [] });
    res.json(body);
  } catch (e) { res.json({ data: [] }); }
});


// ── Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    apiKeySet: !!KEY && KEY !== 'your_kicksdb_api_key_here',
    port: PORT
  });
});

app.listen(PORT, () => {
  console.log(`\n  VAULT → http://localhost:${PORT}\n`);
  if (!KEY || KEY === 'your_kicksdb_api_key_here') {
    console.warn('  ⚠  No KICKSDB_API_KEY in .env\n');
  } else {
    console.log('  ✓  KicksDB key detected\n');
  }
});