import db from "../config/db.js";

function toRows(result) {
  return result.rows.map((row) => Object.fromEntries(
    result.columns.map((col, i) => [col, row[i]])
  ));
}
function toRow(result) { return toRows(result)[0] || null; }

export async function findAllHero({ aktif } = {}) {
  let sql = "SELECT * FROM hero_images WHERE 1=1";
  const args = [];
  if (aktif !== undefined) { sql += " AND aktif = ?"; args.push(Number(aktif)); }
  sql += " ORDER BY urutan ASC, id ASC";
  return toRows(await db.execute({ sql, args }));
}

export async function findHeroById(id) {
  return toRow(await db.execute({ sql: "SELECT * FROM hero_images WHERE id = ?", args: [id] }));
}

export async function createHero({ gambar, judul, subjudul, urutan, aktif = 1 }) {
  if (urutan === undefined || urutan === null || urutan === "") {
    const result = await db.execute("SELECT MAX(urutan) as max FROM hero_images");
    const max = result.rows[0]?.[0] || 0;
    urutan = Number(max) + 1;
  }
  const result = await db.execute({
    sql: "INSERT INTO hero_images (gambar,judul,subjudul,urutan,aktif) VALUES (?,?,?,?,?)",
    args: [gambar, judul || null, subjudul || null, Number(urutan), Number(aktif)],
  });
  return findHeroById(Number(result.lastInsertRowid));
}

export async function updateHero(id, data) {
  const existing = await findHeroById(id);
  if (!existing) return null;
  await db.execute({
    sql: "UPDATE hero_images SET gambar=?,judul=?,subjudul=?,urutan=?,aktif=? WHERE id=?",
    args: [
      data.gambar   ?? existing.gambar,
      data.judul    ?? existing.judul,
      data.subjudul ?? existing.subjudul,
      Number(data.urutan ?? existing.urutan),
      Number(data.aktif !== undefined ? data.aktif : existing.aktif),
      id,
    ],
  });
  return findHeroById(id);
}

export async function deleteHero(id) {
  const existing = await findHeroById(id);
  if (!existing) return null;
  await db.execute({ sql: "DELETE FROM hero_images WHERE id = ?", args: [id] });
  return existing;
}

export async function reorderHero(orderedIds) {
  for (let i = 0; i < orderedIds.length; i++) {
    await db.execute({ sql: "UPDATE hero_images SET urutan = ? WHERE id = ?", args: [i + 1, orderedIds[i]] });
  }
}
