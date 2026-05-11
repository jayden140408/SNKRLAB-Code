/**
 * search.js — KicksDB field mapping:
 *   title, brand, image, avg_price, min_price,
 *   retail_price, weekly_orders, product_type, id, slug
 */

const Search = (() => {

  let allProducts   = [];
  let currentFilter = 'all';

  async function run() {
    const raw = document.getElementById('searchInput').value.trim();
    if (!raw) { UI.toast('Enter a search term first'); return; }

    UI.showError('');
    renderLoading('Searching KicksDB…');
    showGrid('SEARCH RESULTS');

    try {
      allProducts = await API.searchProducts(raw, 48);
      if (!allProducts.length) {
        UI.showError('No results — try "Jordan 4", "Yeezy", "Dunk Low"');
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

  async function browse(opts = {}) {
    const { label = 'Browse', brands = [] } = opts;
    UI.showError('');
    renderLoading(`Loading ${label}…`);
    showGrid(label.toUpperCase());

    try {
      let results = [];
      if (brands.length) {
        const fetches = brands.map(brand =>
          API.browseProducts({ brand, limit: 12 }).catch(() => [])
        );
        const arrays = await Promise.all(fetches);
        const seen   = new Set();
        arrays.flat().forEach(p => {
          const key = p.id || p.slug;
          if (key && !seen.has(key)) { seen.add(key); results.push(p); }
        });
      } else {
        results = await API.browseProducts({ brand: 'nike', limit: 48 });
      }

      if (!results.length) {
        UI.showError(`No results for ${label}`);
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

  function applyTypeFilter(products) {
    if (currentFilter === 'all') return products;
    return products.filter(p => {
      const type = (p.product_type || '').toLowerCase();
      const cats  = (p.categories || []).map(c => c.toLowerCase());
      return type.includes(currentFilter) || cats.some(c => c.includes(currentFilter));
    });
  }

  function renderGrid(products) {
    renderFiltered(applyTypeFilter(products));
  }

  function renderFiltered(products) {
    document.getElementById('gridCount').textContent = products.length + ' ITEMS';
    if (!products.length) { renderEmpty(); return; }
    document.getElementById('productsGrid').innerHTML = products.map(p => cardHTML(p)).join('');
  }

  function cardHTML(p) {
    // KicksDB fields
    const market = price(p.avg_price);
    const min    = price(p.min_price);
    const retail = price(p.retail_price);
    const weekly = Math.round(parseFloat(p.weekly_orders) || 0);
    const imgSrc = p.image || '';
    const hasImg = imgSrc.trim() !== '';
    const prem   = (market && retail) ? UI.calcPremium(market, retail) : null;
    const mom    = UI.momentum(weekly);
    const type   = p.product_type || 'sneakers';

    return `
      <div class="product-card" onclick="Detail.open('${escAttr(p.id || p.slug)}', '${escAttr(p.slug)}')">
        <div class="card-img-wrap">
          ${hasImg
            ? `<img class="card-img" src="${escAttr(imgSrc)}" alt="${escAttr(p.title)}" loading="lazy"
                onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
               <div class="card-img-placeholder" style="display:none;"><span>${escAttr(p.brand || '—')}</span></div>`
            : `<div class="card-img-placeholder"><span>${escAttr(p.brand || '—')}</span></div>`
          }
          <div class="card-type-badge">${type}</div>
        </div>
        <div class="card-body">
          <div class="card-brand">${p.brand || '—'}</div>
          <div class="card-name">${p.title || '—'}</div>
          <div class="card-prices">
            <div class="card-price">${market ? '$' + market.toLocaleString() : '—'}</div>
            ${min ? `<div class="card-retail">from $${min.toLocaleString()}</div>` : ''}
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