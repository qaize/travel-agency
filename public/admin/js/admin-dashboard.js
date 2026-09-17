// =============================================================================
// admin-dashboard.js
// Load dan render ringkasan statistik untuk halaman Dashboard
// Depends: admin-core.js (ADMIN_CONFIG, showToast)
// =============================================================================

/**
 * Ambil data dari semua API lalu isi stat card di dashboard.
 * Dipanggil otomatis setiap kali section "dashboard" dibuka via showSection().
 */
async function loadDashboard() {
  // Reset semua angka ke loading state
  ["dash-total-paket", "dash-paket-aktif", "dash-hero", "dash-pending"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = "…";
  });

  try {
    const [paketRes, heroRes, testiRes] = await Promise.all([
      fetch(ADMIN_CONFIG.API_PAKET),
      fetch(ADMIN_CONFIG.API_HERO),
      fetch(`${ADMIN_CONFIG.API_TESTIMONI}?status=pending`),
    ]);

    const paket = (await paketRes.json()).data || [];
    const hero  = (await heroRes.json()).data  || [];
    const testi = (await testiRes.json()).data || [];

    document.getElementById("dash-total-paket").textContent = paket.length;
    document.getElementById("dash-paket-aktif").textContent = paket.filter((p) => p.aktif == 1).length;
    document.getElementById("dash-hero").textContent        = hero.length;
    document.getElementById("dash-pending").textContent     = testi.length;

    // Update badge pending di sidebar sekalian
    _updateTestiBadge(testi.length);
  } catch (e) {
    console.error("loadDashboard error:", e.message);
  }
}

/** Update badge count testimoni pending di sidebar nav */
function _updateTestiBadge(count) {
  const badge = document.getElementById("testi-badge");
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}
