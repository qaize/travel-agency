import db from "../config/db.js";

function toRows(result) {
  return result.rows.map((row) => Object.fromEntries(
    result.columns.map((col, i) => [col, row[i]])
  ));
}
function toRow(result) { return toRows(result)[0] || null; }

export async function findAllTestimoni({ status } = {}) {
  let sql = "SELECT * FROM testimoni WHERE 1=1";
  const args = [];
  if (status) { sql += " AND status = ?"; args.push(status); }
  sql += " ORDER BY created_at DESC";
  return toRows(await db.execute({ sql, args }));
}

export async function findTestimoniById(id) {
  return toRow(await db.execute({ sql: "SELECT * FROM testimoni WHERE id = ?", args: [id] }));
}

export async function createTestimoni({ nama, asal, rating, pesan, foto, paket }) {
  const result = await db.execute({
    sql: "INSERT INTO testimoni (nama,asal,rating,pesan,foto,paket,status) VALUES (?,?,?,?,?,?,'pending')",
    args: [nama, asal || null, Number(rating) || 5, pesan, foto || null, paket || null],
  });
  return findTestimoniById(Number(result.lastInsertRowid));
}

export async function updateStatusTestimoni(id, status) {
  const existing = await findTestimoniById(id);
  if (!existing) return null;
  await db.execute({ sql: "UPDATE testimoni SET status = ? WHERE id = ?", args: [status, id] });
  return findTestimoniById(id);
}

export async function deleteTestimoni(id) {
  const existing = await findTestimoniById(id);
  if (!existing) return null;
  await db.execute({ sql: "DELETE FROM testimoni WHERE id = ?", args: [id] });
  return existing;
}
