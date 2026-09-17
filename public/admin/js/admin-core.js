// =============================================================================
// admin-core.js
// State global, konfigurasi, login/logout, navigasi section, toast notification
// =============================================================================

// ── CONFIG ────────────────────────────────────────────────────────────────────
const ADMIN_CONFIG = {
  API_PAKET    : "/api/paket",
  API_HERO     : "/api/hero",
  API_TESTIMONI: "/api/testimoni",
  API_SETTINGS : "/api/settings",
  API_LOGIN    : "/api/admin/login",
  SESSION_KEY  : "lt_admin",
};

// ── STATE GLOBAL ──────────────────────────────────────────────────────────────
const AdminState = {
  // Paket
  allPaket  : [],
  editingId : null,
  hapusId   : null,

  // Hero
  editingHeroId: null,
  hapusHeroId  : null,

  // Testimoni
  testiFilter: "pending",
};

// ── ELEMEN UTAMA ──────────────────────────────────────────────────────────────
const Els = {
  // Login
  loginOverlay : document.getElementById("login-overlay"),
  loginForm    : document.getElementById("login-form"),
  loginPassword: document.getElementById("login-password"),
  loginError   : document.getElementById("login-error"),

  // Panel utama
  adminPanel: document.getElementById("admin-panel"),
  logoutBtn : document.getElementById("logout-btn"),

  // Sections
  sections: {
    dashboard: document.getElementById("section-dashboard"),
    paket    : document.getElementById("section-paket"),
    hero     : document.getElementById("section-hero"),
    testimoni: document.getElementById("section-testimoni"),
    settings : document.getElementById("section-settings"),
  },
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────

/** Cek session — jika sudah login, tampilkan panel langsung */
function checkLogin() {
  if (sessionStorage.getItem(ADMIN_CONFIG.SESSION_KEY) === "1") {
    _showPanel();
  }
}

/** Tampilkan admin panel dan buka section dashboard */
function _showPanel() {
  Els.loginOverlay.classList.add("hidden");
  Els.adminPanel.classList.remove("hidden");
  Els.adminPanel.classList.add("flex");
  showSection("dashboard");
}

Els.loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = Els.loginForm.querySelector("button[type=submit]");
  btn.disabled    = true;
  btn.textContent = "Memeriksa...";

  try {
    const res = await fetch(ADMIN_CONFIG.API_LOGIN, {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ password: Els.loginPassword.value }),
    });

    if (res.ok) {
      sessionStorage.setItem(ADMIN_CONFIG.SESSION_KEY, "1");
      Els.loginError.classList.add("hidden");
      _showPanel();
    } else {
      Els.loginError.classList.remove("hidden");
      Els.loginPassword.value = "";
      Els.loginPassword.focus();
    }
  } catch {
    Els.loginError.textContent = "Gagal terhubung ke server.";
    Els.loginError.classList.remove("hidden");
  } finally {
    btn.disabled    = false;
    btn.textContent = "Masuk ke Admin Panel";
  }
});

Els.logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem(ADMIN_CONFIG.SESSION_KEY);
  location.reload();
});

// ── NAVIGASI SECTION ──────────────────────────────────────────────────────────

/**
 * Tampilkan section tertentu, sembunyikan yang lain, update nav aktif.
 * @param {"dashboard"|"paket"|"hero"|"testimoni"|"settings"} section
 */
function showSection(section) {
  // Update nav link aktif
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("bg-brand-600", "text-white");
    link.classList.add("text-slate-300", "hover:bg-slate-800", "hover:text-white");
  });
  const activeLink = document.querySelector(`.nav-link[data-section="${section}"]`);
  if (activeLink) {
    activeLink.classList.add("bg-brand-600", "text-white");
    activeLink.classList.remove("text-slate-300");
  }

  // Sembunyikan semua section
  Object.values(Els.sections).forEach((el) => {
    if (el) el.style.display = "none";
  });

  // Tampilkan section yang dipilih dan panggil loader-nya
  const sectionEl = Els.sections[section];
  if (sectionEl) sectionEl.style.display = "";

  const loaders = {
    dashboard: () => loadDashboard(),
    paket    : () => loadPaket(),
    hero     : () => loadHero(),
    testimoni: () => loadTestimoni(),
    settings : () => loadSettings(),
  };
  loaders[section]?.();
}

// Event listener nav sidebar
document.querySelectorAll(".nav-link[data-section]").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(link.dataset.section);
  });
});

// Event listener shortcut button di dashboard
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".nav-shortcut[data-section]");
  if (btn) showSection(btn.dataset.section);
});

// ── TOAST NOTIFICATION ────────────────────────────────────────────────────────

/**
 * Tampilkan toast notifikasi di kanan bawah layar.
 * @param {string}  msg     - Pesan yang ditampilkan
 * @param {boolean} success - true = hijau/sukses, false = merah/error
 */
function showToast(msg, success = true) {
  const toast = document.getElementById("admin-toast");
  const icon  = document.getElementById("admin-toast-icon");
  const text  = document.getElementById("admin-toast-msg");

  icon.className = [
    "w-7 h-7 rounded-full flex items-center justify-center font-bold shrink-0 text-sm",
    success ? "bg-emerald-500 text-slate-900" : "bg-red-500 text-white",
  ].join(" ");
  icon.innerHTML  = success
    ? '<i class="fa-solid fa-check"></i>'
    : '<i class="fa-solid fa-xmark"></i>';
  text.textContent = msg;

  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

// ── UTIL ──────────────────────────────────────────────────────────────────────

/** Format angka ke Rupiah. Contoh: 1850000 → "Rp 1.850.000" */
function formatRupiah(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

// ── INIT ──────────────────────────────────────────────────────────────────────
checkLogin();
