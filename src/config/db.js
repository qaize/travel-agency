import { createClient } from "@libsql/client";

const db = createClient({
  url:       process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// ─── Schema ───────────────────────────────────────────────────────────────────
async function initSchema() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS paket_wisata (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nama        TEXT    NOT NULL,
      lokasi      TEXT    NOT NULL,
      wilayah     TEXT    NOT NULL DEFAULT 'lombok',
      kategori    TEXT    NOT NULL DEFAULT 'pantai',
      harga       INTEGER NOT NULL,
      harga_coret INTEGER DEFAULT NULL,
      durasi      TEXT    NOT NULL,
      deskripsi   TEXT    NOT NULL,
      fasilitas   TEXT,
      badge_text  TEXT,
      badge_color TEXT    DEFAULT 'bg-amber-500',
      rating      REAL    DEFAULT 4.8,
      ulasan      INTEGER DEFAULT 0,
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
}

// ─── Seed data ────────────────────────────────────────────────────────────────
async function seedData() {
  // Paket wisata
  const { rows: paketRows } = await db.execute("SELECT COUNT(*) as count FROM paket_wisata");
  if (Number(paketRows[0].count) === 0) {
    const paketSeed = [
      ["Surga Bahari Gili Trawangan", "Lombok Utara, NTB", "lombok", "pantai", 1850000, null, "3 Hari 2 Malam", "Snorkeling bersama penyu, menyelam di taman karang, dan menikmati sunset ikonik dari dermaga kayu Gili T.", "Transport, Hotel, Snorkeling, Makan", "Terfavorit", "bg-amber-500", 4.9, 312, "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"],
      ["Pendakian Puncak Rinjani 3.726m", "Lombok Timur, NTB", "lombok", "petualangan", 2450000, null, "4 Hari 3 Malam", "Menaklukkan puncak tertinggi NTB, menikmati Danau Segara Anak, dan pemandangan sunrise yang memukau.", "Porter, Guide, Tenda, Makan, P3K", "Pendakian Terbaik", "bg-teal-600", 4.8, 196, "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=800&q=80"],
      ["Mandalika & Pantai Kuta Lombok", "Lombok Tengah, NTB", "lombok", "pantai", 2100000, null, "4 Hari 3 Malam", "Nikmati keindahan KEK Mandalika, surfing di Pantai Kuta, dan festival Bau Nyale yang unik khas Lombok.", "Transport, Hotel, Guide, Surfing", "Destinasi Premium", "bg-rose-500", 4.85, 241, "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80"],
      ["Pulau Moyo – Surga Tersembunyi Sumbawa", "Sumbawa, NTB", "sumbawa", "pantai", 4750000, null, "3 Hari 2 Malam", "Berenang di Air Terjun Mata Jitu, snorkeling di perairan jernih, dan glamping mewah di resort tepi laut.", "Speedboat, Resort, Snorkeling, Makan", "Eksklusif", "bg-amber-500", 4.9, 88, "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=800&q=80"],
      ["Pantai Pink & Snorkeling Teluk Ekas", "Lombok Timur, NTB", "lombok", "pantai", 1350000, null, "2 Hari 1 Malam", "Jelajahi pantai berpasir merah muda unik di dunia dan spot snorkeling terbaik Lombok Timur dengan boat trip.", "Boat Trip, Snorkeling, Guide, Makan", "Unik & Langka", "bg-pink-500", 4.87, 143, "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80"],
      ["Ekspedisi Kaldera Tambora & Pantai Labuhan", "Bima, NTB", "sumbawa", "petualangan", 3200000, null, "5 Hari 4 Malam", "Menjelajahi kaldera vulkanik terbesar Asia Tenggara dan menikmati panorama savana serta pantai sekitar Tambora.", "Transport, Guide, Tenda, Makan", null, null, 4.8, 74, "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80"],
    ];
    for (const p of paketSeed) {
      await db.execute({
        sql: `INSERT INTO paket_wisata (nama,lokasi,wilayah,kategori,harga,harga_coret,durasi,deskripsi,fasilitas,badge_text,badge_color,rating,ulasan,gambar) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: p,
      });
    }
    console.log("✅ Seeded 6 paket wisata");
  }

  // Hero images
  const { rows: heroRows } = await db.execute("SELECT COUNT(*) as count FROM hero_images");
  if (Number(heroRows[0].count) === 0) {
    const heroSeed = [
      ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80", "Jelajahi Surga Tersembunyi Nusa Tenggara Barat", "Pantai eksotis, petualangan tak terlupakan, budaya Sasak yang kaya", 1],
      ["https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=2000&q=80", "Taklukkan Puncak Rinjani 3.726m", "Pendakian legendaris dengan pemandangan Danau Segara Anak", 2],
      ["https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=2000&q=80", "Surga Bahari Gili & Pulau Moyo", "Snorkeling bersama penyu di perairan jernih NTB", 3],
    ];
    for (const h of heroSeed) {
      await db.execute({ sql: "INSERT INTO hero_images (gambar,judul,subjudul,urutan) VALUES (?,?,?,?)", args: h });
    }
    console.log("✅ Seeded 3 hero images");
  }

  // Testimoni
  const { rows: testiRows } = await db.execute("SELECT COUNT(*) as count FROM testimoni");
  if (Number(testiRows[0].count) === 0) {
    const testiSeed = [
      ["Dewi Lestari", "Jakarta", 5, "Pendakian Rinjani bersama LombokTrip luar biasa! Porter dan guide sangat profesional, tenda nyaman, dan view Danau Segara Anak bikin speechless. Wajib balik lagi!", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80", "Pendakian Puncak Rinjani 3.726m", "approved"],
      ["Rizky Firmansyah", "Yogyakarta", 5, "Honeymoon ke Gili Trawangan dan Mandalika sangat romantis! Itinerary-nya pas, hotelnya cocok banget, dan pemandunya sangat ramah. Terima kasih LombokTrip!", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", "Surga Bahari Gili Trawangan", "approved"],
      ["Nurul Hidayah", "Surabaya", 5, "Trip ke Pulau Moyo Sumbawa tak terlupakan! Air terjun Mata Jitu keren banget, dan snorkeling-nya surga. CS LombokTrip responsif banget. Recommended!", "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80", "Pulau Moyo – Surga Tersembunyi Sumbawa", "approved"],
    ];
    for (const t of testiSeed) {
      await db.execute({ sql: "INSERT INTO testimoni (nama,asal,rating,pesan,foto,paket,status) VALUES (?,?,?,?,?,?,?)", args: t });
    }
    console.log("✅ Seeded 3 testimoni");
  }

  // Site settings
  const { rows: settingRows } = await db.execute("SELECT COUNT(*) as count FROM site_settings");
  if (Number(settingRows[0].count) === 0) {
    const settingsSeed = [
      ["stat_1_nilai", "8.500+",  "Stat 1 – Nilai"],
      ["stat_1_label", "Wisatawan Puas",       "Stat 1 – Label"],
      ["stat_1_warna", "text-amber-400",        "Stat 1 – Warna"],
      ["stat_2_nilai", "50+",     "Stat 2 – Nilai"],
      ["stat_2_label", "Destinasi NTB",         "Stat 2 – Label"],
      ["stat_2_warna", "text-teal-400",         "Stat 2 – Warna"],
      ["stat_3_nilai", "98.7%",   "Stat 3 – Nilai"],
      ["stat_3_label", "Ulasan Bintang 5",      "Stat 3 – Label"],
      ["stat_3_warna", "text-emerald-400",      "Stat 3 – Warna"],
      ["stat_4_nilai", "7+ Thn",  "Stat 4 – Nilai"],
      ["stat_4_label", "Melayani Wisata NTB",   "Stat 4 – Label"],
      ["stat_4_warna", "text-cyan-400",         "Stat 4 – Warna"],
    ];
    for (const [key, value, label] of settingsSeed) {
      await db.execute({ sql: "INSERT INTO site_settings (key,value,label) VALUES (?,?,?)", args: [key, value, label] });
    }
    console.log("✅ Seeded site_settings");
  }
}

// ─── Init: jalankan schema + seed saat pertama kali ──────────────────────────
export async function initDB() {
  await initSchema();
  await seedData();
  console.log("✅ Database Turso siap");
}

export default db;
