/**
 * main.js
 * Entry point — page wipe, cursor, marquee, letter split, magnetic cards
 */

document.addEventListener('DOMContentLoaded', () => {

  // ─── PAGE WIPE INTRO ───
  const wipe = document.createElement('div');
  wipe.className = 'page-wipe';
  document.body.prepend(wipe);
  wipe.addEventListener('animationend', () => wipe.remove());

  // ─── CUSTOM CURSOR ───
  const dot  = document.createElement('div');
  const ring = document.createElement('div');
  dot.className  = 'cursor-dot';
  ring.className = 'cursor-ring';
  document.body.append(dot, ring);

  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left  = mx + 'px';
    dot.style.top   = my + 'px';
  });
  // Ring lags behind cursor for smooth feel
  function animRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animRing);
  }
  animRing();

  // Scale ring on hoverable elements
  document.addEventListener('mouseover', e => {
    if (e.target.closest('button, a, .product-card, input, .ftab, .nav-link')) {
      ring.style.width        = '56px';
      ring.style.height       = '56px';
      ring.style.borderColor  = 'rgba(13,13,13,0.6)';
    }
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest('button, a, .product-card, input, .ftab, .nav-link')) {
      ring.style.width        = '36px';
      ring.style.height       = '36px';
      ring.style.borderColor  = 'rgba(13,13,13,0.4)';
    }
  });

  // ─── CURSOR SPOTLIGHT ───
  const spotlight = document.createElement('div');
  spotlight.className = 'cursor-spotlight';
  document.body.append(spotlight);
  document.addEventListener('mousemove', e => {
    spotlight.style.left = e.clientX + 'px';
    spotlight.style.top  = e.clientY + 'px';
  });

  // ─── HERO TITLE LETTER SPLIT ───
  splitHeroTitle();

  // ─── MARQUEE ───
  buildMarquee();

  // ─── MAGNETIC CARD HOVER ───
  document.getElementById('productsGrid').addEventListener('mousemove', magneticCard);
  document.getElementById('productsGrid').addEventListener('mouseleave', resetCards);

  // ─── VIEWER DRAG ───
  Viewer.bindEvents();

  // ─── SEARCH ENTER KEY ───
  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') Search.run();
  });

  // ─── CLOSE DETAIL ON ESCAPE ───
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') Detail.close();
  });

  // ─── NAV SHADOW ON SCROLL ───
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.style.boxShadow = window.scrollY > 10
      ? '0 2px 24px rgba(0,0,0,0.07)'
      : 'none';
  }, { passive: true });

  // ─── HEALTH CHECK ───
  API.healthCheck().then(h => {
    if (!h.apiKeySet) {
      console.warn('[VAULT] No RAPIDAPI_KEY in .env — add your key and restart');
    } else {
      console.log('[VAULT] ✓ API key detected. Ready.');
    }
  });

});

// ── Split hero title into individual animated chars ──
function splitHeroTitle() {
  const el = document.querySelector('.hero-title');
  if (!el) return;
  const html = el.innerHTML;
  // Preserve <br> tags and <span> wrapper
  el.innerHTML = html.replace(/>([^<]+)</g, (match, text, offset, str) => {
    const tag = match[0] === '>' ? '>' : match;
    const chars = text.split('').map((c, i) => {
      if (c === ' ') return ' ';
      const delay = (0.3 + i * 0.04).toFixed(2);
      return `<span class="char" style="animation-delay:${delay}s">${c}</span>`;
    }).join('');
    return `>${chars}<`;
  });
}

// ── Build the marquee ticker ──
function buildMarquee() {
  // Insert marquee after hero section
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const items = [
    { label: 'VAULT', value: 'Sneaker & Apparel Intelligence' },
    { label: 'MARKET DATA', value: 'Real-time Pricing' },
    { label: 'RESALE PREMIUMS', value: 'Live Analysis' },
    { label: 'PRICE HISTORY', value: 'Track Every Drop' },
    { label: 'SNEAKERS', value: '100,000+ Products' },
    { label: 'STREETWEAR', value: 'Market Intelligence' },
    { label: 'VAULT', value: 'Sneaker & Apparel Intelligence' },
    { label: 'MARKET DATA', value: 'Real-time Pricing' },
    { label: 'RESALE PREMIUMS', value: 'Live Analysis' },
    { label: 'PRICE HISTORY', value: 'Track Every Drop' },
    { label: 'SNEAKERS', value: '100,000+ Products' },
    { label: 'STREETWEAR', value: 'Market Intelligence' },
  ];

  const wrap  = document.createElement('div');
  wrap.className = 'marquee-wrap';
  const track = document.createElement('div');
  track.className = 'marquee-track';
  track.innerHTML = items.map(item =>
    `<span class="marquee-item"><span>${item.label}</span><span class="marquee-dot">·</span>${item.value}</span>`
  ).join('');
  wrap.appendChild(track);
  hero.insertAdjacentElement('afterend', wrap);
}

// ── Magnetic hover effect on product cards ──
function magneticCard(e) {
  const card = e.target.closest('.product-card');
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const cx   = rect.left + rect.width  / 2;
  const cy   = rect.top  + rect.height / 2;
  const dx   = (e.clientX - cx) / (rect.width  / 2);
  const dy   = (e.clientY - cy) / (rect.height / 2);
  card.style.transform = `translate(${dx * 6}px, ${dy * 6}px) scale(1.02)`;
  card.style.transition = 'transform .1s ease-out';
}

function resetCards() {
  document.querySelectorAll('.product-card').forEach(c => {
    c.style.transform  = '';
    c.style.transition = 'transform .5s cubic-bezier(.22,1,.36,1)';
  });
}