// =============================================================================
// lightbox.js — LombokTrip Gallery Lightbox
// Features:
//   - Fullscreen overlay dengan gambar besar
//   - Navigasi prev/next (tombol + keyboard ← →)
//   - Thumbnail strip di bawah
//   - Tutup dengan Esc, klik overlay, atau tombol ✕
//   - Swipe kiri/kanan di mobile (touch events)
//   - Preload gambar prev/next untuk transisi mulus
//   - Counter "1 / 3" di pojok
// =============================================================================

(function () {
  "use strict";

  // ── State ──────────────────────────────────────────────────────────────────
  let _images  = [];   // array of URL strings
  let _current = 0;    // index aktif
  let _nama    = "";   // nama paket (judul)
  let _isOpen  = false;

  // Touch state untuk swipe
  let _touchStartX = 0;
  let _touchStartY = 0;

  // ── Buat elemen DOM ────────────────────────────────────────────────────────
  const _overlay = document.createElement("div");
  _overlay.id    = "lb-overlay";
  _overlay.innerHTML = `
    <div id="lb-backdrop" class="lb-backdrop"></div>

    <div id="lb-container" class="lb-container" role="dialog" aria-modal="true" aria-label="Gallery">

      <!-- Header: nama paket + counter + tombol tutup -->
      <div class="lb-header">
        <div class="lb-header-left">
          <p id="lb-nama" class="lb-nama"></p>
          <p id="lb-counter" class="lb-counter"></p>
        </div>
        <button id="lb-close" class="lb-btn-close" aria-label="Tutup">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Area gambar utama -->
      <div class="lb-stage">

        <!-- Tombol Prev -->
        <button id="lb-prev" class="lb-nav lb-prev" aria-label="Sebelumnya">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <!-- Gambar utama -->
        <div class="lb-img-wrap">
          <img id="lb-img" class="lb-img" src="" alt="" draggable="false" />
          <div id="lb-loader" class="lb-loader">
            <div class="lb-spinner"></div>
          </div>
        </div>

        <!-- Tombol Next -->
        <button id="lb-next" class="lb-nav lb-next" aria-label="Berikutnya">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

      </div>

      <!-- Thumbnail strip -->
      <div id="lb-thumbs" class="lb-thumbs" role="list"></div>

    </div>
  `;

  // ── CSS (inject ke head) ───────────────────────────────────────────────────
  const _style = document.createElement("style");
  _style.textContent = `
    #lb-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
    }
    #lb-overlay.lb-open {
      opacity: 1;
      pointer-events: all;
    }
    .lb-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.92);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
    }
    .lb-container {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: min(90vw, 1100px);
      max-height: 95vh;
      padding: 0 16px 16px;
    }
    /* Header */
    .lb-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0 10px;
      color: white;
    }
    .lb-header-left { display: flex; flex-direction: column; gap: 2px; }
    .lb-nama  { font-size: 14px; font-weight: 700; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60vw; }
    .lb-counter { font-size: 11px; color: #94a3b8; }
    .lb-btn-close {
      width: 36px; height: 36px;
      background: rgba(255,255,255,0.08);
      border: none; border-radius: 50%;
      color: #cbd5e1; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s, color 0.2s;
      flex-shrink: 0;
    }
    .lb-btn-close:hover { background: rgba(255,255,255,0.18); color: #fff; }

    /* Stage */
    .lb-stage {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-height: 0;
    }
    .lb-img-wrap {
      flex: 1;
      min-height: 0;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .lb-img {
      max-width: 100%;
      max-height: calc(95vh - 160px);
      object-fit: contain;
      border-radius: 12px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.5);
      transition: opacity 0.2s ease;
      user-select: none;
    }
    .lb-img.lb-loading { opacity: 0; }

    /* Loader */
    .lb-loader {
      position: absolute;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
    }
    .lb-loader.lb-show { display: flex; }
    .lb-spinner {
      width: 36px; height: 36px;
      border: 3px solid rgba(255,255,255,0.15);
      border-top-color: #14b8a6;
      border-radius: 50%;
      animation: lb-spin 0.7s linear infinite;
    }
    @keyframes lb-spin { to { transform: rotate(360deg); } }

    /* Nav buttons */
    .lb-nav {
      width: 44px; height: 44px;
      background: rgba(255,255,255,0.08);
      border: none; border-radius: 50%;
      color: #cbd5e1; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s, color 0.2s, opacity 0.2s;
      flex-shrink: 0;
    }
    .lb-nav:hover { background: rgba(255,255,255,0.18); color: #fff; }
    .lb-nav:disabled { opacity: 0.2; cursor: default; }
    .lb-nav.lb-hidden { opacity: 0; pointer-events: none; }

    /* Thumbnail strip */
    .lb-thumbs {
      display: flex;
      gap: 8px;
      justify-content: center;
      padding: 12px 0 0;
      overflow-x: auto;
      scrollbar-width: none;
      flex-shrink: 0;
    }
    .lb-thumbs::-webkit-scrollbar { display: none; }
    .lb-thumb {
      width: 56px; height: 42px;
      border-radius: 6px;
      object-fit: cover;
      cursor: pointer;
      opacity: 0.45;
      border: 2px solid transparent;
      transition: opacity 0.2s, border-color 0.2s, transform 0.2s;
      flex-shrink: 0;
    }
    .lb-thumb:hover { opacity: 0.75; }
    .lb-thumb.lb-active {
      opacity: 1;
      border-color: #14b8a6;
      transform: scale(1.08);
    }

    /* Responsive */
    @media (max-width: 640px) {
      .lb-container { padding: 0 8px 12px; }
      .lb-nav { width: 36px; height: 36px; }
      .lb-img { max-height: calc(95vh - 180px); }
      .lb-thumb { width: 44px; height: 32px; }
    }
  `;

  // ── Init: append ke body saat DOM ready ───────────────────────────────────
  function _mount() {
    document.head.appendChild(_style);
    document.body.appendChild(_overlay);
    _bindEvents();
  }

  // ── Navigasi ───────────────────────────────────────────────────────────────
  function _goTo(index) {
    if (index < 0 || index >= _images.length) return;
    _current = index;
    _renderCurrent();
    _preload(index + 1);
    _preload(index - 1);
  }

  function _prev() { _goTo(_current - 1); }
  function _next() { _goTo(_current + 1); }

  function _preload(index) {
    if (index >= 0 && index < _images.length) {
      const img = new Image();
      img.src   = _images[index];
    }
  }

  // ── Render state saat ini ──────────────────────────────────────────────────
  function _renderCurrent() {
    const img     = document.getElementById("lb-img");
    const loader  = document.getElementById("lb-loader");
    const counter = document.getElementById("lb-counter");
    const prevBtn = document.getElementById("lb-prev");
    const nextBtn = document.getElementById("lb-next");

    // Counter
    counter.textContent = `${_current + 1} / ${_images.length}`;

    // Prev / Next visibility
    if (_images.length <= 1) {
      prevBtn.classList.add("lb-hidden");
      nextBtn.classList.add("lb-hidden");
    } else {
      prevBtn.classList.toggle("lb-hidden", _current === 0);
      nextBtn.classList.toggle("lb-hidden", _current === _images.length - 1);
    }

    // Loading state
    img.classList.add("lb-loading");
    loader.classList.add("lb-show");

    img.onload = () => {
      img.classList.remove("lb-loading");
      loader.classList.remove("lb-show");
    };
    img.onerror = () => {
      loader.classList.remove("lb-show");
      img.classList.remove("lb-loading");
    };
    img.src = _images[_current];
    img.alt = `${_nama} – foto ${_current + 1}`;

    // Update thumbnail aktif
    const thumbs = document.querySelectorAll(".lb-thumb");
    thumbs.forEach((t, i) => t.classList.toggle("lb-active", i === _current));

    // Scroll thumbnail aktif ke tengah
    if (thumbs[_current]) {
      thumbs[_current].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }

  function _renderThumbs() {
    const strip = document.getElementById("lb-thumbs");
    strip.innerHTML = _images.map((url, i) => `
      <img src="${url}" alt="Foto ${i + 1}"
        class="lb-thumb ${i === _current ? "lb-active" : ""}"
        role="listitem"
        loading="lazy"
        onerror="this.style.display='none'" />
    `).join("");

    strip.querySelectorAll(".lb-thumb").forEach((el, i) => {
      el.addEventListener("click", () => _goTo(i));
    });

    // Sembunyikan strip jika hanya 1 gambar
    strip.style.display = _images.length <= 1 ? "none" : "";
  }

  // ── Open / Close ───────────────────────────────────────────────────────────
  function open(images, startIndex = 0, nama = "") {
    if (!images?.length) return;
    _images  = images;
    _current = Math.max(0, Math.min(startIndex, images.length - 1));
    _nama    = nama;
    _isOpen  = true;

    document.getElementById("lb-nama").textContent = nama;
    _renderThumbs();
    _renderCurrent();

    _overlay.classList.add("lb-open");
    document.body.style.overflow = "hidden";

    // Preload semua gambar kecil untuk thumbnail
    images.forEach((url) => { const i = new Image(); i.src = url; });
  }

  function close() {
    if (!_isOpen) return;
    _isOpen  = false;
    _overlay.classList.remove("lb-open");
    document.body.style.overflow = "";
    // Reset gambar agar tidak flash saat dibuka lagi
    setTimeout(() => {
      const img = document.getElementById("lb-img");
      if (img) img.src = "";
    }, 250);
  }

  // ── Event binding ──────────────────────────────────────────────────────────
  function _bindEvents() {
    // Tombol close
    document.getElementById("lb-close").addEventListener("click", close);
    // Klik backdrop
    document.getElementById("lb-backdrop").addEventListener("click", close);
    // Prev / Next buttons
    document.getElementById("lb-prev").addEventListener("click", _prev);
    document.getElementById("lb-next").addEventListener("click", _next);

    // Keyboard
    document.addEventListener("keydown", (e) => {
      if (!_isOpen) return;
      if (e.key === "Escape"    || e.key === "Esc") close();
      if (e.key === "ArrowLeft")  _prev();
      if (e.key === "ArrowRight") _next();
    });

    // Touch swipe
    const stage = _overlay.querySelector(".lb-stage");
    stage.addEventListener("touchstart", (e) => {
      _touchStartX = e.changedTouches[0].clientX;
      _touchStartY = e.changedTouches[0].clientY;
    }, { passive: true });

    stage.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - _touchStartX;
      const dy = e.changedTouches[0].clientY - _touchStartY;
      // Hanya proses jika swipe horizontal lebih dominan dari vertikal
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        dx < 0 ? _next() : _prev();
      }
    }, { passive: true });
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  window.LombokLightbox = { open, close, next: _next, prev: _prev };

  // Mount saat DOM siap
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _mount);
  } else {
    _mount();
  }
})();
