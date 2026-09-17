tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        serif: ["Playfair Display", "serif"],
      },
      colors: {
        brand: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
        accent: { 500: "#f59e0b", 600: "#d97706" },
      },
    },
  },
};

document.addEventListener("DOMContentLoaded", () => {
  // ── Elements ──────────────────────────────────────────────────────────────
  const mobileMenuBtn  = document.getElementById("mobile-menu-btn");
  const mobileMenu     = document.getElementById("mobile-menu");
  const menuIcon       = document.getElementById("menu-icon");
  const modal          = document.getElementById("booking-modal");
  const modalTitle     = document.getElementById("modal-destination-title");
  const searchLocation = document.getElementById("search-location");
  const searchForm     = document.getElementById("search-form");

  // ── State: semua paket dari DB ────────────────────────────────────────────
  let allPaket         = [];   // data mentah dari API
  let activeFilter     = "semua"; // filter tombol kategori aktif

  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH & RENDER PAKET
  // ═══════════════════════════════════════════════════════════════════════════

  async function fetchPaket() {
    try {
      const res  = await fetch("/api/paket?aktif=1");
      const json = await res.json();
      return json.data || [];
    } catch (e) {
      console.error("Gagal fetch paket:", e.message);
      return [];
    }
  }

  /** Render kartu dari array paket ke #destination-grid */
  function renderCards(paketList) {
    const grid = document.getElementById("destination-grid");
    if (!grid) return;

    if (paketList.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-16 text-slate-400">
          <i class="fa-solid fa-box-open text-3xl mb-3 block"></i>
          <p class="text-sm">Tidak ada paket yang cocok dengan pencarian.</p>
        </div>`;
      return;
    }

    grid.innerHTML = paketList.map((p) => {
      // gambar selalu array dari API (normalizePaket di repository)
      const gambarArr = Array.isArray(p.gambar) ? p.gambar : (p.gambar ? [p.gambar] : []);
      const thumb     = gambarArr[0] || "https://placehold.co/600x400/0d9488/ffffff?text=LombokTrip";
      const jumlahFoto = gambarArr.length;

      const harga = "Rp " + Number(p.harga).toLocaleString("id-ID");
      const badge = p.badge_text
        ? `<div class="absolute top-4 left-4 ${p.badge_color || "bg-amber-500"} text-white text-xs font-bold px-3 py-1 rounded-full shadow">
             ${p.badge_text}
           </div>`
        : "";

      // Dot indicator untuk multiple images
      const dots = jumlahFoto > 1
        ? `<div class="absolute bottom-10 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
             ${gambarArr.map((_, i) =>
               `<span class="w-1.5 h-1.5 rounded-full transition-all ${i === 0 ? "bg-white scale-125" : "bg-white/50"}"></span>`
             ).join("")}
           </div>`
        : "";

      // Badge jumlah foto di pojok
      const fotoBadge = jumlahFoto > 1
        ? `<div class="absolute top-4 right-14 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-md flex items-center gap-1">
             <i class="fa-solid fa-images text-[10px]"></i> ${jumlahFoto}
           </div>`
        : "";

      // Data gambar untuk lightbox (JSON encoded)
      const gambarData = encodeURIComponent(JSON.stringify(gambarArr));

      // Harga HTML
      let hargaHtml = "";
      if (p.harga_coret && Number(p.harga_coret) > Number(p.harga)) {
        const hargaCoret = "Rp " + Number(p.harga_coret).toLocaleString("id-ID");
        const diskon     = Math.round((1 - p.harga / p.harga_coret) * 100);
        hargaHtml = `
          <div>
            <div class="flex items-center gap-2 mb-0.5">
              <span class="text-xs bg-red-500 text-white font-black px-1.5 py-0.5 rounded">-${diskon}%</span>
              <span class="text-xs text-slate-400 line-through">${hargaCoret}</span>
            </div>
            <div>
              <span class="text-xs text-slate-400">Harga promo</span>
              <div>
                <span class="text-lg font-extrabold text-red-500">${harga}</span>
                <span class="text-xs text-slate-500">/org</span>
              </div>
            </div>
          </div>`;
      } else {
        hargaHtml = `
          <div>
            <span class="text-xs text-slate-400 block">Mulai dari</span>
            <span class="text-lg font-extrabold text-slate-900">${harga}</span>
            <span class="text-xs text-slate-500">/org</span>
          </div>`;
      }

      return `
        <div
          class="dest-card group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl
                 transition-all duration-300 border border-slate-100 flex flex-col"
          data-category="${p.wilayah} ${p.kategori}"
          data-nama="${p.nama.toLowerCase()}"
          data-lokasi="${p.lokasi.toLowerCase()}"
        >
          <!-- Thumbnail + Lightbox trigger -->
          <div class="relative h-64 overflow-hidden cursor-zoom-in"
            data-lightbox="${gambarData}"
            data-paket-nama="${p.nama}">
            <img
              src="${thumb}"
              alt="${p.nama}"
              class="w-full h-full object-cover group-hover:scale-110 transition duration-500"
              onerror="this.src='https://placehold.co/600x400/e2e8f0/94a3b8?text=No+Image'"
            />
            ${badge}
            ${fotoBadge}
            ${dots}
            <button data-wishlist
              class="absolute top-4 right-4 w-9 h-9 bg-white/80 backdrop-blur-md rounded-full
                     flex items-center justify-center text-slate-600 hover:text-red-500 transition z-10"
              onclick="event.stopPropagation()">
              <i class="fa-regular fa-heart text-base"></i>
            </button>
            <div class="absolute bottom-3 left-4 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-md">
              <i class="fa-solid fa-clock mr-1 text-teal-400"></i> ${p.durasi}
            </div>
          </div>

          <!-- Info paket -->
          <div class="p-6 flex-1 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-brand-600 uppercase tracking-wide">${p.lokasi}</span>
                <div class="flex items-center text-amber-500 text-xs font-bold">
                  <i class="fa-solid fa-star mr-1"></i> ${p.rating} (${p.ulasan})
                </div>
              </div>
              <h3 class="text-xl font-bold text-slate-900 group-hover:text-brand-600 transition">${p.nama}</h3>
              <p class="text-slate-500 text-xs sm:text-sm mt-2 line-clamp-2">${p.deskripsi}</p>
            </div>
            <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              ${hargaHtml}
              <button
                data-booking-destination="${p.nama}"
                class="bg-brand-50 hover:bg-brand-600 text-brand-700 hover:text-white
                       px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition">
                Detail Paket
              </button>
            </div>
          </div>
        </div>`;
    }).join("");

    // Event listener: klik area gambar → buka lightbox
    grid.querySelectorAll("[data-lightbox]").forEach((el) => {
      el.addEventListener("click", () => {
        try {
          const images = JSON.parse(decodeURIComponent(el.dataset.lightbox));
          const nama   = el.dataset.paketNama || "";
          if (images.length > 0 && window.LombokLightbox) {
            window.LombokLightbox.open(images, 0, nama);
          }
        } catch {}
      });
    });

    // Re-attach event listeners booking
    grid.querySelectorAll("[data-booking-destination]").forEach((btn) => {
      btn.addEventListener("click", () => {
        modalTitle.innerText = btn.dataset.bookingDestination;
        modal.classList.remove("hidden");
      });
    });
    grid.querySelectorAll("[data-wishlist]").forEach((btn) => {
      btn.addEventListener("click", () => toggleWishlist(btn));
    });
  }

  /**
   * Satu-satunya fungsi filter — menggabungkan:
   * - filter tombol kategori (semua/lombok/sumbawa/pantai/petualangan)
   * - search dropdown destinasi
   * Semua dari data allPaket (sudah di-fetch dari DB)
   */
  function applyFilter() {
    const selectedDestination = searchLocation?.value?.toLowerCase() || "";

    const filtered = allPaket.filter((p) => {
      // Filter tombol kategori
      const matchKategori =
        activeFilter === "semua" ||
        p.wilayah   === activeFilter ||
        p.kategori  === activeFilter;

      // Filter dropdown destinasi: cocokkan ke nama atau lokasi paket
      const matchDestinasi =
        !selectedDestination ||
        p.nama.toLowerCase().includes(selectedDestination) ||
        p.lokasi.toLowerCase().includes(selectedDestination) ||
        selectedDestination.includes(p.nama.toLowerCase().split(" ")[0]);

      return matchKategori && matchDestinasi;
    });

    renderCards(filtered);
  }

  /** Isi dropdown search dari data paket yang sudah ada di allPaket */
  let isPopulating = false; // flag untuk cegah event change terpicu saat populate

  function populateSearchDropdown(filterKategori = "semua") {
    if (!searchLocation) return;

    isPopulating = true;
    const currentValue = searchLocation.value;

    // Hapus semua opsi kecuali placeholder
    while (searchLocation.options.length > 1) searchLocation.remove(1);

    // Filter paket sesuai kategori aktif
    const source = filterKategori === "semua"
      ? allPaket
      : allPaket.filter((p) => p.wilayah === filterKategori || p.kategori === filterKategori);

    // Kelompokkan berdasarkan wilayah
    const byWilayah = source.reduce((acc, p) => {
      const key = p.wilayah === "lombok" ? "Lombok" : "Sumbawa & Bima";
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {});

    Object.entries(byWilayah).forEach(([wilayah, pakets]) => {
      const group = document.createElement("optgroup");
      group.label = `── ${wilayah} ──`;
      pakets.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p.nama.toLowerCase();
        opt.textContent = `${p.nama} – ${p.lokasi}`;
        group.appendChild(opt);
      });
      searchLocation.appendChild(group);
    });

    // Kembalikan nilai sebelumnya jika masih ada
    if (currentValue) searchLocation.value = currentValue;

    isPopulating = false;
  }

  // Init: fetch semua paket lalu render dan isi dropdown
  fetchPaket().then((data) => {
    allPaket = data;
    renderCards(allPaket);
    populateSearchDropdown();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // STATS COUNTER
  // ═══════════════════════════════════════════════════════════════════════════

  async function fetchAndRenderStats() {
    const container = document.getElementById("stats-counter");
    if (!container) return;

    try {
      const res  = await fetch("/api/settings");
      const json = await res.json();
      const s    = json.data || {};

      const stats = [1, 2, 3, 4].map((n) => ({
        nilai: s[`stat_${n}_nilai`]?.value  || "-",
        label: s[`stat_${n}_label`]?.value  || "",
        warna: s[`stat_${n}_warna`]?.value  || "text-white",
      }));

      container.innerHTML = stats.map((stat) => `
        <div class="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
          <div class="text-2xl sm:text-3xl font-black ${stat.warna}">${stat.nilai}</div>
          <div class="text-xs sm:text-sm text-slate-300 mt-1">${stat.label}</div>
        </div>
      `).join("");
    } catch (e) {
      console.error("Gagal fetch settings:", e.message);
      // Fallback ke nilai default
      container.innerHTML = `
        <div class="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
          <div class="text-2xl sm:text-3xl font-black text-amber-400">8.500+</div>
          <div class="text-xs sm:text-sm text-slate-300 mt-1">Wisatawan Puas</div>
        </div>
        <div class="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
          <div class="text-2xl sm:text-3xl font-black text-teal-400">50+</div>
          <div class="text-xs sm:text-sm text-slate-300 mt-1">Destinasi NTB</div>
        </div>
        <div class="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
          <div class="text-2xl sm:text-3xl font-black text-emerald-400">98.7%</div>
          <div class="text-xs sm:text-sm text-slate-300 mt-1">Ulasan Bintang 5</div>
        </div>
        <div class="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
          <div class="text-2xl sm:text-3xl font-black text-cyan-400">7+ Thn</div>
          <div class="text-xs sm:text-sm text-slate-300 mt-1">Melayani Wisata NTB</div>
        </div>`;
    }
  }

  fetchAndRenderStats();

  // ═══════════════════════════════════════════════════════════════════════════
  // HERO SLIDESHOW
  // ═══════════════════════════════════════════════════════════════════════════

  const heroSlideshow = document.getElementById("hero-slideshow");
  const heroJudul     = document.getElementById("hero-judul");
  const heroSubjudul  = document.getElementById("hero-subjudul");
  const heroPrev      = document.getElementById("hero-prev");
  const heroNext      = document.getElementById("hero-next");
  const heroDots      = document.getElementById("hero-dots");

  let heroImages      = [];
  let heroIndex       = 0;
  let heroTimer       = null;
  const SLIDE_INTERVAL = 5000; // 5 detik per slide

  async function initHeroSlideshow() {
    try {
      const res  = await fetch("/api/hero?aktif=1");
      const json = await res.json();
      heroImages = json.data || [];
    } catch (e) {
      console.error("Gagal fetch hero images:", e.message);
      return; // tetap tampil slide default dari HTML
    }

    if (heroImages.length === 0) return;

    // Bangun semua slide di DOM
    const gradient = heroSlideshow.querySelector(".hero-gradient");
    heroSlideshow.innerHTML = ""; // hapus slide default

    heroImages.forEach((img, i) => {
      const slide = document.createElement("div");
      slide.className = `hero-slide absolute inset-0 transition-opacity duration-1000 ${i === 0 ? "opacity-100" : "opacity-0"}`;
      slide.innerHTML = `
        <img
          src="${img.gambar}"
          alt="${img.judul || "Hero NTB"}"
          class="w-full h-full object-cover object-center"
          onerror="this.src='https://placehold.co/1920x1080/0f766e/ffffff?text=LombokTrip'"
        />`;
      heroSlideshow.appendChild(slide);
    });

    // Tambah kembali gradient overlay
    const overlay = document.createElement("div");
    overlay.className = "absolute inset-0 hero-gradient";
    heroSlideshow.appendChild(overlay);

    // Bangun dot indicators
    if (heroImages.length > 1) {
      heroDots.classList.remove("hidden");
      heroPrev.classList.remove("hidden");
      heroNext.classList.remove("hidden");

      heroDots.innerHTML = heroImages.map((_, i) => `
        <button
          data-dot="${i}"
          class="hero-dot w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === 0 ? "bg-white scale-125" : "bg-white/40 hover:bg-white/70"}"
        ></button>
      `).join("");

      heroDots.querySelectorAll(".hero-dot").forEach((dot) => {
        dot.addEventListener("click", () => goToSlide(Number(dot.dataset.dot)));
      });
    }

    // Tampilkan teks slide pertama
    updateHeroText(0);

    // Mulai auto-slide
    startAutoSlide();
  }

  function goToSlide(index) {
    const slides = heroSlideshow.querySelectorAll(".hero-slide");
    const dots   = heroDots.querySelectorAll(".hero-dot");

    // Fade out slide lama
    slides[heroIndex]?.classList.replace("opacity-100", "opacity-0");
    dots[heroIndex]?.classList.remove("bg-white", "scale-125");
    dots[heroIndex]?.classList.add("bg-white/40");

    heroIndex = (index + heroImages.length) % heroImages.length;

    // Fade in slide baru
    slides[heroIndex]?.classList.replace("opacity-0", "opacity-100");
    dots[heroIndex]?.classList.add("bg-white", "scale-125");
    dots[heroIndex]?.classList.remove("bg-white/40");

    updateHeroText(heroIndex);
    resetAutoSlide();
  }

  function updateHeroText(index) {
    const img = heroImages[index];
    if (!img) return;

    if (heroJudul && img.judul) {
      heroJudul.style.opacity = "0";
      setTimeout(() => {
        heroJudul.innerHTML = img.judul;
        heroJudul.style.opacity = "1";
      }, 300);
    }

    if (heroSubjudul && img.subjudul) {
      heroSubjudul.style.opacity = "0";
      setTimeout(() => {
        heroSubjudul.textContent = img.subjudul;
        heroSubjudul.style.opacity = "1";
      }, 400);
    }
  }

  function startAutoSlide() {
    heroTimer = setInterval(() => goToSlide(heroIndex + 1), SLIDE_INTERVAL);
  }

  function resetAutoSlide() {
    clearInterval(heroTimer);
    startAutoSlide();
  }

  heroPrev?.addEventListener("click", () => goToSlide(heroIndex - 1));
  heroNext?.addEventListener("click", () => goToSlide(heroIndex + 1));

  // Pause saat hover
  heroSlideshow?.addEventListener("mouseenter", () => clearInterval(heroTimer));
  heroSlideshow?.addEventListener("mouseleave", () => {
    if (heroImages.length > 1) startAutoSlide();
  });

  initHeroSlideshow();

  // ═══════════════════════════════════════════════════════════════════════════
  // SEARCH FORM
  // ═══════════════════════════════════════════════════════════════════════════

  searchForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = searchLocation?.value;
    if (!val) {
      showToast("Silakan pilih destinasi terlebih dahulu!");
      return;
    }
    // Scroll ke section destinasi
    document.getElementById("tujuan")?.scrollIntoView({ behavior: "smooth" });
    applyFilter();
    showToast(`Menampilkan paket untuk: ${searchLocation.options[searchLocation.selectedIndex]?.text || val}`);
  });

  // Update filter saat dropdown berubah (real-time) — skip saat sedang populate
  searchLocation?.addEventListener("change", () => {
    if (isPopulating) return;
    applyFilter();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FILTER TOMBOL KATEGORI
  // ═══════════════════════════════════════════════════════════════════════════

  document.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;

      // Update style tombol
      document.querySelectorAll(".filter-btn").forEach((b) => {
        b.classList.remove("bg-brand-600", "text-white", "active-tab");
        b.classList.add("bg-white", "text-slate-600");
      });
      btn.classList.remove("bg-white", "text-slate-600");
      btn.classList.add("bg-brand-600", "text-white", "active-tab");

      // Update dropdown sesuai filter aktif
      populateSearchDropdown(activeFilter);

      // Reset pilihan dropdown lalu filter ulang
      if (searchLocation) searchLocation.value = "";
      applyFilter();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILE MENU
  // ═══════════════════════════════════════════════════════════════════════════

  mobileMenuBtn?.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
    menuIcon.classList.toggle("fa-bars",  mobileMenu.classList.contains("hidden"));
    menuIcon.classList.toggle("fa-xmark", !mobileMenu.classList.contains("hidden"));
  });

  document.querySelectorAll(".mobile-nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.add("hidden");
      menuIcon.classList.remove("fa-xmark");
      menuIcon.classList.add("fa-bars");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BOOKING MODAL
  // ═══════════════════════════════════════════════════════════════════════════

  document.querySelectorAll("[data-booking-destination]").forEach((btn) => {
    btn.addEventListener("click", () => {
      modalTitle.innerText = btn.dataset.bookingDestination;
      modal.classList.remove("hidden");
    });
  });

  document.querySelector("[data-close-modal]")
    ?.addEventListener("click", closeBookingModal);

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeBookingModal();
  });

  document.querySelector("#booking-form")
    ?.addEventListener("submit", handleBookingSubmit);

  function closeBookingModal() {
    modal.classList.add("hidden");
  }

  function handleBookingSubmit(event) {
    event.preventDefault();
    const nama      = event.target.querySelector("input[type=text]")?.value    || "";
    const wa        = event.target.querySelector("input[type=tel]")?.value     || "";
    const peserta   = event.target.querySelector("input[type=number]")?.value  || "2";
    const bulan     = event.target.querySelector("select")?.value              || "";
    const catatan   = event.target.querySelector("textarea")?.value            || "";
    const destinasi = modalTitle.innerText || "Destinasi NTB";

    const pesan = encodeURIComponent(
      `Halo LombokTrip! 🏝️\n\nSaya ingin memesan paket wisata:\n` +
      `*Paket:* ${destinasi}\n` +
      `*Nama:* ${nama}\n` +
      `*No. WA:* ${wa}\n` +
      `*Peserta:* ${peserta} orang\n` +
      `*Bulan:* ${bulan}\n` +
      (catatan ? `*Catatan:* ${catatan}\n` : "") +
      `\nMohon informasi lebih lanjut. Terima kasih!`
    );

    closeBookingModal();
    window.open(`https://wa.me/6285177430585?text=${pesan}`, "_blank", "noopener,noreferrer");
    showToast("Membuka WhatsApp CS LombokTrip...");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NEWSLETTER
  // ═══════════════════════════════════════════════════════════════════════════

  document.querySelector("#newsletter-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    showToast("Selamat! Voucher diskon Rp 300.000 telah dikirimkan ke email Anda.");
    e.target.reset();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // WISHLIST
  // ═══════════════════════════════════════════════════════════════════════════

  function toggleWishlist(btn) {
    const icon = btn.querySelector("i");
    const isAdded = icon.classList.contains("fa-regular");
    icon.classList.toggle("fa-regular", !isAdded);
    icon.classList.toggle("fa-solid",   isAdded);
    icon.classList.toggle("text-red-500", isAdded);
    showToast(isAdded ? "Ditambahkan ke daftar impian NTB Anda!" : "Dihapus dari daftar impian.");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOAST
  // ═══════════════════════════════════════════════════════════════════════════

  function showToast(message) {
    const toast    = document.getElementById("toast");
    const toastMsg = document.getElementById("toast-message");
    toastMsg.innerText = message;
    toast.classList.remove("hidden", "translate-y-4", "opacity-0");
    setTimeout(() => {
      toast.classList.add("translate-y-4", "opacity-0");
      setTimeout(() => toast.classList.add("hidden"), 300);
    }, 3500);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHATBOT — Asisten Wisata NTB "Rinjani"
  // ═══════════════════════════════════════════════════════════════════════════

  const CHAT_API_URL  = "/chat";
  const chatToggleBtn = document.getElementById("chat-toggle-btn");
  const chatWindow    = document.getElementById("chat-window");
  const chatCloseBtn  = document.getElementById("chat-close-btn");
  const chatClearBtn  = document.getElementById("chat-clear-btn");
  const chatForm      = document.getElementById("chat-form");
  const chatInput     = document.getElementById("chat-input");
  const chatSendBtn   = document.getElementById("chat-send-btn");
  const chatMessages  = document.getElementById("chat-messages");
  const chatTyping    = document.getElementById("chat-typing");
  const chatBadge     = document.getElementById("chat-badge");
  const chatBtnIcon   = document.getElementById("chat-btn-icon");

  let chatHistory = [];
  let isChatOpen  = false;
  let isBotTyping = false;

  function renderWelcomeMessage() {
    chatMessages.innerHTML = "";
    appendBotMessage(
      "Halo! 👋 Saya <strong>Rinjani</strong>, asisten wisata virtual LombokTrip.<br><br>" +
      "Saya siap membantu Anda merencanakan perjalanan ke <strong>Nusa Tenggara Barat</strong> — " +
      "dari pantai Gili yang eksotis, pendakian Rinjani, hingga petualangan di Sumbawa. " +
      "Tanyakan apa saja! 🏝️"
    );
  }

  chatToggleBtn?.addEventListener("click", () => {
    isChatOpen = !isChatOpen;
    chatWindow.classList.toggle("hidden", !isChatOpen);
    chatBtnIcon.className = isChatOpen ? "fa-solid fa-xmark text-xl" : "fa-solid fa-comments text-xl";
    if (isChatOpen) {
      chatBadge.classList.add("hidden");
      chatInput.focus();
      scrollToBottom();
      if (chatMessages.children.length === 0) renderWelcomeMessage();
    }
  });

  chatCloseBtn?.addEventListener("click", () => {
    isChatOpen = false;
    chatWindow.classList.add("hidden");
    chatBtnIcon.className = "fa-solid fa-comments text-xl";
  });

  chatClearBtn?.addEventListener("click", () => {
    chatHistory = [];
    renderWelcomeMessage();
  });

  chatForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text || isBotTyping) return;
    sendChatMessage(text);
    chatInput.value = "";
  });

  document.querySelectorAll(".chat-suggestion-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const suggestion = btn.dataset.suggestion;
      if (!suggestion || isBotTyping) return;
      if (!isChatOpen) {
        isChatOpen = true;
        chatWindow.classList.remove("hidden");
        chatBtnIcon.className = "fa-solid fa-xmark text-xl";
        chatBadge.classList.add("hidden");
        if (chatMessages.children.length === 0) renderWelcomeMessage();
      }
      sendChatMessage(suggestion);
    });
  });

  async function sendChatMessage(userText) {
    appendUserMessage(userText);
    chatHistory.push({ role: "user", text: userText });

    document.getElementById("chat-suggestions")?.classList.add("hidden");
    setTyping(true);
    scrollToBottom();

    try {
      const res = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, history: chatHistory.slice(0, -1) }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }

      const data     = await res.json();
      const botReply = data.result || "Maaf, saya tidak mendapatkan respons.";

      chatHistory.push({ role: "model", text: botReply });
      setTyping(false);
      appendBotMessage(formatBotText(botReply));
      scrollToBottom();
    } catch (err) {
      setTyping(false);
      appendBotMessage(
        "⚠️ Maaf, terjadi gangguan koneksi ke server. " +
        "Pastikan server sudah berjalan dengan <code class='bg-slate-200 px-1 rounded text-xs'>npm run dev</code>."
      );
      scrollToBottom();
      console.error("[Chatbot error]", err.message);
    }
  }

  function appendUserMessage(text) {
    const div = document.createElement("div");
    div.className = "flex justify-end";
    div.innerHTML = `
      <div class="max-w-[80%] bg-brand-600 text-white px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed shadow-sm">
        ${escapeHtml(text)}
      </div>`;
    chatMessages.appendChild(div);
    scrollToBottom();
  }

  function appendBotMessage(htmlContent) {
    const div = document.createElement("div");
    div.className = "flex items-start gap-2";
    div.innerHTML = `
      <div class="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs shrink-0 mt-0.5">
        <i class="fa-solid fa-mountain-sun"></i>
      </div>
      <div class="max-w-[85%] bg-white border border-slate-200 px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-sm text-slate-700 leading-relaxed shadow-sm">
        ${htmlContent}
      </div>`;
    chatMessages.appendChild(div);
  }

  function setTyping(show) {
    isBotTyping = show;
    chatTyping.classList.toggle("hidden", !show);
    chatSendBtn.disabled = show;
    chatInput.disabled   = show;
  }

  function scrollToBottom() {
    requestAnimationFrame(() => { chatMessages.scrollTop = chatMessages.scrollHeight; });
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function formatBotText(text) {
    return text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code class='bg-slate-100 px-1 rounded text-xs'>$1</code>")
      .replace(/\n/g, "<br>");
  }

  renderWelcomeMessage();

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTIMONI
  // ═══════════════════════════════════════════════════════════════════════════

  const TESTI_API   = "/api/testimoni";
  const testiGrid   = document.getElementById("testimoni-grid");
  const loadMoreBtn = document.getElementById("btn-load-more-testi");
  const loadMoreWrap= document.getElementById("testi-load-more");
  const TESTI_LIMIT = 3; // tampil 3 dulu, sisanya load more

  let allTestimoni  = [];

  // ── Fetch & render testimoni ─────────────────────────────────────────────
  async function fetchTestimoni() {
    try {
      const res  = await fetch(`${TESTI_API}?status=approved`);
      const json = await res.json();
      allTestimoni = json.data || [];
      renderTestimoni(allTestimoni.slice(0, TESTI_LIMIT));
      // Tampilkan tombol "Lihat semua" jika lebih dari TESTI_LIMIT
      if (allTestimoni.length > TESTI_LIMIT) loadMoreWrap?.classList.remove("hidden");
    } catch (e) {
      if (testiGrid) testiGrid.innerHTML = `<div class="col-span-full text-center py-8 text-slate-500 text-sm">Gagal memuat testimoni.</div>`;
    }
  }

  function renderTestimoni(list) {
    if (!testiGrid) return;

    if (list.length === 0) {
      testiGrid.innerHTML = `<div class="col-span-full text-center py-8 text-slate-500 text-sm">Belum ada testimoni.</div>`;
      return;
    }

    testiGrid.innerHTML = list.map((t) => {
      const stars = Array.from({ length: 5 }, (_, i) =>
        `<i class="fa-${i < t.rating ? "solid" : "regular"} fa-star"></i>`
      ).join("");

      const inisial = t.nama.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
      const avatarHtml = t.foto
        ? `<img src="${t.foto}" alt="${t.nama}" class="w-12 h-12 rounded-full object-cover border-2 border-brand-500" onerror="this.replaceWith(document.getElementById('tpl-avatar-${t.id}'))" />`
        : `<div class="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center text-white font-black text-sm border-2 border-brand-500">${inisial}</div>`;

      return `
        <div class="bg-slate-800/80 p-8 rounded-2xl border border-slate-700 flex flex-col justify-between hover:border-brand-500 transition duration-300">
          <div>
            <div class="flex text-amber-400 mb-4 space-x-1 text-sm">${stars}</div>
            <p class="text-slate-300 text-sm leading-relaxed italic">"${escapeHtml(t.pesan)}"</p>
            ${t.paket ? `<p class="text-xs text-brand-400 mt-3 font-semibold"><i class="fa-solid fa-suitcase-rolling mr-1"></i>${t.paket}</p>` : ""}
          </div>
          <div class="mt-6 flex items-center space-x-3">
            ${avatarHtml}
            <div>
              <h4 class="font-bold text-white text-sm">${escapeHtml(t.nama)}</h4>
              <p class="text-xs text-slate-400">${t.asal ? escapeHtml(t.asal) : "Indonesia"}</p>
            </div>
          </div>
        </div>`;
    }).join("");
  }

  // Load more
  loadMoreBtn?.addEventListener("click", () => {
    renderTestimoni(allTestimoni);
    loadMoreWrap?.classList.add("hidden");
  });

  fetchTestimoni();

  // ── Rating bintang interaktif ─────────────────────────────────────────────
  const starsContainer = document.getElementById("testi-rating-stars");
  let selectedRating   = 5;

  starsContainer?.querySelectorAll(".testi-star").forEach((star) => {
    star.addEventListener("mouseover", () => highlightStars(Number(star.dataset.star)));
    star.addEventListener("mouseleave", () => highlightStars(selectedRating));
    star.addEventListener("click", () => {
      selectedRating = Number(star.dataset.star);
      highlightStars(selectedRating);
    });
  });

  function highlightStars(n) {
    starsContainer?.querySelectorAll(".testi-star").forEach((s) => {
      const starN = Number(s.dataset.star);
      s.className = `testi-star fa-star text-xl cursor-pointer hover:scale-110 transition ${starN <= n ? "fa-solid text-amber-400" : "fa-regular text-slate-500"}`;
    });
  }

  // ── Submit form testimoni ─────────────────────────────────────────────────
  const formTestimoni  = document.getElementById("form-testimoni");
  const testiSubmitBtn = document.getElementById("testi-submit-btn");
  const testiSubmitTxt = document.getElementById("testi-submit-text");

  formTestimoni?.addEventListener("submit", async (e) => {
    e.preventDefault();
    testiSubmitBtn.disabled = true;
    testiSubmitTxt.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...';

    const body = {
      nama:   document.getElementById("testi-nama").value.trim(),
      asal:   document.getElementById("testi-asal").value.trim(),
      paket:  document.getElementById("testi-paket").value.trim(),
      pesan:  document.getElementById("testi-pesan").value.trim(),
      rating: selectedRating,
    };

    try {
      const res  = await fetch(TESTI_API, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      formTestimoni.reset();
      selectedRating = 5;
      highlightStars(5);
      showToast("✅ Terima kasih! Testimoni dikirim dan menunggu verifikasi.");
    } catch (err) {
      showToast("Gagal mengirim testimoni: " + err.message);
    } finally {
      testiSubmitBtn.disabled = false;
      testiSubmitTxt.textContent = "Kirim Testimoni";
    }
  });

}); // end DOMContentLoaded
