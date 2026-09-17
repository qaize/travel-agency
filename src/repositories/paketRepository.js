import db from "../config/db.js";

/**
 * Repository untuk paket_wisata.
 * Semua akses database paket wisata hanya melalui file ini.
 */

/**
 * Ambil semua paket dengan filter opsional.
 * @param {{ wilayah?: string, kategori?: string, aktif?: number }} filters
 * @returns {Array}
 */
export function findAllPaket({ wilayah, kategori, aktif } = {}) {
  let query = "SELECT * FROM paket_wisata WHERE 1=1";
  const params = [];

  if (wilayah  !== undefined) { query += " AND wilayah = ?";  params.push(wilayah); }
  if (kategori !== undefined) { query += " AND kategori = ?"; params.push(kategori); }
  if (aktif    !== undefined) { query += " AND aktif = ?";    params.push(Number(aktif)); }

  query += " ORDER BY created_at DESC";

  return db.prepare(query).all(...params);
}

/**
 * Ambil satu paket berdasarkan ID.
 * @param {number} id
 * @returns {object|undefined}
 */
export function findPaketById(id) {
  return db.prepare("SELECT * FROM paket_wisata WHERE id = ?").get(id);
}

/**
 * Tambah paket baru.
 * @param {object} data
 * @returns {object} paket yang baru dibuat
 */
export function createPaket(data) {
  const { nama, lokasi, wilayah, kategori, harga, harga_coret, durasi, deskripsi,
          fasilitas, badge_text, badge_color, rating, ulasan, gambar } = data;

  const result = db.prepare(`
    INSERT INTO paket_wisata
      (nama, lokasi, wilayah, kategori, harga, harga_coret, durasi, deskripsi,
       fasilitas, badge_text, badge_color, rating, ulasan, gambar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    nama, lokasi,
    wilayah  || "lombok",
    kategori || "pantai",
    Number(harga),
    harga_coret ? Number(harga_coret) : null,
    durasi, deskripsi,
    fasilitas  || null,
    badge_text  || null,
    badge_color || "bg-amber-500",
    Number(rating) || 4.8,
    Number(ulasan) || 0,
    gambar || null,
  );

  return findPaketById(result.lastInsertRowid);
}

/**
 * Update paket yang sudah ada.
 * Hanya field yang diberikan yang diupdate; sisanya tetap dari data lama.
 * @param {number} id
 * @param {object} data
 * @returns {object} paket setelah diupdate
 */
export function updatePaket(id, data) {
  const existing = findPaketById(id);
  if (!existing) return null;

  const merged = {
    nama:        data.nama        ?? existing.nama,
    lokasi:      data.lokasi      ?? existing.lokasi,
    wilayah:     data.wilayah     ?? existing.wilayah,
    kategori:    data.kategori    ?? existing.kategori,
    harga:       Number(data.harga ?? existing.harga),
    harga_coret: data.harga_coret !== undefined
                   ? (data.harga_coret ? Number(data.harga_coret) : null)
                   : existing.harga_coret,
    durasi:      data.durasi      ?? existing.durasi,
    deskripsi:   data.deskripsi   ?? existing.deskripsi,
    fasilitas:   data.fasilitas   ?? existing.fasilitas,
    badge_text:  data.badge_text  ?? existing.badge_text,
    badge_color: data.badge_color ?? existing.badge_color,
    rating:      Number(data.rating ?? existing.rating),
    ulasan:      Number(data.ulasan ?? existing.ulasan),
    gambar:      data.gambar      ?? existing.gambar,
    aktif:       data.aktif !== undefined ? Number(data.aktif) : existing.aktif,
  };

  db.prepare(`
    UPDATE paket_wisata SET
      nama = ?, lokasi = ?, wilayah = ?, kategori = ?, harga = ?,
      harga_coret = ?, durasi = ?, deskripsi = ?, fasilitas = ?,
      badge_text = ?, badge_color = ?, rating = ?, ulasan = ?,
      gambar = ?, aktif = ?
    WHERE id = ?
  `).run(
    merged.nama, merged.lokasi, merged.wilayah, merged.kategori, merged.harga,
    merged.harga_coret, merged.durasi, merged.deskripsi, merged.fasilitas,
    merged.badge_text, merged.badge_color, merged.rating, merged.ulasan,
    merged.gambar, merged.aktif,
    id,
  );

  return findPaketById(id);
}

/**
 * Hapus paket berdasarkan ID.
 * @param {number} id
 * @returns {object|null} data paket sebelum dihapus
 */
export function deletePaket(id) {
  const existing = findPaketById(id);
  if (!existing) return null;

  db.prepare("DELETE FROM paket_wisata WHERE id = ?").run(id);
  return existing;
}
