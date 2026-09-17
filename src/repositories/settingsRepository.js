import db from "../config/db.js";

/**
 * Repository untuk tabel site_settings.
 * Semua settings disimpan sebagai key-value pairs.
 */

/** Ambil semua settings sebagai object { key: value } */
export function getAllSettings() {
  const rows = db.prepare("SELECT key, value, label FROM site_settings").all();
  return rows.reduce((acc, row) => {
    acc[row.key] = { value: row.value, label: row.label };
    return acc;
  }, {});
}

/** Ambil satu setting by key */
export function getSetting(key) {
  return db.prepare("SELECT * FROM site_settings WHERE key = ?").get(key);
}

/**
 * Update banyak settings sekaligus.
 * @param {Record<string, string>} data - { key: value, ... }
 */
export function updateSettings(data) {
  const upsert = db.prepare(`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES (?, ?, datetime('now','localtime'))
    ON CONFLICT(key) DO UPDATE SET
      value      = excluded.value,
      updated_at = excluded.updated_at
  `);

  const updateMany = db.transaction((entries) => {
    for (const [key, value] of entries) {
      upsert.run(key, value);
    }
  });

  updateMany(Object.entries(data));
  return getAllSettings();
}
