// =============================================================================
// admin-hero.js
// CRUD Hero Slideshow: load grid, tambah, edit, hapus gambar hero
// Depends: admin-core.js (ADMIN_CONFIG, AdminState, showToast)
// =============================================================================

// ── ELEMEN HERO ───────────────────────────────────────────────────────────────
const HeroEls = {
  heroGrid      : document.getElementById("hero-grid"),
  btnTambah     : document.getElementById("btn-tambah-hero"),

  // Modal form tambah/edit
  modal         : document.getElementById("modal-hero"),
  modalTitle    : document.getElementById("modal-hero-title"),
  modalClose    : document.getElementById("modal-hero-close"),
  modalCancel   : document.getElementById("modal-hero-cancel"),
  form          : document.getElementById("hero-form"),
  submitBtn     : document.getElementById("hero-submit-btn"),
  submitText    : document.getElementById("hero-submit-text"),

  // Modal konfirmasi hapus
  modalHapus    : document.getElementById("modal-hapus-hero"),
  hapusCancel   : document.getElementById("hapus-hero-cancel"),
  hapusConfirm  : document.getElementById("hapus-hero-confirm"),

  // Form fields
  formId        : document.getElementById("hero-form-id"),
  judulInput    : document.getElementById("hero-judul-input"),
  subjudulInput : document.getElementById("hero-subjudul-input"),
  urutanInput   : document.getElementById("hero-urutan"),
  aktifCheck    : document.getElementById("hero-aktif"),
  gambarFile    : document.getElementById("hero-gambar-file"),
  gambarUrl     : document.getElementById("hero-gambar-url"),
  imgPreview    : document.getElementById("hero-img-preview"),
  imgPlaceholder: document.getElementById("hero-img-placeholder"),
};

// ── LOAD & RENDER GRID ────────────────────────────────────────────────────────

/** Fetch semua hero images dari API dan render ke grid */
async function loadHero() {
  HeroEls.heroGrid.innerHTML = `
    <div class="col-span-full text-center py-12 text-slate-400">
      <i class="fa-solid fa-spinner fa-spin text-2xl mb-2 block"></i> Memuat...
    </div>`;

  try {
    const res  = await fetch(ADMIN_CONFIG.API_HERO);
    const json = await res.json();
    _renderHeroGrid(json.data || []);
  } catch (e) {
    HeroEls.heroGrid.innerHTML = `
      <div class="col-span-full text-center py-12 text-red-400">
        <i class="fa-solid fa-triangle-exclamation text-2xl mb-2 block"></i>
        Gagal memuat: ${e.message}
      </div>`;
  }
}

/** Render kartu hero ke dalam grid */
function _renderHeroGrid(heroes) {
  if (heroes.length === 0) {
    HeroEls.heroGrid.innerHTML = `
      <div class="col-span-full text-center py-12 text-slate-400">
        <i class="fa-solid fa-images text-3xl mb-2 block"></i>
        <p>Belum ada gambar hero. Tambahkan sekarang.</p>
      </div>`;
    return;
  }

  HeroEls.heroGrid.innerHTML = heroes.map((h) => `
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group">

      <!-- Thumbnail -->
      <div class="relative h-44 overflow-hidden bg-slate-100">
        <img src="${h.gambar}" alt="${h.judul || ""}"
          class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          onerror="this.src='https://placehold.co/400x200/e2e8f0/94a3b8?text=No+Image'" />

        <!-- Badge urutan -->
        <div class="absolute top-3 left-3 w-7 h-7 rounded-full bg-brand-600 text-white
                    text-xs font-black flex items-center justify-center shadow">
          ${h.urutan}
        </div>

        <!-- Badge status aktif -->
        <div class="absolute top-3 right-3">
          <span class="text-xs font-bold px-2 py-1 rounded-full
            ${h.aktif ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}">
            ${h.aktif ? "✓ Aktif" : "✗ Nonaktif"}
          </span>
        </div>
      </div>

      <!-- Info + Aksi -->
      <div class="p-4">
        <p class="font-bold text-slate-800 text-sm truncate">
          ${h.judul || '<span class="text-slate-400 italic">Tanpa judul</span>'}
        </p>
        <p class="text-xs text-slate-400 mt-0.5 truncate">${h.subjudul || ""}</p>

        <div class="flex gap-2 mt-4">
          <button onclick="openEditHero(${h.id})"
            class="flex-1 py-1.5 rounded-lg bg-brand-50 text-brand-600
                   hover:bg-brand-600 hover:text-white text-xs font-bold transition
                   flex items-center justify-center gap-1">
            <i class="fa-solid fa-pen"></i> Edit
          </button>
          <button onclick="openHapusHero(${h.id})"
            class="flex-1 py-1.5 rounded-lg bg-red-50 text-red-500
                   hover:bg-red-500 hover:text-white text-xs font-bold transition
                   flex items-center justify-center gap-1">
            <i class="fa-solid fa-trash"></i> Hapus
          </button>
        </div>
      </div>

    </div>
  `).join("");
}

// ── MODAL HERO ────────────────────────────────────────────────────────────────

function _openModalHero() {
  HeroEls.modal.classList.remove("hidden");
  HeroEls.modal.classList.add("flex");
}

function _closeModalHero() {
  HeroEls.modal.classList.add("hidden");
  HeroEls.modal.classList.remove("flex");
  HeroEls.form.reset();
  _resetPreviewHero();
  AdminState.editingHeroId = null;
}

// Buka modal tambah baru
HeroEls.btnTambah.addEventListener("click", () => {
  AdminState.editingHeroId    = null;
  HeroEls.aktifCheck.checked  = true;
  HeroEls.modalTitle.textContent = "Tambah Hero Image";
  HeroEls.submitText.textContent = "Simpan";
  _openModalHero();
});

// Tutup modal
HeroEls.modalClose.addEventListener("click",  _closeModalHero);
HeroEls.modalCancel.addEventListener("click", _closeModalHero);
HeroEls.modal.addEventListener("click", (e) => {
  if (e.target === HeroEls.modal) _closeModalHero();
});

/** Buka modal edit — fetch data hero dari API lalu isi form */
function openEditHero(id) {
  fetch(`${ADMIN_CONFIG.API_HERO}/${id}`)
    .then((r) => r.json())
    .then(({ data: h }) => {
      AdminState.editingHeroId         = h.id;
      HeroEls.formId.value             = h.id;
      HeroEls.judulInput.value         = h.judul    || "";
      HeroEls.subjudulInput.value      = h.subjudul || "";
      HeroEls.urutanInput.value        = h.urutan;
      HeroEls.aktifCheck.checked       = Boolean(h.aktif);
      HeroEls.gambarUrl.value          = h.gambar?.startsWith("/uploads/") ? "" : (h.gambar || "");

      if (h.gambar) _showPreviewHero(h.gambar);
      else _resetPreviewHero();

      HeroEls.modalTitle.textContent = "Edit Hero Image";
      HeroEls.submitText.textContent = "Update";
      _openModalHero();
    })
    .catch(() => showToast("Gagal memuat data hero", false));
}
window.openEditHero = openEditHero;

// ── SUBMIT FORM HERO ──────────────────────────────────────────────────────────
HeroEls.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  HeroEls.submitBtn.disabled      = true;
  HeroEls.submitText.innerHTML    = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

  const fd = new FormData();
  fd.append("judul",    HeroEls.judulInput.value);
  fd.append("subjudul", HeroEls.subjudulInput.value);
  fd.append("urutan",   HeroEls.urutanInput.value || "");
  fd.append("aktif",    HeroEls.aktifCheck.checked ? "1" : "0");

  const file    = HeroEls.gambarFile.files[0];
  const urlVal  = HeroEls.gambarUrl.value;
  if (file)          fd.append("gambar",     file);
  else if (urlVal)   fd.append("gambar_url", urlVal);

  try {
    const url    = AdminState.editingHeroId
      ? `${ADMIN_CONFIG.API_HERO}/${AdminState.editingHeroId}`
      : ADMIN_CONFIG.API_HERO;
    const method = AdminState.editingHeroId ? "PUT" : "POST";
    const res    = await fetch(url, { method, body: fd });
    const json   = await res.json();
    if (!res.ok) throw new Error(json.message);

    _closeModalHero();
    await loadHero();
    showToast(AdminState.editingHeroId ? "Hero image diupdate! ✅" : "Hero image ditambahkan! ✅", true);
  } catch (err) {
    showToast("Gagal: " + err.message, false);
  } finally {
    HeroEls.submitBtn.disabled     = false;
    HeroEls.submitText.textContent = AdminState.editingHeroId ? "Update" : "Simpan";
  }
});

// ── HAPUS HERO ────────────────────────────────────────────────────────────────
function openHapusHero(id) {
  AdminState.hapusHeroId = id;
  HeroEls.modalHapus.classList.remove("hidden");
  HeroEls.modalHapus.classList.add("flex");
}
window.openHapusHero = openHapusHero;

HeroEls.hapusCancel.addEventListener("click", () => {
  HeroEls.modalHapus.classList.add("hidden");
  HeroEls.modalHapus.classList.remove("flex");
});

HeroEls.hapusConfirm.addEventListener("click", async () => {
  if (!AdminState.hapusHeroId) return;
  try {
    await fetch(`${ADMIN_CONFIG.API_HERO}/${AdminState.hapusHeroId}`, { method: "DELETE" });
    HeroEls.modalHapus.classList.add("hidden");
    HeroEls.modalHapus.classList.remove("flex");
    await loadHero();
    showToast("Hero image dihapus", true);
  } catch (e) {
    showToast("Gagal menghapus hero image", false);
  }
  AdminState.hapusHeroId = null;
});

// ── IMAGE PREVIEW (FORM HERO) ─────────────────────────────────────────────────
HeroEls.gambarFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    _showPreviewHero(ev.target.result);
    HeroEls.gambarUrl.value = "";
  };
  reader.readAsDataURL(file);
});

HeroEls.gambarUrl.addEventListener("input", (e) => {
  const url = e.target.value.trim();
  if (url) { _showPreviewHero(url); HeroEls.gambarFile.value = ""; }
  else _resetPreviewHero();
});

function _showPreviewHero(src) {
  HeroEls.imgPreview.src = src;
  HeroEls.imgPreview.classList.remove("hidden");
  HeroEls.imgPlaceholder.classList.add("hidden");
}

function _resetPreviewHero() {
  HeroEls.imgPreview.src = "";
  HeroEls.imgPreview.classList.add("hidden");
  HeroEls.imgPlaceholder.classList.remove("hidden");
}
