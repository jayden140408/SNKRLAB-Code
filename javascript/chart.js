/**
 * chart.js
 * Loads and renders the price history / volume chart
 * using Chart.js with DRIP-style minimal aesthetics.
 */

const Chart = (() => {

  let instance = null;
  let chartData = { avg: null, volume: null };
  let activeView = 'avg';

  /**
   * Load chart data for a product and render
   * @param {Object} product
   */
  async function load(product) {
    chartData = { avg: null, volume: null };
    activeView = 'avg';

    // Reset tab state
    document.querySelectorAll('.ctab').forEach((t, i) => {
      t.classList.toggle('on', i === 0);
    });

    try {
      const sales = await API.getDailySales(product.id || product.slug);
      if (sales && sales.length) {
        const sorted = [...sales].reverse().slice(-90);
        chartData.avg = {
          labels: sorted.map(s => fmtDate(s.date)),
          data:   sorted.map(s => Math.round(s.avg_amount || 0))
        };
        chartData.volume = {
          labels: sorted.map(s => fmtDate(s.date)),
          data:   sorted.map(s => s.orders || 0)
        };
        draw('avg');
        return;
      }
    } catch (_) {
      // Fall through to estimated chart
    }

    // Estimated fallback using product price metadata
    buildFallback(product);
    UI.toast('Estimated chart — live history needs KicksDB premium', 3500);
  }

  /**
   * Build a plausible estimated chart from product min/avg/max
   */
  function buildFallback(p) {
    const avg = p.avg_price || 150;
    const min = p.min_price || avg * 0.75;
    const max = p.max_price || avg * 1.35;
    const labels = [], prices = [], vols = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      labels.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
      const t     = (12 - i) / 12;
      const noise = (Math.random() - 0.45) * (max - min) * 0.15;
      prices.push(Math.round(min + (max - min) * t * 0.65 + noise));
      vols.push(Math.round(Math.random() * 70 + 15));
    }

    chartData.avg    = { labels, data: prices };
    chartData.volume = { labels, data: vols };
    draw('avg');
  }

  /**
   * Switch between avg price and volume views
   */
  function switchView(view, el) {
    activeView = view;
    document.querySelectorAll('.ctab').forEach(t => t.classList.remove('on'));
    el.classList.add('on');
    draw(view);
  }

  /**
   * Draw the chart
   */
  function draw(view) {
    const d = chartData[view];
    if (!d) return;
    destroy();

    const canvas = document.getElementById('priceChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const isPrice = view === 'avg';

    instance = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: d.labels,
        datasets: [{
          label: isPrice ? 'Avg Price' : 'Daily Orders',
          data: d.data,
          borderColor: '#0d0d0d',
          backgroundColor: 'rgba(13,13,13,0.04)',
          borderWidth: 1.5,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: '#0d0d0d',
          fill: true,
          tension: 0.35
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0d0d0d',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            titleColor: '#888',
            bodyColor: '#f2efe9',
            titleFont: { family: 'DM Mono', size: 10 },
            bodyFont:  { family: 'DM Mono', size: 12 },
            padding: 10,
            callbacks: {
              label: ctx => isPrice
                ? `$${ctx.parsed.y.toLocaleString()}`
                : `${ctx.parsed.y} orders`
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#aaa',
              font: { family: 'DM Mono', size: 9 },
              maxRotation: 45,
              autoSkip: true,
              maxTicksLimit: 10
            },
            grid:   { color: 'rgba(0,0,0,0.05)' },
            border: { color: 'rgba(0,0,0,0.08)' }
          },
          y: {
            ticks: {
              color: '#aaa',
              font: { family: 'DM Mono', size: 9 },
              callback: v => isPrice ? `$${v.toLocaleString()}` : v
            },
            grid:   { color: 'rgba(0,0,0,0.05)' },
            border: { color: 'rgba(0,0,0,0.08)' }
          }
        }
      }
    });
  }

  function destroy() {
    if (instance) { instance.destroy(); instance = null; }
  }

  function fmtDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return { load, switchView, destroy };

})();