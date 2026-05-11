/**
 * api.js
 */

const API = (() => {

  const BASE = '/api';

  async function searchProducts(query, limit = 100) {
    const url = `${BASE}/products?query=${encodeURIComponent(query)}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.results || data.data || [];
  }

  /**
   * Browse by optional brand/gender with server-side pagination.
   * pages = how many pages of 100 to fetch (default 3 = up to 300 items)
   */
  async function browseProducts(params = {}, pages = 3) {
    const qs = new URLSearchParams({ pages, ...params }).toString();
    const res = await fetch(`${BASE}/browse?${qs}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.results || data.data || [];
  }

  async function getProduct(id) {
    if (!id) return null;
    const res = await fetch(`${BASE}/products/${encodeURIComponent(id)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.results?.[0] || data.data || data || null;
  }

  async function getDailySales() { return []; }

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