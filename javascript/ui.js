/**
 * ui.js
 * Shared UI utilities — toast notifications, error display,
 * strip toggles, body scroll lock, etc.
 */

const UI = (() => {

  let toastTimer = null;

  /**
   * Show a toast notification
   * @param {string} msg
   * @param {number} duration ms
   */
  function toast(msg, duration = 2600) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), duration);
  }

  /**
   * Show / hide the API key strip
   */
  function toggleApiStrip() {
    const strip = document.getElementById('apiStrip');
    strip.classList.toggle('visible');
  }

  /**
   * Show a search error message
   * @param {string} msg — empty string to hide
   */
  function showError(msg) {
    const el = document.getElementById('searchError');
    if (msg) {
      el.textContent = msg;
      el.classList.add('visible');
    } else {
      el.textContent = '';
      el.classList.remove('visible');
    }
  }

  /**
   * Lock body scroll (used when detail overlay opens)
   */
  function lockScroll() {
    document.body.style.overflow = 'hidden';
  }

  /**
   * Unlock body scroll
   */
  function unlockScroll() {
    document.body.style.overflow = '';
  }

  /**
   * Scroll the page to the grid section smoothly
   */
  function scrollToGrid() {
    const grid = document.getElementById('gridSection');
    if (grid) {
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Format a dollar amount
   * @param {number} val
   * @returns {string}
   */
  function formatPrice(val) {
    if (!val && val !== 0) return '—';
    return '$' + Math.round(val).toLocaleString();
  }

  /**
   * Compute price premium over retail as a string like "+42%"
   * @param {number} market
   * @param {number} retail
   * @returns {{ pct: number, label: string, cls: string }}
   */
  function calcPremium(market, retail) {
    if (!market || !retail) return null;
    const pct = ((market - retail) / retail) * 100;
    const sign = pct >= 0 ? '+' : '';
    const cls = pct >= 0 ? 'up' : 'down';
    return { pct, label: `${sign}${Math.round(pct)}% vs retail`, cls };
  }

  /**
   * Determine momentum label from weekly orders
   * @param {number} weekly
   * @returns {{ label: string, cls: string }}
   */
  function momentum(weekly) {
    if (weekly > 50) return { label: '↑ Hot', cls: 'up' };
    if (weekly > 15) return { label: '→ Stable', cls: 'flat' };
    return { label: '↓ Slow', cls: 'down' };
  }

  /**
   * Compute a 0–100 outlook score from product data
   * @param {Object} p — product object
   * @returns {number}
   */
  function outlookScore(p) {
    let score = 50;
    const weekly = p.weekly_orders || 0;
    const avg    = p.avg_price || 0;
    const retail = p.retail_price || 0;

    if (weekly > 60) score += 25;
    else if (weekly > 25) score += 12;
    else if (weekly < 5)  score -= 18;

    if (avg && retail) {
      const ratio = (avg - retail) / retail;
      if (ratio > 0.6)  score += 20;
      else if (ratio > 0.2) score += 10;
      else if (ratio < 0)   score -= 14;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Verdict text from score
   */
  function outlookVerdict(score) {
    if (score >= 70) return 'Strong Buy Signal';
    if (score >= 50) return 'Hold Position';
    return 'Softening Demand';
  }

  /**
   * Color for outlook fill bar
   */
  function outlookColor(score) {
    if (score >= 65) return '#1a7a3c';
    if (score >= 40) return '#c8a800';
    return '#d63b2f';
  }

  return {
    toast, toggleApiStrip, showError,
    lockScroll, unlockScroll, scrollToGrid,
    formatPrice, calcPremium, momentum,
    outlookScore, outlookVerdict, outlookColor
  };

})();