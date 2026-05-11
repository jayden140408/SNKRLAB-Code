/**
 * viewer.js — KicksDB image shape:
 *   image (string), gallery (array), gallery_360 (array)
 */

const Viewer = (() => {

  let frames   = [];
  let current  = 0;
  let dragging = false;
  let startX   = 0;
  let startFrame = 0;

  function load(product) {
    if (product.gallery_360 && product.gallery_360.length > 1) {
      frames = product.gallery_360;
    } else if (product.gallery && product.gallery.length > 0) {
      frames = product.gallery;
    } else if (product.image) {
      frames = [product.image];
    } else {
      frames = [];
    }

    current = 0;
    updateFrame();
    resetHint();
    buildStrip(product);
  }

  function updateFrame() {
    if (!frames.length) return;
    const el = document.getElementById('viewerImg');
    if (el) el.src = frames[current];
    const fc = document.getElementById('viewerFrame');
    if (fc) fc.textContent = `${current + 1} / ${frames.length}`;
  }

  function resetHint() {
    const h = document.getElementById('viewerHint');
    if (h) h.style.opacity = frames.length > 1 ? '1' : '0';
  }

  function buildStrip(product) {
    const strip = document.getElementById('galleryStrip');
    if (!strip) return;
    const imgs = product.gallery && product.gallery.length
      ? product.gallery.slice(0, 6)
      : (product.image ? [product.image] : []);

    strip.innerHTML = imgs.map((src, i) => `
      <img class="g-thumb${i === 0 ? ' active' : ''}"
        src="${src}" alt="View ${i + 1}"
        onclick="Viewer.setFromThumb('${src}', this)"
        loading="lazy" />
    `).join('');
  }

  function setFromThumb(src, el) {
    frames  = [src];
    current = 0;
    updateFrame();
    document.querySelectorAll('.g-thumb').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
  }

  function onMouseDown(e) {
    if (frames.length < 2) return;
    dragging = true; startX = e.clientX; startFrame = current;
    const h = document.getElementById('viewerHint');
    if (h) h.style.opacity = '0';
  }
  function onMouseMove(e) {
    if (!dragging || frames.length < 2) return;
    const el   = document.getElementById('viewerContainer');
    const dx   = e.clientX - startX;
    const sens = el ? el.offsetWidth / frames.length : 20;
    current = ((startFrame - Math.round(dx / sens)) % frames.length + frames.length) % frames.length;
    updateFrame();
  }
  function onMouseUp() { dragging = false; }

  function onTouchStart(e) {
    if (frames.length < 2) return;
    dragging = true; startX = e.touches[0].clientX; startFrame = current;
  }
  function onTouchMove(e) {
    if (!dragging || frames.length < 2) return;
    const el   = document.getElementById('viewerContainer');
    const dx   = e.touches[0].clientX - startX;
    const sens = el ? el.offsetWidth / frames.length : 20;
    current = ((startFrame - Math.round(dx / sens)) % frames.length + frames.length) % frames.length;
    updateFrame();
  }
  function onTouchEnd() { dragging = false; }

  function bindEvents() {
    const c = document.getElementById('viewerContainer');
    if (!c) return;
    c.addEventListener('mousedown',  onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
    c.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend',  onTouchEnd);
  }

  return { load, setFromThumb, bindEvents };

})();