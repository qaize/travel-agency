import db from "../config/db.js";

function toRows(result) {
  return result.rows.map((row) => Object.fromEntries(
    result.columns.map((col, i) => [col, row[i]])
  ));
}

export async function getAllSettings() {
  const rows = toRows(await db.execute("SELECT key, value, label FROM site_settings"));
  return rows.reduce((acc, row) => {
    acc[row.key] = { value: row.value, label: row.label };
    return acc;
  }, {});
}

export async function getSetting(key) {
  const result = await db.execute({ sql: "SELECT * FROM site_settings WHERE key = ?", args: [key] });
  return toRows(result)[0] || null;
}

export async function updateSettings(data) {
  for (const [key, value] of Object.entries(data)) {
    await db.execute({
      sql: `INSERT INTO site_settings (key, value, updated_at)
            VALUES (?, ?, datetime('now','localtime'))
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      args: [key, value],
    });
  }
  return getAllSettings();
}
