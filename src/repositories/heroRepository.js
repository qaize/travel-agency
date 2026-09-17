import db from "../config/db.js";

/**
 * Repository untuk hero_images.
 * Semua akses database hero slideshow hanya melalui file ini.
 */

/** Ambil semua hero images aktif, diurutkan by urutan */
export function findAllHero({ aktif } = {}) {
  let query = "SELECT * FROM hero_images WHERE 1=1";
  const params = [];
  if (aktif !== undefined) { query += " AND aktif = ?"; params.push(Number(aktif)); }
  query += " ORDER BY urutan ASC, id ASC";
  return db.prepare(query).all(...params);
}

/** Ambil satu hero image by ID */
export function findHeroById(id) {
  return db.prepare("SELECT * FROM hero_images WHERE id = ?").get(id);
}

/** Tambah hero image baru */
export function createHero({ gambar, judul, subjudul, urutan, aktif = 1 }) {
  // Kalau urutan tidak diisi, taruh di paling akhir
  if (urutan === undefined || urutan === null || urutan === "") {
    const last = db.prepare("SELECT MAX(urutan) as max FROM hero_images").get();
    urutan = (last.max || 0) + 1;
  }

  const result = db.prepare(`
    INSERT INTO hero_images (gambar, judul, subjudul, urutan, aktif)
    VALUES (?, ?, ?, ?, ?)
  `).run(gambar, judul || null, subjudul || null, Number(urutan), Number(aktif));

  return findHeroById(result.lastInsertRowid);
}

/** Update hero image */
export function updateHero(id, data) {
  const existing = findHeroById(id);
  if (!existing) return null;

  db.prepare(`
    UPDATE hero_images SET
      gambar   = ?,
      judul    = ?,
      subjudul = ?,
      urutan   = ?,
      aktif    = ?
    WHERE id = ?
  `).run(
    data.gambar   ?? existing.gambar,
    data.judul    ?? existing.judul,
    data.subjudul ?? existing.subjudul,
    Number(data.urutan ?? existing.urutan),
    Number(data.aktif  !== undefined ? data.aktif : existing.aktif),
    id,
  );

  return findHeroById(id);
}

/** Hapus hero image */
export function deleteHero(id) {
  const existing = findHeroById(id);
  if (!existing) return null;
  db.prepare("DELETE FROM hero_images WHERE id = ?").run(id);
  return existing;
}

/** Update urutan semua hero sekaligus (untuk drag & drop reorder) */
export function reorderHero(orderedIds) {
  const update = db.prepare("UPDATE hero_images SET urutan = ? WHERE id = ?");
  const updateMany = db.transaction((ids) => {
    ids.forEach((id, index) => update.run(index + 1, id));
  });
  updateMany(orderedIds);
}
