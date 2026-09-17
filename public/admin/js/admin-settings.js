// =============================================================================
// admin-settings.js
// Pengaturan Website: load, render form stats, preview realtime, simpan, reset
// Depends: admin-core.js (ADMIN_CONFIG, showToast)
// =============================================================================

// ── KONSTANTA ─────────────────────────────────────────────────────────────────
const WARNA_OPTIONS = [
  { value: "text-amber-400",   label: "Kuning (Amber)"  },
  { value: "text-teal-400",    label: "Teal"            },
  { value: "text-emerald-400", label: "Hijau (Emerald)" },
  { value: "text-cyan-400",    label: "Cyan"            },
  { value: "text-rose-400",    label: "Merah (Rose)"    },
  { value: "text-violet-400",  label: "Ungu"            },
  { value: "text-white",       label: "Putih"           },
];

const DEFAULT_SETTINGS = {
  stat_1_nilai: "8.500+", stat_1_label: "Wisatawan Puas",      stat_1_warna: "text-amber-400",
  stat_2_nilai: "50+",    stat_2_label: "Destinasi NTB",       stat_2_warna: "text-teal-400",
  stat_3_nilai: "98.7%",  stat_3_label: "Ulasan Bintang 5",    stat_3_warna: "text-emerald-400",
  stat_4_nilai: "7+ Thn", stat_4_label: "Melayani Wisata NTB", stat_4_warna: "text-cyan-400",
};

// ── ELEMEN SETTINGS ───────────────────────────────────────────────────────────
const SettingsEls = {
  form    : document.getElementById("settings-form"),
  fields  : document.getElementById("settings-fields"),
  preview : document.getElementById("settings-preview"),
  saveBtn : document.getElementById("settings-save-btn"),
  saveTxt : document.getElementById("settings-save-text"),
  resetBtn: document.getElementById("settings-reset-btn"),
};

// ── LOAD & RENDER ─────────────────────────────────────────────────────────────

/** Fetch settings dari API dan render form + preview */
async function loadSettings() {
  try {
    const res  = await fetch(ADMIN_CONFIG.API_SETTINGS);
    const json = await res.json();
    const s    = json.data || {};
    _renderSettingsForm(s);
    _renderSettingsPreview(s);
  } catch (e) {
    showToast("Gagal memuat settings: " + e.message, false);
  }
}

/** Render form input untuk setiap stat (nilai, label, warna) */
function _renderSettingsForm(s) {
  SettingsEls.fields.innerHTML = [1, 2, 3, 4].map((n) => {
    const nilai = s[`stat_${n}_nilai`]?.value || "";
    const label = s[`stat_${n}_label`]?.value || "";
    const warna = s[`stat_${n}_warna`]?.value || "text-white";

    const warnaOpts = WARNA_OPTIONS.map((o) =>
      `<option value="${o.value}" ${warna === o.value ? "selected" : ""}>${o.label}</option>`
    ).join("");

    return `
      <div class="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
        <p class="text-xs font-black text-slate-500 uppercase tracking-widest">Stat ${n}</p>

        <div>
          <label class="block text-xs font-bold text-slate-500 mb-1">Nilai / Angka</label>
          <input type="text" name="stat_${n}_nilai" value="${nilai}"
            placeholder="Contoh: 10.000+"
            class="settings-input w-full px-3 py-2 text-sm rounded-xl border border-slate-200
                   focus:border-brand-500 focus:outline-none" />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-500 mb-1">Label / Keterangan</label>
          <input type="text" name="stat_${n}_label" value="${label}"
            placeholder="Contoh: Wisatawan Puas"
            class="settings-input w-full px-3 py-2 text-sm rounded-xl border border-slate-200
                   focus:border-brand-500 focus:outline-none" />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-500 mb-1">Warna Nilai</label>
          <select name="stat_${n}_warna"
            class="settings-input w-full px-3 py-2 text-sm rounded-xl border border-slate-200
                   focus:border-brand-500 focus:outline-none">
            ${warnaOpts}
          </select>
        </div>
      </div>`;
  }).join("");

  // Pasang event live preview setelah form di-render
  SettingsEls.fields.querySelectorAll(".settings-input").forEach((input) => {
    input.addEventListener("input",  _updatePreviewFromForm);
    input.addEventListener("change", _updatePreviewFromForm);
  });
}

/** Render kotak preview stats counter (background gelap seperti di hero) */
function _renderSettingsPreview(s) {
  SettingsEls.preview.innerHTML = [1, 2, 3, 4].map((n) => `
    <div class="p-4 rounded-xl bg-white/5 border border-white/10">
      <div id="prev-nilai-${n}" class="text-2xl font-black ${s[`stat_${n}_warna`]?.value || "text-white"}">
        ${s[`stat_${n}_nilai`]?.value || "–"}
      </div>
      <div id="prev-label-${n}" class="text-xs text-slate-400 mt-1">
        ${s[`stat_${n}_label`]?.value || ""}
      </div>
    </div>`).join("");
}

/** Update preview secara realtime dari nilai form saat ini */
function _updatePreviewFromForm() {
  [1, 2, 3, 4].forEach((n) => {
    const nilai = SettingsEls.fields.querySelector(`[name="stat_${n}_nilai"]`)?.value || "–";
    const label = SettingsEls.fields.querySelector(`[name="stat_${n}_label"]`)?.value || "";
    const warna = SettingsEls.fields.querySelector(`[name="stat_${n}_warna"]`)?.value || "text-white";

    const elNilai = document.getElementById(`prev-nilai-${n}`);
    const elLabel = document.getElementById(`prev-label-${n}`);
    if (elNilai) { elNilai.textContent = nilai; elNilai.className = `text-2xl font-black ${warna}`; }
    if (elLabel) elLabel.textContent = label;
  });
}

// ── SIMPAN ────────────────────────────────────────────────────────────────────
SettingsEls.form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  SettingsEls.saveBtn.disabled  = true;
  SettingsEls.saveTxt.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

  // Kumpulkan semua nilai input ke object
  const body = {};
  SettingsEls.fields.querySelectorAll(".settings-input").forEach((input) => {
    body[input.name] = input.value;
  });

  try {
    const res  = await fetch(ADMIN_CONFIG.API_SETTINGS, {
      method : "PUT",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    showToast("Pengaturan berhasil disimpan! ✅", true);
  } catch (err) {
    showToast("Gagal: " + err.message, false);
  } finally {
    SettingsEls.saveBtn.disabled  = false;
    SettingsEls.saveTxt.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan';
  }
});

// ── RESET KE DEFAULT ──────────────────────────────────────────────────────────
SettingsEls.resetBtn?.addEventListener("click", () => {
  if (!confirm("Reset semua stats ke nilai default?")) return;

  fetch(ADMIN_CONFIG.API_SETTINGS, {
    method : "PUT",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(DEFAULT_SETTINGS),
  })
    .then(() => {
      loadSettings();
      showToast("Settings direset ke default ✅", true);
    })
    .catch(() => showToast("Gagal mereset settings", false));
});
