// =============================================================================
// admin-testimoni.js
// Manajemen Testimoni: load, render, approve, reject, hapus
// Depends: admin-core.js (ADMIN_CONFIG, AdminState, showToast)
// =============================================================================

// ── ELEMEN TESTIMONI ──────────────────────────────────────────────────────────
const TestiEls = {
  list : document.getElementById("testi-admin-list"),
  badge: document.getElementById("testi-badge"),
  filterBtns: document.querySelectorAll(".testi-filter-btn"),
};

// ── LOAD & RENDER ─────────────────────────────────────────────────────────────

/** Fetch testimoni berdasarkan filter aktif, render list, update badge */
async function loadTestimoni() {
  TestiEls.list.innerHTML = `
    <div class="text-center py-12 text-slate-400">
      <i class="fa-solid fa-spinner fa-spin text-2xl mb-2 block"></i> Memuat...
    </div>`;

  try {
    const param = AdminState.testiFilter === "all" ? "all" : AdminState.testiFilter;
    const res   = await fetch(`${ADMIN_CONFIG.API_TESTIMONI}?status=${param}`);
    const json  = await res.json();
    _renderTestiList(json.data || []);

    // Ambil jumlah pending untuk badge sidebar
    const resPending   = await fetch(`${ADMIN_CONFIG.API_TESTIMONI}?status=pending`);
    const jsonPending  = await resPending.json();
    _updateTestiBadge((jsonPending.data || []).length);
  } catch (e) {
    TestiEls.list.innerHTML = `
      <div class="text-center py-8 text-red-400">
        <i class="fa-solid fa-triangle-exclamation text-2xl mb-2 block"></i>
        Gagal memuat: ${e.message}
      </div>`;
  }
}

/** Update angka badge testimoni pending di sidebar */
function _updateTestiBadge(count) {
  if (!TestiEls.badge) return;
  if (count > 0) {
    TestiEls.badge.textContent = count;
    TestiEls.badge.classList.remove("hidden");
  } else {
    TestiEls.badge.classList.add("hidden");
  }
}

/** Render daftar kartu testimoni */
function _renderTestiList(list) {
  if (list.length === 0) {
    const label = AdminState.testiFilter === "all" ? "" : AdminState.testiFilter;
    TestiEls.list.innerHTML = `
      <div class="text-center py-12 text-slate-400">
        <i class="fa-solid fa-comment-slash text-3xl mb-2 block"></i>
        <p>Tidak ada testimoni ${label}.</p>
      </div>`;
    return;
  }

  const statusBadgeClass = {
    pending : "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-500",
  };

  /** Render bintang rating */
  const renderBintang = (rating) =>
    Array.from({ length: 5 }, (_, i) =>
      `<i class="fa-${i < rating ? "solid" : "regular"} fa-star text-amber-400 text-xs"></i>`
    ).join("");

  TestiEls.list.innerHTML = list.map((t) => `
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col sm:flex-row gap-4">

      <!-- Avatar -->
      <div class="shrink-0">
        ${t.foto
          ? `<img src="${t.foto}" class="w-12 h-12 rounded-full object-cover"
               onerror="this.src='https://placehold.co/48/e2e8f0/94a3b8?text=${t.nama[0]}'" />`
          : `<div class="w-12 h-12 rounded-full bg-brand-100 text-brand-700 font-black text-sm flex items-center justify-center">
               ${t.nama.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
             </div>`}
      </div>

      <!-- Konten -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p class="font-bold text-slate-900 text-sm">
              ${t.nama}
              ${t.asal ? `<span class="text-slate-400 font-normal">· ${t.asal}</span>` : ""}
            </p>
            <div class="flex gap-0.5 mt-0.5">${renderBintang(t.rating)}</div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold px-2 py-0.5 rounded-full ${statusBadgeClass[t.status] || "bg-slate-100 text-slate-600"}">
              ${t.status}
            </span>
            <span class="text-xs text-slate-400">
              ${new Date(t.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>

        ${t.paket
          ? `<p class="text-xs text-brand-600 font-semibold mt-1">
               <i class="fa-solid fa-suitcase-rolling mr-1"></i>${t.paket}
             </p>`
          : ""}
        <p class="text-sm text-slate-600 mt-2 leading-relaxed">"${t.pesan}"</p>
      </div>

      <!-- Tombol aksi -->
      <div class="shrink-0 flex sm:flex-col gap-2">
        ${t.status !== "approved"
          ? `<button onclick="setTestiStatus(${t.id}, 'approved')"
               class="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-500
                      hover:text-white text-xs font-bold transition flex items-center gap-1">
               <i class="fa-solid fa-check"></i> Approve
             </button>`
          : ""}
        ${t.status !== "rejected"
          ? `<button onclick="setTestiStatus(${t.id}, 'rejected')"
               class="px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-500
                      hover:text-white text-xs font-bold transition flex items-center gap-1">
               <i class="fa-solid fa-xmark"></i> Reject
             </button>`
          : ""}
        <button onclick="hapusTesti(${t.id})"
          class="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-200
                 text-xs font-bold transition flex items-center gap-1">
          <i class="fa-solid fa-trash"></i> Hapus
        </button>
      </div>

    </div>
  `).join("");
}

// ── AKSI TESTIMONI ────────────────────────────────────────────────────────────

/** Approve atau reject testimoni */
async function setTestiStatus(id, status) {
  try {
    const res = await fetch(`${ADMIN_CONFIG.API_TESTIMONI}/${id}/status`, {
      method : "PUT",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error((await res.json()).message);
    await loadTestimoni();
    showToast(status === "approved" ? "Testimoni disetujui ✅" : "Testimoni ditolak", status === "approved");
  } catch (e) {
    showToast("Gagal: " + e.message, false);
  }
}
window.setTestiStatus = setTestiStatus;

/** Hapus testimoni permanen */
async function hapusTesti(id) {
  if (!confirm("Hapus testimoni ini permanen?")) return;
  try {
    await fetch(`${ADMIN_CONFIG.API_TESTIMONI}/${id}`, { method: "DELETE" });
    await loadTestimoni();
    showToast("Testimoni dihapus", true);
  } catch (e) {
    showToast("Gagal menghapus testimoni", false);
  }
}
window.hapusTesti = hapusTesti;

// ── FILTER TABS ───────────────────────────────────────────────────────────────
TestiEls.filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    AdminState.testiFilter = btn.dataset.testiFilter;

    // Reset semua tab
    TestiEls.filterBtns.forEach((b) => {
      b.classList.remove("active-testi", "bg-amber-500", "bg-brand-600", "text-white");
      b.classList.add("bg-white", "text-slate-600", "border", "border-slate-200");
    });

    // Aktifkan tab yang dipilih
    btn.classList.add("active-testi", "bg-brand-600", "text-white");
    btn.classList.remove("bg-white", "text-slate-600", "border", "border-slate-200");

    loadTestimoni();
  });
});
