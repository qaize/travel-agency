import { Router } from "express";
import { getAllSettings, updateSettings } from "../repositories/settingsRepository.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    res.json({ data: await getAllSettings() });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put("/", async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Tidak ada data yang dikirim" });
    }
    const updated = await updateSettings(req.body);
    res.json({ message: "Settings berhasil disimpan", data: updated });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
