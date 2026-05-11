/**
 * search.js
 */

const Search = (() => {

  let allProducts   = [];
  let currentFilter = 'all';

  // ── Keyword search ──
  async function run() {
    const raw = document.getElementById('searchInput').value.trim();
    if (!raw) { UI.toast('Enter a search term first'); return; }
    UI.showError('');
    renderLoading('Searching The Sneaker Database…');
    showGrid('SEARCH RESULTS');

    try {
      allProducts = await API.searchProducts(raw, 100);
      if (!allProducts.length) {
        UI.showError('No results — try "Jordan 4", "Yeezy Boost 350", "Nike Dunk"');
        renderEmpty(); return;
      }
      Filters.setProducts(allProducts);
      renderGrid(allProducts);
      setTimeout(UI.scrollToGrid, 100);
    } catch (err) {
      UI.showError('Error: ' + err.message);
      renderEmpty();
    }
  }

  /**
   * Browse by category — no keyword, just fetches as many products as possible.
   * @param {Object} opts
   *   label   {string}   — display label
   *   brands  {string[]} — fetch these brands in parallel (each gets own paginated call)
   *   pages   {number}   — pages per brand request (100 items each), default 3
   */
  async function browse(opts = {}) {
    const { label = 'Browse', brands = [], pages = 5 } = opts;
    UI.showError('');
    renderLoading(`Loading ${label}…`);
    showGrid(label.toUpperCase());

    try {
      let results = [];

      if (brands.length) {
        // Fetch each brand's pages in parallel then merge
        const fetches = brands.map(brand =>
          API.browseProducts({ brand }, pages).catch(() => [])
        );
        const arrays = await Promise.all(fetches);
        const seen   = new Set();
        arrays.flat().forEach(p => {
          if (p.id && !seen.has(p.id)) { seen.add(p.id); results.push(p); }
        });
      } else {
        // No brand — fetch as many as possible via pages
        results = await API.browseProducts({}, pages);
      }

      if (!results.length) {
        UI.showError(`No results found for ${label}`);
        renderEmpty(); return;
      }

      allProducts = results;
      Filters.setProducts(allProducts);
      renderGrid(allProducts);
      setTimeout(UI.scrollToGrid, 100);

    } catch (err) {
      UI.showError('Error: ' + err.message);
      renderEmpty();
    }
  }

  function setFilter(filter, el) {
    currentFilter = filter;
    document.querySelectorAll('.ftab').forEach(t => t.classList.remove('on'));
    el.classList.add('on');
    if (allProducts.length) renderGrid(allProducts);
  }

  function showGrid(label = 'MARKET FEED') {
    document.getElementById('gridSection').style.display = 'block';
    const el = document.querySelector('.grid-label');
    if (el) el.textContent = label;
  }

  function renderGrid(products) {
    renderFiltered(products);
  }

  function renderFiltered(products) {
    document.getElementById('gridCount').textContent = products.length + ' ITEMS';
    if (!products.length) { renderEmpty(); return; }
    document.getElementById('productsGrid').innerHTML = products.map(p => cardHTML(p)).join('');
  }

  function cardHTML(p) {
    const market = price(p.estimatedMarketValue);
    const retail = price(p.retailPrice);
    const imgSrc = p.image?.small || p.image?.original || p.image?.thumbnail || '';
    const hasImg = imgSrc.trim() !== '';
    const prem   = (market && retail) ? UI.calcPremium(market, retail) : null;
    const ratio  = (market && retail) ? market / retail : 1;
    const mom    = ratio > 1.5 ? { label: '↑ Hot',         cls: 'up'   }
                 : ratio > 1.1 ? { label: '→ Stable',      cls: 'flat' }
                 :               { label: '↓ Below retail', cls: 'down' };

    return `
      <div class="product-card" onclick="Detail.open('${escAttr(String(p.id))}')">
        <div class="card-img-wrap">
          ${hasImg
            ? `<img class="card-img" src="${escAttr(imgSrc)}" alt="${escAttr(p.name)}" loading="lazy"
                onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
               <div class="card-img-placeholder" style="display:none;"><span>${escAttr(p.brand||'—')}</span></div>`
            : `<div class="card-img-placeholder"><span>${escAttr(p.brand||'—')}</span></div>`
          }
          <div class="card-type-badge">sneakers</div>
        </div>
        <div class="card-body">
          <div class="card-brand">${p.brand || '—'}</div>
          <div class="card-name">${p.name || '—'}</div>
          <div class="card-prices">
            <div class="card-price">${market ? '$'+market.toLocaleString() : retail ? '$'+retail.toLocaleString() : '—'}</div>
            ${retail ? `<div class="card-retail">Retail $${retail.toLocaleString()}</div>` : ''}
            <div class="card-delta ${mom.cls}">${mom.label}</div>
          </div>
          ${prem ? `<div class="card-premium ${prem.cls}">${prem.label}</div>` : ''}
        </div>
        <div class="card-arrow">→</div>
      </div>`;
  }

  function price(val) {
    if (!val) return null;
    const n = parseFloat(val);
    return (isNaN(n) || n === 0) ? null : Math.round(n);
  }

  function renderLoading(msg = 'Loading…') {
    document.getElementById('productsGrid').innerHTML = `
      <div class="state-box">
        <div class="state-big">LOADING</div>
        <div class="state-text">${msg}</div>
        <div class="loading-dots">
          <div class="dot"></div><div class="dot"></div><div class="dot"></div>
        </div>
      </div>`;
    document.getElementById('gridCount').textContent = '— ITEMS';
  }

  function renderEmpty() {
    document.getElementById('productsGrid').innerHTML = `
      <div class="state-box">
        <div class="state-big">NO DATA</div>
        <div class="state-text">No results — try "Jordan 1", "Yeezy Boost 350", "Nike Dunk"</div>
      </div>`;
    document.getElementById('gridCount').textContent = '0 ITEMS';
  }

  function escAttr(str) {
    return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

  return { run, browse, setFilter, renderFiltered };

})();