/**
 * api.js — KicksDB (StockX data) via local Express proxy
 *
 * KicksDB product fields:
 *   id, slug, title, brand, sku, description,
 *   image, gallery[], gallery_360[],
 *   avg_price, min_price, max_price, retail_price,
 *   weekly_orders, product_type, categories[]
 */

const API = (() => {

  const BASE = '/api';

  async function searchProducts(query, limit = 48) {
    const url = `${BASE}/products?query=${encodeURIComponent(query)}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.data || [];
  }

  async function browseProducts(params = {}) {
    const { brand = '', limit = 48 } = params;
    const url = `${BASE}/browse?brand=${encodeURIComponent(brand)}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.data || [];
  }

  async function getProduct(id) {
    if (!id) return null;
    const url = `${BASE}/products/${encodeURIComponent(id)}`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.data || data || null;
  }

  async function getDailySales(id) {
    if (!id) return [];
    try {
      const res  = await fetch(`${BASE}/products/${encodeURIComponent(id)}/sales/daily`);
      const data = await res.json();
      return data.data || [];
    } catch (e) { return []; }
  }

  async function healthCheck() {
    try {
      const res = await fetch('/api/health');
      return await res.json();
    } catch (e) {
      return { status: 'error', apiKeySet: false };
    }
  }

  return { searchProducts, browseProducts, getProduct, getDailySales, healthCheck };

})();