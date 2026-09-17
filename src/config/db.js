import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../../lomboktrip.db");

const db = new Database(DB_PATH);

// ─── Schema ───────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS paket_wisata (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nama        TEXT    NOT NULL,
    lokasi      TEXT    NOT NULL,
    wilayah     TEXT    NOT NULL DEFAULT 'lombok',
    kategori    TEXT    NOT NULL DEFAULT 'pantai',
    harga       INTEGER NOT NULL,
    durasi      TEXT    NOT NULL,
    deskripsi   TEXT    NOT NULL,
    fasilitas   TEXT,
    badge_text  TEXT,
    badge_color TEXT    DEFAULT 'bg-amber-500',
    rating      REAL    DEFAULT 4.8,
    ulasan      INTEGER DEFAULT 0,
    harga_coret INTEGER DEFAULT NULL,
    gambar      TEXT,
    aktif       INTEGER DEFAULT 1,
    created_at  TEXT    DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS hero_images (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    gambar     TEXT    NOT NULL,
    judul      TEXT,
    subjudul   TEXT,
    urutan     INTEGER DEFAULT 0,
    aktif      INTEGER DEFAULT 1,
    created_at TEXT    DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS testimoni (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nama       TEXT    NOT NULL,
    asal       TEXT,
    rating     INTEGER NOT NULL DEFAULT 5,
    pesan      TEXT    NOT NULL,
    foto       TEXT,
    paket      TEXT,
    status     TEXT    NOT NULL DEFAULT 'pending',
    created_at TEXT    DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    label      TEXT,
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );
`);

// Migrasi: tambah kolom harga_coret jika belum ada (untuk database lama)
const columns = db.prepare("PRAGMA table_info(paket_wisata)").all();
if (!columns.find((c) => c.name === "harga_coret")) {
  db.exec("ALTER TABLE paket_wisata ADD COLUMN harga_coret INTEGER DEFAULT NULL");
  console.log("✅ Migrasi: kolom harga_coret ditambahkan");
}

// ─── Seed data awal (hanya jika tabel kosong) ─────────────────────────────────
const { count } = db.prepare("SELECT COUNT(*) as count FROM paket_wisata").get();

if (count === 0) {
  const insertPaket = db.prepare(`
    INSERT INTO paket_wisata
      (nama, lokasi, wilayah, kategori, harga, durasi, deskripsi,
       fasilitas, badge_text, badge_color, rating, ulasan, gambar)
    VALUES
      (@nama, @lokasi, @wilayah, @kategori, @harga, @durasi, @deskripsi,
       @fasilitas, @badge_text, @badge_color, @rating, @ulasan, @gambar)
  `);

  const seedPaket = [
    {
      nama: "Surga Bahari Gili Trawangan",
      lokasi: "Lombok Utara, NTB",
      wilayah: "lombok",
      kategori: "pantai",
      harga: 1850000,
      durasi: "3 Hari 2 Malam",
      deskripsi: "Snorkeling bersama penyu, menyelam di taman karang, dan menikmati sunset ikonik dari dermaga kayu Gili T.",
      fasilitas: "Transport, Hotel, Snorkeling, Makan",
      badge_text: "Terfavorit",
      badge_color: "bg-amber-500",
      rating: 4.9,
      ulasan: 312,
      gambar: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    },
    {
      nama: "Pendakian Puncak Rinjani 3.726m",
      lokasi: "Lombok Timur, NTB",
      wilayah: "lombok",
      kategori: "petualangan",
      harga: 2450000,
      durasi: "4 Hari 3 Malam",
      deskripsi: "Menaklukkan puncak tertinggi NTB, menikmati Danau Segara Anak, dan pemandangan sunrise yang memukau.",
      fasilitas: "Porter, Guide, Tenda, Makan, P3K",
      badge_text: "Pendakian Terbaik",
      badge_color: "bg-teal-600",
      rating: 4.8,
      ulasan: 196,
      gambar: "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=800&q=80",
    },
    {
      nama: "Mandalika & Pantai Kuta Lombok",
      lokasi: "Lombok Tengah, NTB",
      wilayah: "lombok",
      kategori: "pantai",
      harga: 2100000,
      durasi: "4 Hari 3 Malam",
      deskripsi: "Nikmati keindahan KEK Mandalika, surfing di Pantai Kuta, dan festival Bau Nyale yang unik khas Lombok.",
      fasilitas: "Transport, Hotel, Guide, Surfing",
      badge_text: "Destinasi Premium",
      badge_color: "bg-rose-500",
      rating: 4.85,
      ulasan: 241,
      gambar: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
    },
    {
      nama: "Pulau Moyo – Surga Tersembunyi Sumbawa",
      lokasi: "Sumbawa, NTB",
      wilayah: "sumbawa",
      kategori: "pantai",
      harga: 4750000,
      durasi: "3 Hari 2 Malam",
      deskripsi: "Berenang di Air Terjun Mata Jitu, snorkeling di perairan jernih, dan glamping mewah di resort tepi laut.",
      fasilitas: "Speedboat, Resort, Snorkeling, Makan",
      badge_text: "Eksklusif",
      badge_color: "bg-amber-500",
      rating: 4.9,
      ulasan: 88,
      gambar: "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=800&q=80",
    },
    {
      nama: "Pantai Pink & Snorkeling Teluk Ekas",
      lokasi: "Lombok Timur, NTB",
      wilayah: "lombok",
      kategori: "pantai",
      harga: 1350000,
      durasi: "2 Hari 1 Malam",
      deskripsi: "Jelajahi pantai berpasir merah muda unik di dunia dan spot snorkeling terbaik Lombok Timur dengan boat trip.",
      fasilitas: "Boat Trip, Snorkeling, Guide, Makan",
      badge_text: "Unik & Langka",
      badge_color: "bg-pink-500",
      rating: 4.87,
      ulasan: 143,
      gambar: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80",
    },
    {
      nama: "Ekspedisi Kaldera Tambora & Pantai Labuhan",
      lokasi: "Bima, NTB",
      wilayah: "sumbawa",
      kategori: "petualangan",
      harga: 3200000,
      durasi: "5 Hari 4 Malam",
      deskripsi: "Menjelajahi kaldera vulkanik terbesar Asia Tenggara dan menikmati panorama savana serta pantai sekitar Tambora.",
      fasilitas: "Transport, Guide, Tenda, Makan",
      badge_text: null,
      badge_color: null,
      rating: 4.8,
      ulasan: 74,
      gambar: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    },
  ];

  for (const paket of seedPaket) insertPaket.run(paket);
  console.log("✅ Database seeded dengan 6 paket wisata awal");
}

// ─── Seed hero images (hanya jika tabel kosong) ───────────────────────────────
const { count: heroCount } = db.prepare("SELECT COUNT(*) as count FROM hero_images").get();

if (heroCount === 0) {
  const insertHero = db.prepare(`
    INSERT INTO hero_images (gambar, judul, subjudul, urutan)
    VALUES (@gambar, @judul, @subjudul, @urutan)
  `);

  const seedHero = [
    {
      gambar: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80",
      judul: "Jelajahi Surga Tersembunyi Nusa Tenggara Barat",
      subjudul: "Pantai eksotis, petualangan tak terlupakan, budaya Sasak yang kaya",
      urutan: 1,
    },
    {
      gambar: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=2000&q=80",
      judul: "Taklukkan Puncak Rinjani 3.726m",
      subjudul: "Pendakian legendaris dengan pemandangan Danau Segara Anak",
      urutan: 2,
    },
    {
      gambar: "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=2000&q=80",
      judul: "Surga Bahari Gili & Pulau Moyo",
      subjudul: "Snorkeling bersama penyu di perairan jernih NTB",
      urutan: 3,
    },
  ];

  for (const hero of seedHero) insertHero.run(hero);
  console.log("✅ Database seeded dengan 3 hero images awal");
}

// ─── Seed testimoni (hanya jika tabel kosong) ─────────────────────────────────
const { count: testiCount } = db.prepare("SELECT COUNT(*) as count FROM testimoni").get();

if (testiCount === 0) {
  const insertTesti = db.prepare(`
    INSERT INTO testimoni (nama, asal, rating, pesan, foto, paket, status)
    VALUES (@nama, @asal, @rating, @pesan, @foto, @paket, @status)
  `);

  const seedTesti = [
    {
      nama: "Dewi Lestari",
      asal: "Jakarta",
      rating: 5,
      pesan: "Pendakian Rinjani bersama LombokTrip luar biasa! Porter dan guide sangat profesional, tenda nyaman, dan view Danau Segara Anak bikin speechless. Wajib balik lagi!",
      foto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      paket: "Pendakian Puncak Rinjani 3.726m",
      status: "approved",
    },
    {
      nama: "Rizky Firmansyah",
      asal: "Yogyakarta",
      rating: 5,
      pesan: "Honeymoon ke Gili Trawangan dan Mandalika sangat romantis! Itinerary-nya pas, hotelnya cocok banget, dan pemandunya sangat ramah. Terima kasih LombokTrip sudah bikin momen kami sempurna!",
      foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      paket: "Surga Bahari Gili Trawangan",
      status: "approved",
    },
    {
      nama: "Nurul Hidayah",
      asal: "Surabaya",
      rating: 5,
      pesan: "Trip ke Pulau Moyo Sumbawa tak terlupakan! Air terjun Mata Jitu keren banget, dan snorkeling-nya surga. CS LombokTrip responsif banget saat jadwal kapal molor. Recommended!",
      foto: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
      paket: "Pulau Moyo – Surga Tersembunyi Sumbawa",
      status: "approved",
    },
  ];

  for (const t of seedTesti) insertTesti.run(t);
  console.log("✅ Database seeded dengan 3 testimoni awal");
}

// ─── Seed site_settings (hanya jika tabel kosong) ────────────────────────────
const { count: settingsCount } = db.prepare("SELECT COUNT(*) as count FROM site_settings").get();

if (settingsCount === 0) {
  const insertSetting = db.prepare(
    "INSERT INTO site_settings (key, value, label) VALUES (?, ?, ?)"
  );

  const seedSettings = [
    ["stat_1_nilai",  "8.500+",  "Stat 1 – Nilai"],
    ["stat_1_label",  "Wisatawan Puas", "Stat 1 – Label"],
    ["stat_2_nilai",  "50+",     "Stat 2 – Nilai"],
    ["stat_2_label",  "Destinasi NTB", "Stat 2 – Label"],
    ["stat_3_nilai",  "98.7%",   "Stat 3 – Nilai"],
    ["stat_3_label",  "Ulasan Bintang 5", "Stat 3 – Label"],
    ["stat_4_nilai",  "7+ Thn",  "Stat 4 – Nilai"],
    ["stat_4_label",  "Melayani Wisata NTB", "Stat 4 – Label"],
    ["stat_1_warna",  "text-amber-400",   "Stat 1 – Warna"],
    ["stat_2_warna",  "text-teal-400",    "Stat 2 – Warna"],
    ["stat_3_warna",  "text-emerald-400", "Stat 3 – Warna"],
    ["stat_4_warna",  "text-cyan-400",    "Stat 4 – Warna"],
  ];

  for (const [key, value, label] of seedSettings) insertSetting.run(key, value, label);
  console.log("✅ Database seeded dengan site_settings default");
}

export default db;
