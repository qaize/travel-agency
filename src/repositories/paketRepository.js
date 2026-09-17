import db from "../config/db.js";

// ─── Helpers row mapping ──────────────────────────────────────────────────────
function toRows(result) {
  return result.rows.map((row) => Object.fromEntries(
    result.columns.map((col, i) => [col, row[i]])
  ));
}
function toRow(result) { return toRows(result)[0] || null; }

// ─── Helpers gambar (JSON array backward compatible) ─────────────────────────

/**
 * Parse kolom `gambar` ke array of URL strings.
 * Support 3 format lama/baru:
 *   - null / undefined          → []
 *   - '["url1","url2"]'         → ["url1","url2"]  (JSON array)
 *   - 'https://...'             → ["https://..."]  (string tunggal lama)
 */
export function parseGambar(gambar) {
  if (!gambar) return [];
  try {
    const parsed = JSON.parse(gambar);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [gambar];
  } catch {
    return [gambar]; // string tunggal lama → bungkus jadi array
  }
}

/**
 * Serialize array URL gambar ke JSON string untuk disimpan ke DB.
 * @param {string[]} arr
 * @returns {string|null}
 */
export function serializeGambar(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return JSON.stringify(arr.filter(Boolean));
}

/**
 * Setelah fetch dari DB, parse kolom gambar agar selalu berupa array.
 * Juga expose `gambar_thumb` = gambar[0] untuk kemudahan di frontend.
 */
function normalizePaket(p) {
  if (!p) return null;
  const gambarArr = parseGambar(p.gambar);
  return {
    ...p,
    gambar      : gambarArr,          // selalu array
    gambar_thumb: gambarArr[0] || null, // shortcut thumbnail
  };
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function findAllPaket({ wilayah, kategori, aktif } = {}) {
  let sql = "SELECT * FROM paket_wisata WHERE 1=1";
  const args = [];
  if (wilayah  !== undefined) { sql += " AND wilayah = ?";  args.push(wilayah); }
  if (kategori !== undefined) { sql += " AND kategori = ?"; args.push(kategori); }
  if (aktif    !== undefined) { sql += " AND aktif = ?";    args.push(Number(aktif)); }
  sql += " ORDER BY created_at DESC";
  return toRows(await db.execute({ sql, args })).map(normalizePaket);
}

export async function findPaketById(id) {
  return normalizePaket(
    toRow(await db.execute({ sql: "SELECT * FROM paket_wisata WHERE id = ?", args: [id] }))
  );
}

export async function createPaket(data) {
  const {
    nama, lokasi, wilayah, kategori, harga, harga_coret, durasi,
    deskripsi, fasilitas, badge_text, badge_color, rating, ulasan, gambar,
  } = data;

  // gambar bisa berupa array (dari route) atau string (backward compat)
  const gambarJson = Array.isArray(gambar)
    ? serializeGambar(gambar)
    : (gambar || null);

  const result = await db.execute({
    sql: `INSERT INTO paket_wisata
            (nama,lokasi,wilayah,kategori,harga,harga_coret,durasi,deskripsi,
             fasilitas,badge_text,badge_color,rating,ulasan,gambar)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      nama, lokasi,
      wilayah  || "lombok",
      kategori || "pantai",
      Number(harga),
      harga_coret ? Number(harga_coret) : null,
      durasi, deskripsi,
      fasilitas   || null,
      badge_text  || null,
      badge_color || "bg-amber-500",
      Number(rating) || 4.8,
      Number(ulasan) || 0,
      gambarJson,
    ],
  });
  return findPaketById(Number(result.lastInsertRowid));
}

export async function updatePaket(id, data) {
  const existing = await findPaketById(id);
  if (!existing) return null;

  // gambar dari route sudah berupa array yang sudah diproses
  let gambarJson;
  if (Array.isArray(data.gambar)) {
    gambarJson = serializeGambar(data.gambar);
  } else if (data.gambar !== undefined) {
    gambarJson = data.gambar; // string atau null dari caller
  } else {
    // tidak ada perubahan gambar — simpan kembali array lama
    gambarJson = serializeGambar(existing.gambar);
  }

  const merged = {
    nama       : data.nama        ?? existing.nama,
    lokasi     : data.lokasi      ?? existing.lokasi,
    wilayah    : data.wilayah     ?? existing.wilayah,
    kategori   : data.kategori    ?? existing.kategori,
    harga      : Number(data.harga      ?? existing.harga),
    harga_coret: data.harga_coret !== undefined
                   ? (data.harga_coret ? Number(data.harga_coret) : null)
                   : existing.harga_coret,
    durasi     : data.durasi      ?? existing.durasi,
    deskripsi  : data.deskripsi   ?? existing.deskripsi,
    fasilitas  : data.fasilitas   ?? existing.fasilitas,
    badge_text : data.badge_text  ?? existing.badge_text,
    badge_color: data.badge_color ?? existing.badge_color,
    rating     : Number(data.rating  ?? existing.rating),
    ulasan     : Number(data.ulasan  ?? existing.ulasan),
    gambar     : gambarJson,
    aktif      : data.aktif !== undefined ? Number(data.aktif) : existing.aktif,
  };

  await db.execute({
    sql: `UPDATE paket_wisata
          SET nama=?,lokasi=?,wilayah=?,kategori=?,harga=?,harga_coret=?,
              durasi=?,deskripsi=?,fasilitas=?,badge_text=?,badge_color=?,
              rating=?,ulasan=?,gambar=?,aktif=?
          WHERE id=?`,
    args: [
      merged.nama, merged.lokasi, merged.wilayah, merged.kategori,
      merged.harga, merged.harga_coret, merged.durasi, merged.deskripsi,
      merged.fasilitas, merged.badge_text, merged.badge_color,
      merged.rating, merged.ulasan, merged.gambar, merged.aktif, id,
    ],
  });
  return findPaketById(id);
}

export async function deletePaket(id) {
  const existing = await findPaketById(id);
  if (!existing) return null;
  await db.execute({ sql: "DELETE FROM paket_wisata WHERE id = ?", args: [id] });
  return existing;
}
