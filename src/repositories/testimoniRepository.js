import db from "../config/db.js";

/**
 * Repository untuk tabel testimoni.
 * status: 'pending' | 'approved' | 'rejected'
 */

/** Ambil semua testimoni, bisa filter by status */
export function findAllTestimoni({ status } = {}) {
  let query  = "SELECT * FROM testimoni WHERE 1=1";
  const params = [];
  if (status) { query += " AND status = ?"; params.push(status); }
  query += " ORDER BY created_at DESC";
  return db.prepare(query).all(...params);
}

/** Ambil satu testimoni by ID */
export function findTestimoniById(id) {
  return db.prepare("SELECT * FROM testimoni WHERE id = ?").get(id);
}

/** Tambah testimoni baru (status default: pending) */
export function createTestimoni({ nama, asal, rating, pesan, foto, paket }) {
  const result = db.prepare(`
    INSERT INTO testimoni (nama, asal, rating, pesan, foto, paket, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    nama,
    asal    || null,
    Number(rating) || 5,
    pesan,
    foto    || null,
    paket   || null,
  );
  return findTestimoniById(result.lastInsertRowid);
}

/** Update status testimoni: approved / rejected */
export function updateStatusTestimoni(id, status) {
  const existing = findTestimoniById(id);
  if (!existing) return null;
  db.prepare("UPDATE testimoni SET status = ? WHERE id = ?").run(status, id);
  return findTestimoniById(id);
}

/** Hapus testimoni */
export function deleteTestimoni(id) {
  const existing = findTestimoniById(id);
  if (!existing) return null;
  db.prepare("DELETE FROM testimoni WHERE id = ?").run(id);
  return existing;
}
