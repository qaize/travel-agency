// =============================================================================
// admin-paket.js
// CRUD Paket Wisata: load, render tabel, filter, tambah, edit, hapus, toggle aktif
// Support: multiple images per paket (max 6, upload file + URL eksternal)
// Depends: admin-core.js (ADMIN_CONFIG, AdminState, showToast, formatRupiah)
// =============================================================================

// ── ELEMEN PAKET ─────────────────────────────────────────────────────────────
const PaketEls = {
  tableBody    : document.getElementById("table-body"),
  btnTambah    : document.getElementById("btn-tambah"),
  filterSearch : document.getElementById("filter-search"),
  filterWilayah: document.getElementById("filter-wilayah"),
  filterKategori: document.getElementById("filter-kategori"),

  // Modal form tambah/edit
  modalForm  : document.getElementById("modal-form"),
  modalTitle : document.getElementById("modal-title"),
  modalClose : document.getElementById("modal-close"),
  modalCancel: document.getElementById("modal-cancel"),
  paketForm  : document.getElementById("paket-form"),

  // Modal konfirmasi hapus
  modalHapus  : document.getElementById("modal-hapus"),
  hapusNamaText: document.getElementById("hapus-nama-text"),
  hapusCancel : document.getElementById("hapus-cancel"),
  hapusConfirm: document.getElementById("hapus-confirm"),
};

// ── STATE GAMBAR FORM ─────────────────────────────────────────────────────────
// Menyimpan daftar gambar yang sedang di-manage di form (sebelum submit)
const GambarState = {
  // Array of { type: 'existing'|'file'|'url', value: string|File, preview: string }
  items: [],

  /** Tambah item gambar baru */
  add(type, value, preview) {
    if (this.items.length >= 6) return false; // max 6
    this.items.push({ type, value, preview });
    return true;
  },

  /** Hapus item berdasarkan index */
  remove(index) {
    this.items.splice(index, 1);
  },

  /** Reset state */
  clear() {
    this.items = [];
  },

  /** Apakah masih bisa tambah gambar */
  get canAdd() { return this.items.length < 6; },
};

// ── LOAD & RENDER ─────────────────────────────────────────────────────────────

async function loadPaket() {
  PaketEls.tableBody.innerHTML = `
    <tr>
      <td colspan="7" class="text-center py-12 text-slate-400">
        <i class="fa-solid fa-spinner fa-spin text-2xl mb-2 block"></i> Memuat data...
      </td>
    </tr>`;

  try {
    const res  = await fetch(ADMIN_CONFIG.API_PAKET);
    const json = await res.json();
    AdminState.allPaket = json.data || [];
    _updateStatsPaket();
    renderTabelPaket();

    // Sinkron badge testimoni pending di sidebar
    fetch(`${ADMIN_CONFIG.API_TESTIMONI}?status=pending`)
      .then((r) => r.json())
      .then((j) => {
        const n     = (j.data || []).length;
        const badge = document.getElementById("testi-badge");
        if (!badge) return;
        if (n > 0) { badge.textContent = n; badge.classList.remove("hidden"); }
        else badge.classList.add("hidden");
      })
      .catch(() => {});
  } catch (e) {
    PaketEls.tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-12 text-red-400">
          <i class="fa-solid fa-triangle-exclamation text-2xl mb-2 block"></i>
          Gagal memuat data: ${e.message}
        </td>
      </tr>`;
  }
}

function _updateStatsPaket() {
  const p = AdminState.allPaket;
  document.getElementById("stat-total")  .textContent = p.length;
  document.getElementById("stat-aktif")  .textContent = p.filter((x) => x.aktif).length;
  document.getElementById("stat-lombok") .textContent = p.filter((x) => x.wilayah === "lombok").length;
  document.getElementById("stat-sumbawa").textContent = p.filter((x) => x.wilayah === "sumbawa").length;
}

function renderTabelPaket() {
  const q        = PaketEls.filterSearch.value.toLowerCase();
  const wilayah  = PaketEls.filterWilayah.value;
  const kategori = PaketEls.filterKategori.value;

  const filtered = AdminState.allPaket.filter((p) => {
    const matchQ = !q || p.nama.toLowerCase().includes(q) || p.lokasi.toLowerCase().includes(q);
    const matchW = !wilayah  || p.wilayah  === wilayah;
    const matchK = !kategori || p.kategori === kategori;
    return matchQ && matchW && matchK;
  });

  if (filtered.length === 0) {
    PaketEls.tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-12 text-slate-400">
          Tidak ada paket yang cocok dengan filter
        </td>
      </tr>`;
    return;
  }

  PaketEls.tableBody.innerHTML = filtered.map((p) => {
    // gambar sekarang selalu array dari API
    const gambarArr   = Array.isArray(p.gambar) ? p.gambar : (p.gambar ? [p.gambar] : []);
    const thumbSrc    = gambarArr[0] || "https://placehold.co/64x48/e2e8f0/94a3b8?text=No+Img";
    const jumlahFoto  = gambarArr.length;

    return `
    <tr class="hover:bg-slate-50 transition">
      <!-- Gambar + Nama -->
      <td class="px-4 py-3">
        <div class="flex items-center gap-3">
          <div class="relative shrink-0">
            <img src="${thumbSrc}" alt="${p.nama}"
              class="w-16 h-12 rounded-lg object-cover bg-slate-100"
              onerror="this.src='https://placehold.co/64x48/e2e8f0/94a3b8?text=No+Img'" />
            ${jumlahFoto > 1
              ? `<span class="absolute -top-1.5 -right-1.5 bg-brand-600 text-white text-[9px] font-black
                             w-4 h-4 rounded-full flex items-center justify-center shadow">
                   ${jumlahFoto}
                 </span>`
              : ""}
          </div>
          <div>
            <p class="font-bold text-slate-900 text-sm leading-tight">${p.nama}</p>
            <p class="text-xs text-slate-400">${p.lokasi}</p>
          </div>
        </div>
      </td>

      <!-- Wilayah -->
      <td class="px-4 py-3">
        <span class="capitalize text-xs font-semibold px-2 py-1 rounded-full
          ${p.wilayah === "lombok" ? "bg-teal-50 text-teal-700" : "bg-orange-50 text-orange-700"}">
          ${p.wilayah === "sumbawa" ? "Sumbawa" : "Lombok"}
        </span>
      </td>

      <!-- Kategori -->
      <td class="px-4 py-3">
        <span class="capitalize text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-600">
          ${p.kategori}
        </span>
      </td>

      <!-- Harga -->
      <td class="px-4 py-3 font-bold text-slate-900 text-sm">
        ${p.harga_coret
          ? `<span class="text-xs text-slate-400 line-through block">${formatRupiah(p.harga_coret)}</span>`
          : ""}
        <span class="${p.harga_coret ? "text-red-500" : "text-slate-900"}">${formatRupiah(p.harga)}</span>
        ${p.harga_coret
          ? `<span class="ml-1 text-xs bg-red-100 text-red-600 font-black px-1.5 py-0.5 rounded">
               -${Math.round((1 - p.harga / p.harga_coret) * 100)}%
             </span>`
          : ""}
      </td>

      <!-- Durasi -->
      <td class="px-4 py-3 text-sm text-slate-600">${p.durasi}</td>

      <!-- Status Toggle -->
      <td class="px-4 py-3">
        <button onclick="toggleAktifPaket(${p.id}, ${p.aktif})"
          class="text-xs font-bold px-2.5 py-1 rounded-full transition
            ${p.aktif
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"}">
          ${p.aktif ? "✓ Aktif" : "✗ Nonaktif"}
        </button>
      </td>

      <!-- Aksi -->
      <td class="px-4 py-3">
        <div class="flex items-center justify-center gap-2">
          <button onclick="openEditPaket(${p.id})"
            class="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white
                   flex items-center justify-center transition text-sm" title="Edit">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button onclick="openHapusPaket(${p.id}, '${p.nama.replace(/'/g, "\\'")}')"
            class="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white
                   flex items-center justify-center transition text-sm" title="Hapus">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>`;
  }).join("");
}

PaketEls.filterSearch.addEventListener("input",    renderTabelPaket);
PaketEls.filterWilayah.addEventListener("change",  renderTabelPaket);
PaketEls.filterKategori.addEventListener("change", renderTabelPaket);

// ── MODAL FORM ────────────────────────────────────────────────────────────────

function _openModalPaket(title) {
  PaketEls.modalTitle.textContent = title;
  PaketEls.modalForm.classList.remove("hidden");
  PaketEls.modalForm.classList.add("flex");
}

function _closeModalPaket() {
  PaketEls.modalForm.classList.add("hidden");
  PaketEls.modalForm.classList.remove("flex");
  PaketEls.paketForm.reset();
  GambarState.clear();
  _renderGambarGrid();
  AdminState.editingId = null;
  document.getElementById("form-submit-text").textContent = "Simpan Paket";
}

PaketEls.btnTambah.addEventListener("click", () => {
  AdminState.editingId = null;
  PaketEls.paketForm.reset();
  GambarState.clear();
  _renderGambarGrid();
  document.getElementById("form-id").value              = "";
  document.getElementById("form-aktif").checked         = true;
  document.getElementById("form-submit-text").textContent = "Simpan Paket";
  _openModalPaket("Tambah Paket Wisata");
});

PaketEls.modalClose.addEventListener("click",  _closeModalPaket);
PaketEls.modalCancel.addEventListener("click", _closeModalPaket);
PaketEls.modalForm.addEventListener("click", (e) => {
  if (e.target === PaketEls.modalForm) _closeModalPaket();
});

// ── MULTI-IMAGE MANAGER (di dalam form) ──────────────────────────────────────

/**
 * Render grid preview gambar di dalam form.
 * Tiap item punya tombol hapus. Terakhir ada tombol "Tambah".
 */
function _renderGambarGrid() {
  const container = document.getElementById("gambar-grid");
  if (!container) return;

  const items    = GambarState.items;
  const canAdd   = GambarState.canAdd;
  const maxLabel = `${items.length}/6`;

  container.innerHTML = `
    ${items.map((item, i) => `
      <div class="relative group rounded-xl overflow-hidden bg-slate-100 aspect-square">
        <img src="${item.preview}" alt="Gambar ${i + 1}"
          class="w-full h-full object-cover" />

        <!-- Badge posisi -->
        ${i === 0
          ? `<div class="absolute top-1.5 left-1.5 bg-brand-600 text-white text-[9px] font-black
                         px-1.5 py-0.5 rounded-full shadow">COVER</div>`
          : ""}

        <!-- Tombol hapus -->
        <button type="button" onclick="_removeGambar(${i})"
          class="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full
                 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs shadow">
          <i class="fa-solid fa-xmark"></i>
        </button>

        <!-- Overlay urutan jika hover dan bisa pindah -->
        ${items.length > 1 ? `
          <div class="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center py-0.5 opacity-0 group-hover:opacity-100 transition">
            #${i + 1}
          </div>` : ""}
      </div>
    `).join("")}

    ${canAdd ? `
      <!-- Tombol tambah gambar -->
      <label class="relative rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-400
                    bg-slate-50 hover:bg-brand-50 cursor-pointer transition aspect-square
                    flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-brand-600">
        <i class="fa-solid fa-plus text-xl"></i>
        <span class="text-[10px] font-bold uppercase tracking-wide">Tambah</span>
        <input type="file" accept="image/*" multiple class="hidden" id="gambar-add-input" />
      </label>
    ` : ""}

    <!-- Counter -->
    <div class="col-span-full flex items-center justify-between text-xs text-slate-400 pt-1">
      <span>${maxLabel} gambar (maks 6)</span>
      ${items.length === 0 ? '<span class="text-amber-500">Minimal 1 gambar disarankan</span>' : ""}
    </div>

    <!-- Input URL eksternal -->
    <div class="col-span-full">
      <div class="flex gap-2">
        <input type="url" id="gambar-url-input" placeholder="Atau masukkan URL gambar..."
          class="flex-1 px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200
                 focus:border-brand-500 focus:outline-none" />
        <button type="button" onclick="_addGambarUrl()"
          class="px-3 py-2 bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white
                 rounded-xl text-sm font-bold transition whitespace-nowrap">
          + URL
        </button>
      </div>
    </div>
  `;

  // Pasang event listener file input setelah render
  const fileInput = document.getElementById("gambar-add-input");
  if (fileInput) {
    fileInput.addEventListener("change", (e) => _handleFileAdd(e.target.files));
  }
}

/** Handle pemilihan file baru dari input */
function _handleFileAdd(files) {
  const fileArr = Array.from(files);
  let added = 0;
  const promises = fileArr.map((file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const ok = GambarState.add("file", file, ev.target.result);
      if (ok) added++;
      resolve();
    };
    reader.readAsDataURL(file);
  }));

  Promise.all(promises).then(() => {
    _renderGambarGrid();
    if (fileArr.length > added) {
      showToast(`Maks 6 gambar. Hanya ${added} yang ditambahkan.`, false);
    }
  });
}

/** Tambah gambar via URL */
function _addGambarUrl() {
  const input = document.getElementById("gambar-url-input");
  const url   = input?.value?.trim();
  if (!url) return;
  if (!url.startsWith("http")) {
    showToast("URL tidak valid", false);
    return;
  }
  const ok = GambarState.add("url", url, url);
  if (!ok) {
    showToast("Maks 6 gambar", false);
    return;
  }
  if (input) input.value = "";
  _renderGambarGrid();
}
window._addGambarUrl = _addGambarUrl;

/** Hapus gambar dari GambarState berdasarkan index */
function _removeGambar(index) {
  GambarState.remove(index);
  _renderGambarGrid();
}
window._removeGambar = _removeGambar;

// ── BUKA EDIT ─────────────────────────────────────────────────────────────────
function openEditPaket(id) {
  const p = AdminState.allPaket.find((x) => x.id === id);
  if (!p) return;
  AdminState.editingId = id;

  document.getElementById("form-id").value           = p.id;
  document.getElementById("form-nama").value         = p.nama;
  document.getElementById("form-lokasi").value       = p.lokasi;
  document.getElementById("form-wilayah").value      = p.wilayah;
  document.getElementById("form-kategori").value     = p.kategori;
  document.getElementById("form-harga").value        = p.harga;
  document.getElementById("form-harga-coret").value  = p.harga_coret || "";
  document.getElementById("form-durasi").value       = p.durasi;
  document.getElementById("form-deskripsi").value    = p.deskripsi;
  document.getElementById("form-fasilitas").value    = p.fasilitas || "";
  document.getElementById("form-badge-text").value   = p.badge_text || "";
  document.getElementById("form-badge-color").value  = p.badge_color || "bg-amber-500";
  document.getElementById("form-rating").value       = p.rating;
  document.getElementById("form-aktif").checked      = Boolean(p.aktif);

  // Load gambar yang sudah ada ke GambarState
  GambarState.clear();
  const gambarArr = Array.isArray(p.gambar) ? p.gambar : (p.gambar ? [p.gambar] : []);
  gambarArr.forEach((url) => GambarState.add("existing", url, url));
  _renderGambarGrid();

  document.getElementById("form-submit-text").textContent = "Update Paket";
  _openModalPaket("Edit Paket Wisata");
}
window.openEditPaket = openEditPaket;

// ── SUBMIT FORM ───────────────────────────────────────────────────────────────
PaketEls.paketForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn  = document.getElementById("form-submit-btn");
  const submitText = document.getElementById("form-submit-text");
  submitBtn.disabled   = true;
  submitText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

  try {
    const fd = new FormData();
    fd.append("nama",        document.getElementById("form-nama").value);
    fd.append("lokasi",      document.getElementById("form-lokasi").value);
    fd.append("wilayah",     document.getElementById("form-wilayah").value);
    fd.append("kategori",    document.getElementById("form-kategori").value);
    fd.append("harga",       document.getElementById("form-harga").value);
    fd.append("harga_coret", document.getElementById("form-harga-coret").value || "");
    fd.append("durasi",      document.getElementById("form-durasi").value);
    fd.append("deskripsi",   document.getElementById("form-deskripsi").value);
    fd.append("fasilitas",   document.getElementById("form-fasilitas").value);
    fd.append("badge_text",  document.getElementById("form-badge-text").value);
    fd.append("badge_color", document.getElementById("form-badge-color").value);
    fd.append("rating",      document.getElementById("form-rating").value || "4.8");
    fd.append("aktif",       document.getElementById("form-aktif").checked ? "1" : "0");

    // Pisahkan: file baru, URL existing (dipertahankan), URL eksternal baru
    const existingUrls = [];
    const externalUrls = [];

    GambarState.items.forEach((item) => {
      if (item.type === "file") {
        fd.append("gambar", item.value); // File object → multer
      } else if (item.type === "existing") {
        existingUrls.push(item.value);
      } else if (item.type === "url") {
        externalUrls.push(item.value);
      }
    });

    fd.append("gambar_existing", JSON.stringify(existingUrls));
    fd.append("gambar_urls",     JSON.stringify(externalUrls));

    const url    = AdminState.editingId
      ? `${ADMIN_CONFIG.API_PAKET}/${AdminState.editingId}`
      : ADMIN_CONFIG.API_PAKET;
    const method = AdminState.editingId ? "PUT" : "POST";

    const res  = await fetch(url, { method, body: fd });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);

    _closeModalPaket();
    await loadPaket();
    showToast(AdminState.editingId ? "Paket berhasil diupdate! ✅" : "Paket berhasil ditambahkan! ✅", true);
  } catch (err) {
    showToast("Gagal: " + err.message, false);
  } finally {
    submitBtn.disabled   = false;
    submitText.textContent = AdminState.editingId ? "Update Paket" : "Simpan Paket";
  }
});

// ── TOGGLE AKTIF ──────────────────────────────────────────────────────────────
async function toggleAktifPaket(id, currentAktif) {
  try {
    const fd = new FormData();
    fd.append("aktif", currentAktif ? "0" : "1");
    await fetch(`${ADMIN_CONFIG.API_PAKET}/${id}`, { method: "PUT", body: fd });
    await loadPaket();
    showToast(currentAktif ? "Paket dinonaktifkan" : "Paket diaktifkan ✅", !currentAktif);
  } catch (e) {
    showToast("Gagal mengubah status", false);
  }
}
window.toggleAktifPaket = toggleAktifPaket;

// ── HAPUS ─────────────────────────────────────────────────────────────────────
function openHapusPaket(id, nama) {
  AdminState.hapusId = id;
  PaketEls.hapusNamaText.textContent = `"${nama}" akan dihapus permanen dari database.`;
  PaketEls.modalHapus.classList.remove("hidden");
  PaketEls.modalHapus.classList.add("flex");
}
window.openHapusPaket = openHapusPaket;

PaketEls.hapusCancel.addEventListener("click", () => {
  PaketEls.modalHapus.classList.add("hidden");
  PaketEls.modalHapus.classList.remove("flex");
});

PaketEls.hapusConfirm.addEventListener("click", async () => {
  if (!AdminState.hapusId) return;
  try {
    await fetch(`${ADMIN_CONFIG.API_PAKET}/${AdminState.hapusId}`, { method: "DELETE" });
    PaketEls.modalHapus.classList.add("hidden");
    PaketEls.modalHapus.classList.remove("flex");
    await loadPaket();
    showToast("Paket berhasil dihapus", true);
  } catch (e) {
    showToast("Gagal menghapus paket", false);
  }
  AdminState.hapusId = null;
});
