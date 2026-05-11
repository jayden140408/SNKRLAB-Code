/**
 * detail.js
 * DRIP-style detail overlay — adapted for The Sneaker Database (TSDB).
 *
 * TSDB product fields:
 *   id, name, brand, colorway, gender, silhouette, sku,
 *   releaseDate, retailPrice, estimatedMarketValue,
 *   image: { original, small, thumbnail, 360: [] },
 *   links: { stockX, goat, flightClub, stadiumGoods },
 *   story, description
 */

const Detail = (() => {

  let currentProduct = null;
  let panelObserver  = null;

  async function open(id) {
    const overlay = document.getElementById('detailOverlay');
    overlay.scrollTop = 0;
    document.querySelectorAll('.drip-panel').forEach(p => p.classList.remove('visible'));
    overlay.classList.add('open');
    UI.lockScroll();

    setText('dsName',  'Loading…');
    setText('dsBrand', '');
    setText('dsSku',   '');

    try {
      const product = await API.getProduct(id);
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

  function close() {
    document.getElementById('detailOverlay').classList.remove('open');
    UI.unlockScroll();
    Chart.destroy();
    if (panelObserver) { panelObserver.disconnect(); panelObserver = null; }
    currentProduct = null;
  }

  function populate(p) {
    const market = price(p.estimatedMarketValue);
    const retail = price(p.retailPrice);
    const prem   = (market && retail) ? UI.calcPremium(market, retail) : null;

    // ── Hero ──
    setText('dsBrand', p.brand || '—');
    setText('dsName',  p.name  || '—');
    setText('dsSku',   `SKU: ${p.sku || '—'}  ·  ${p.colorway || ''}  ·  Released: ${p.releaseDate ? p.releaseDate.split(' ')[0] : '—'}`);

    // Hero image — use original (largest)
    const heroImg = document.getElementById('dsHeroImg');
    if (heroImg) heroImg.src = p.image?.original || p.image?.small || '';

    // ── Market Price ──
    setText('dpPrice', market ? '$' + market.toLocaleString() : retail ? '$' + retail.toLocaleString() : '—');
    const premEl = document.getElementById('dpPremium');
    if (premEl) {
      if (prem) {
        premEl.textContent = prem.label;
        premEl.className   = 'panel-sub ' + prem.cls;
      } else {
        premEl.textContent = market ? 'Estimated market value' : 'No market data available';
        premEl.className   = 'panel-sub';
      }
    }

    // ── Retail ──
    setText('dpRetail',    retail ? '$' + retail.toLocaleString() : '—');
    setText('dpRetailSub', retail ? 'Original retail price' : 'Retail price unavailable');

    // ── Range (use retail as min, market as max) ──
    setText('dpMin', retail ? '$' + retail.toLocaleString() : '—');
    setText('dpMax', market ? '$' + market.toLocaleString() : '—');

    // ── Weekly Sales — TSDB doesn't have this; show silhouette instead ──
    setText('dpWeekly', p.silhouette || p.brand || '—');
    const weekSubEl = document.getElementById('dpWeeklySub');
    if (weekSubEl) {
      weekSubEl.textContent = 'Silhouette family';
      weekSubEl.className   = 'panel-sub';
    }

    // ── Outlook ──
    const score = UI.outlookScore({
      avg_price:     market,
      retail_price:  retail,
      weekly_orders: market && retail ? (market / retail > 1.5 ? 60 : 10) : 0
    });
    setText('dpVerdict', UI.outlookVerdict(score));
    const fillEl = document.getElementById('dpOutlookFill');
    if (fillEl) {
      fillEl.style.width      = '0%';
      fillEl.style.background = UI.outlookColor(score);
      setTimeout(() => { fillEl.style.width = score + '%'; }, 500);
    }

    // ── Description — TSDB has both 'story' and 'description' ──
    const raw = (p.story || p.description || 'No description available.').trim();
    setText('dpDesc', raw.length > 600 ? raw.slice(0, 600) + '…' : raw);

    // ── Marketplace links ──
    buildLinks(p.links);
  }

  function buildLinks(links) {
    if (!links) return;
    // Inject marketplace links into description panel if any exist
    const pairs = [
      ['StockX',        links.stockX],
      ['GOAT',          links.goat],
      ['Flight Club',   links.flightClub],
      ['Stadium Goods', links.stadiumGoods],
    ].filter(([, url]) => url);

    if (!pairs.length) return;
    const desc = document.getElementById('dpDesc');
    if (!desc) return;
    const linkBar = document.createElement('div');
    linkBar.style.cssText = 'margin-top:1.5rem;display:flex;gap:1rem;flex-wrap:wrap;';
    pairs.forEach(([label, url]) => {
      const a = document.createElement('a');
      a.href   = url;
      a.target = '_blank';
      a.rel    = 'noopener';
      a.textContent = `Buy on ${label} →`;
      a.style.cssText = 'font-family:"DM Mono",monospace;font-size:0.65rem;letter-spacing:0.1em;color:#0d0d0d;text-decoration:underline;text-underline-offset:3px;';
      linkBar.appendChild(a);
    });
    desc.parentNode.appendChild(linkBar);
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
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
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