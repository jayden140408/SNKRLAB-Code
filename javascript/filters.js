/**
 * filters.js
 * Sidebar filter panel — price range, brand, gender,
 * premium over retail, and sort order.
 */

const Filters = (() => {

  let isOpen   = false;
  let sortMode = 'default';
  let allProducts = []; // reference to Search's product list

  /** Called by Search after products load — injects product list for filtering */
  function setProducts(products) {
    allProducts = products;
    buildBrandList(products);
  }

  /** Toggle sidebar open/close */
  function toggle() {
    isOpen = !isOpen;
    const sidebar = document.getElementById('filterSidebar');
    const btn     = document.getElementById('filterToggleBtn');
    sidebar.classList.toggle('open', isOpen);
    btn.classList.toggle('active', isOpen);
  }

  /** Collapse / expand a filter group */
  function toggleGroup(titleEl) {
    titleEl.parentElement.classList.toggle('collapsed');
  }

  /** Set price preset */
  function setPrice(min, max) {
    document.getElementById('fPriceMin').value = min !== null ? min : '';
    document.getElementById('fPriceMax').value = max !== null ? max : '';
    // Highlight active preset
    document.querySelectorAll('.price-presets button').forEach(b => {
      const [bMin, bMax] = b.getAttribute('onclick')
        .match(/\d+|null/g).map(v => v === 'null' ? null : Number(v));
      b.classList.toggle('active', bMin === min && bMax === max);
    });
    apply();
  }

  /** Set sort mode */
  function setSort(mode, el) {
    sortMode = mode;
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('on'));
    el.classList.add('on');
    apply();
  }

  /** Build brand checkbox list from current products */
  function buildBrandList(products) {
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();
    const el = document.getElementById('brandList');
    if (!el) return;
    el.innerHTML = brands.map(b => `
      <label class="fcheck">
        <input type="checkbox" value="${b}" onchange="Filters.apply()"> ${b}
      </label>
    `).join('');
  }

  /** Read all active filter values and re-render the grid */
  function apply() {
    const priceMin   = parseFloat(document.getElementById('fPriceMin').value) || 0;
    const priceMax   = parseFloat(document.getElementById('fPriceMax').value) || Infinity;

    const brands = [...document.querySelectorAll('#brandList input:checked')].map(i => i.value);
    const genders = [...document.querySelectorAll('.filter-group-body input[value="men"], .filter-group-body input[value="women"], .filter-group-body input[value="youth"], .filter-group-body input[value="unisex"]')]
      .filter(i => i.checked).map(i => i.value);
    const premiums = [...document.querySelectorAll('.filter-group-body input[value="above"], .filter-group-body input[value="below"], .filter-group-body input[value="high"]')]
      .filter(i => i.checked).map(i => i.value);

    let filtered = [...allProducts];

    // ── Price filter ──
    filtered = filtered.filter(p => {
      const val = market(p) || retail(p) || 0;
      return val >= priceMin && val <= priceMax;
    });

    // ── Brand filter ──
    if (brands.length) {
      filtered = filtered.filter(p => brands.includes(p.brand));
    }

    // ── Gender filter ──
    if (genders.length) {
      filtered = filtered.filter(p => {
        const g = (p.gender || '').toLowerCase();
        return genders.some(sel => g.includes(sel));
      });
    }

    // ── Premium filter ──
    if (premiums.length) {
      filtered = filtered.filter(p => {
        const m = market(p);
        const r = retail(p);
        if (!m || !r) return false;
        const ratio = m / r;
        if (premiums.includes('above') && ratio >= 1)   return true;
        if (premiums.includes('below') && ratio < 1)    return true;
        if (premiums.includes('high')  && ratio >= 2)   return true;
        return false;
      });
    }

    // ── Sort ──
    switch (sortMode) {
      case 'price-asc':
        filtered.sort((a, b) => (market(a) || 0) - (market(b) || 0)); break;
      case 'price-desc':
        filtered.sort((a, b) => (market(b) || 0) - (market(a) || 0)); break;
      case 'premium-desc':
        filtered.sort((a, b) => premium(b) - premium(a)); break;
      case 'premium-asc':
        filtered.sort((a, b) => premium(a) - premium(b)); break;
      case 'name-asc':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break;
    }

    // Render & update active chips
    Search.renderFiltered(filtered);
    renderChips({ priceMin, priceMax, brands, genders, premiums });
  }

  /** Clear all filters */
  function clear() {
    document.getElementById('fPriceMin').value = '';
    document.getElementById('fPriceMax').value = '';
    document.querySelectorAll('.filter-sidebar input[type="checkbox"]')
      .forEach(i => i.checked = false);
    document.querySelectorAll('.price-presets button').forEach(b => b.classList.remove('active'));
    sortMode = 'default';
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('on'));
    document.querySelector('.sort-btn[data-sort="default"]')?.classList.add('on');
    document.getElementById('activeFilters')?.replaceChildren();
    Search.renderFiltered(allProducts);
  }

  /** Show active filter chips above the grid */
  function renderChips({ priceMin, priceMax, brands, genders, premiums }) {
    let el = document.getElementById('activeFilters');
    if (!el) {
      el = document.createElement('div');
      el.id = 'activeFilters';
      el.className = 'active-filters';
      const gridSection = document.getElementById('gridSection');
      const gridBody    = gridSection.querySelector('.grid-body');
      gridSection.insertBefore(el, gridBody);
    }
    el.innerHTML = '';
    if (priceMin > 0 || priceMax < Infinity) {
      const max = priceMax === Infinity ? '∞' : '$' + priceMax;
      el.appendChild(chip(`$${priceMin} – ${max}`, () => { setPrice(0, null); }));
    }
    brands.forEach(b  => el.appendChild(chip(b,  apply)));
    genders.forEach(g => el.appendChild(chip(g,  apply)));
    premiums.forEach(p => el.appendChild(chip(p, apply)));
  }

  function chip(label, onRemove) {
    const c = document.createElement('div');
    c.className = 'filter-chip';
    c.textContent = label + ' ×';
    c.onclick = () => { onRemove(); };
    return c;
  }

  function market(p) {
    const n = parseFloat(p.estimatedMarketValue);
    return (!n || n === 0) ? null : Math.round(n);
  }
  function retail(p) {
    const n = parseFloat(p.retailPrice);
    return (!n || n === 0) ? null : Math.round(n);
  }
  function premium(p) {
    const m = market(p), r = retail(p);
    return (m && r) ? m / r : 1;
  }

  return { toggle, toggleGroup, setPrice, setSort, apply, clear, setProducts };

})();