import { Router } from "express";
import { getAllSettings, updateSettings } from "../repositories/settingsRepository.js";

const router = Router();

// ─── GET /api/settings ────────────────────────────────────────────────────────
// Publik — dipakai frontend untuk render stats counter
router.get("/", (req, res) => {
  try {
    res.json({ data: getAllSettings() });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ─── PUT /api/settings ────────────────────────────────────────────────────────
// Admin — update satu atau banyak setting sekaligus
// Body: { "stat_1_nilai": "10.000+", "stat_1_label": "Wisatawan", ... }
router.put("/", (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Tidak ada data yang dikirim" });
    }
    const updated = updateSettings(req.body);
    res.json({ message: "Settings berhasil disimpan", data: updated });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
