import { Router } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { uploadGambar } from "../middlewares/uploadMiddleware.js";
import {
  findAllHero,
  findHeroById,
  createHero,
  updateHero,
  deleteHero,
  reorderHero,
} from "../repositories/heroRepository.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// ─── GET /api/hero ────────────────────────────────────────────────────────────
// Query param opsional: ?aktif=1
router.get("/", (req, res) => {
  try {
    const { aktif } = req.query;
    const filters = aktif !== undefined ? { aktif } : {};
    res.json({ data: findAllHero(filters) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ─── GET /api/hero/:id ────────────────────────────────────────────────────────
router.get("/:id", (req, res) => {
  try {
    const hero = findHeroById(Number(req.params.id));
    if (!hero) return res.status(404).json({ message: "Hero image tidak ditemukan" });
    res.json({ data: hero });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ─── POST /api/hero ───────────────────────────────────────────────────────────
router.post("/", uploadGambar, (req, res) => {
  try {
    if (!req.file && !req.body.gambar_url) {
      return res.status(400).json({ message: "Gambar wajib diupload atau isi URL gambar" });
    }

    const gambar = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.gambar_url;

    const hero = createHero({
      gambar,
      judul:    req.body.judul,
      subjudul: req.body.subjudul,
      urutan:   req.body.urutan,
      aktif:    req.body.aktif ?? 1,
    });

    res.status(201).json({ message: "Hero image berhasil ditambahkan", data: hero });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ─── PUT /api/hero/:id ────────────────────────────────────────────────────────
router.put("/:id", uploadGambar, (req, res) => {
  try {
    const id       = Number(req.params.id);
    const existing = findHeroById(id);
    if (!existing) return res.status(404).json({ message: "Hero image tidak ditemukan" });

    let gambar = existing.gambar;
    if (req.file) {
      gambar = `/uploads/${req.file.filename}`;
      // Hapus file lama dari disk jika ada
      if (existing.gambar?.startsWith("/uploads/")) {
        const oldFile = path.join(__dirname, "../../public", existing.gambar);
        if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
      }
    } else if (req.body.gambar_url !== undefined) {
      gambar = req.body.gambar_url;
    }

    const updated = updateHero(id, { ...req.body, gambar });
    res.json({ message: "Hero image berhasil diupdate", data: updated });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ─── DELETE /api/hero/:id ─────────────────────────────────────────────────────
router.delete("/:id", (req, res) => {
  try {
    const deleted = deleteHero(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Hero image tidak ditemukan" });

    // Hapus file dari disk jika ada
    if (deleted.gambar?.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "../../public", deleted.gambar);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.json({ message: "Hero image berhasil dihapus", data: deleted });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ─── PUT /api/hero/reorder ────────────────────────────────────────────────────
// Body: { ids: [3, 1, 2] } — urutan baru berdasarkan array ID
router.put("/reorder/order", (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids harus berupa array" });
    }
    reorderHero(ids);
    res.json({ message: "Urutan berhasil diupdate" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
