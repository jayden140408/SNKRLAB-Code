/**
 * detail.js — KicksDB field mapping:
 *   title, brand, sku, description, image, gallery[], gallery_360[],
 *   avg_price, min_price, max_price, retail_price, weekly_orders
 */

const Detail = (() => {

  let currentProduct = null;
  let panelObserver  = null;

  async function open(id, slug) {
    const overlay = document.getElementById('detailOverlay');
    overlay.scrollTop = 0;
    document.querySelectorAll('.drip-panel').forEach(p => p.classList.remove('visible'));
    overlay.classList.add('open');
    UI.lockScroll();

    setText('dsName',  'Loading…');
    setText('dsBrand', '');
    setText('dsSku',   '');

    try {
      // Try id first, fall back to slug
      let product = await API.getProduct(id);
      if (!product || isEmptyProduct(product)) {
        product = await API.getProduct(slug);
      }
      if (!product) { UI.toast('Product not found'); close(); return; }
      currentProduct = product;
      populate(product);
      Viewer.load(product);
      Chart.load(product);
      setTimeout(setupScrollReveal, 100);
    } catch (err) {
      UI.toast('Failed to load: ' + err.message);
      close();
    }
  }

  function isEmptyProduct(p) {
    return !p.avg_price && !p.min_price && !p.max_price;
  }

  function close() {
    document.getElementById('detailOverlay').classList.remove('open');
    UI.unlockScroll();
    Chart.destroy();
    if (panelObserver) { panelObserver.disconnect(); panelObserver = null; }
    currentProduct = null;
  }

  function populate(p) {
    const avg    = price(p.avg_price);
    const retail = price(p.retail_price) || extractRetailFromDesc(p.description);
    const min    = price(p.min_price);
    const max    = price(p.max_price);
    const weekly = Math.round(parseFloat(p.weekly_orders) || 0);
    const noData = !avg && !min && !max;

    // ── Hero ──
    setText('dsBrand', p.brand || '—');
    setText('dsName',  p.title || '—');
    setText('dsSku',   'SKU: ' + (p.sku || '—'));
    const heroImg = document.getElementById('dsHeroImg');
    if (heroImg) heroImg.src = p.image || '';

    // ── Market Price ──
    setText('dpPrice', avg ? '$' + avg.toLocaleString() : '—');
    const premEl = document.getElementById('dpPremium');
    if (premEl) {
      if (avg && retail) {
        const prem = UI.calcPremium(avg, retail);
        premEl.textContent = prem.label;
        premEl.className   = 'panel-sub ' + prem.cls;
      } else {
        premEl.textContent = noData ? 'No pricing data available' : 'Current market average';
        premEl.className   = 'panel-sub';
      }
    }

    // ── Retail ──
    setText('dpRetail',    retail ? '$' + retail.toLocaleString() : '—');
    setText('dpRetailSub', retail ? 'Original retail price' : 'Not available from StockX API');

    // ── Range ──
    setText('dpMin', min ? '$' + min.toLocaleString() : '—');
    setText('dpMax', max ? '$' + max.toLocaleString() : '—');

    // ── Weekly Sales ──
    const mom = UI.momentum(weekly);
    setText('dpWeekly', weekly ? weekly.toLocaleString() : '—');
    const weekSubEl = document.getElementById('dpWeeklySub');
    if (weekSubEl) {
      weekSubEl.textContent = weekly ? mom.label + ' — orders this week' : 'No sales data available';
      weekSubEl.className   = 'panel-sub' + (weekly ? ' ' + mom.cls : '');
    }

    // ── Outlook ──
    const score = UI.outlookScore(p);
    setText('dpVerdict', noData ? 'Insufficient Data' : UI.outlookVerdict(score));
    const fillEl = document.getElementById('dpOutlookFill');
    if (fillEl) {
      fillEl.style.width      = '0%';
      fillEl.style.background = noData ? '#bbb' : UI.outlookColor(score);
      setTimeout(() => { fillEl.style.width = (noData ? 50 : score) + '%'; }, 500);
    }

    // ── Description ──
    const raw = (p.description || 'No description available.').replace(/<[^>]+>/g, '').trim();
    setText('dpDesc', raw.length > 600 ? raw.slice(0, 600) + '…' : raw);

    if (noData) UI.toast('No live pricing for this item — try a different colorway', 4000);
  }

  function extractRetailFromDesc(desc) {
    if (!desc) return null;
    const patterns = [
      /retail(?:s)?\s+(?:for|price\s+of|at)\s+\$([0-9,]+)/i,
      /priced\s+at\s+\$([0-9,]+)/i,
      /\$([0-9,]+)\s+retail/i,
    ];
    for (const re of patterns) {
      const m = desc.match(re);
      if (m) {
        const n = parseInt(m[1].replace(/,/g, ''), 10);
        if (!isNaN(n) && n > 0) return n;
      }
    }
    return null;
  }

  function price(val) {
    if (!val) return null;
    const n = parseFloat(val);
    return (isNaN(n) || n === 0) ? null : Math.round(n);
  }

  function setupScrollReveal() {
    if (panelObserver) panelObserver.disconnect();
    const overlay = document.getElementById('detailOverlay');
    panelObserver = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { root: overlay, threshold: 0.1 }
    );
    document.querySelectorAll('.drip-panel').forEach(p => panelObserver.observe(p));
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  return { open, close };

})();