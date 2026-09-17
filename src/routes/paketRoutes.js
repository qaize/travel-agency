import { Router } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { uploadGambar } from "../middlewares/uploadMiddleware.js";
import {
  findAllPaket,
  findPaketById,
  createPaket,
  updatePaket,
  deletePaket,
} from "../repositories/paketRepository.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// ─── GET /api/paket ───────────────────────────────────────────────────────────
// Query params opsional: ?wilayah=lombok&kategori=pantai&aktif=1
router.get("/", (req, res) => {
  try {
    const { wilayah, kategori, aktif } = req.query;
    const filters = {};
    if (wilayah)           filters.wilayah  = wilayah;
    if (kategori)          filters.kategori = kategori;
    if (aktif !== undefined) filters.aktif  = aktif;

    const paket = findAllPaket(filters);
    res.json({ data: paket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET /api/paket/:id ───────────────────────────────────────────────────────
router.get("/:id", (req, res) => {
  try {
    const paket = findPaketById(Number(req.params.id));
    if (!paket) return res.status(404).json({ message: "Paket tidak ditemukan" });
    res.json({ data: paket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── POST /api/paket ──────────────────────────────────────────────────────────
router.post("/", uploadGambar, (req, res) => {
  try {
    const { nama, lokasi, harga, durasi, deskripsi } = req.body;

    if (!nama || !lokasi || !harga || !durasi || !deskripsi) {
      return res.status(400).json({
        message: "Field nama, lokasi, harga, durasi, deskripsi wajib diisi",
      });
    }

    // Tentukan path gambar: file upload > URL dari body
    const gambar = req.file
      ? `/uploads/${req.file.filename}`
      : (req.body.gambar_url || null);

    const paketBaru = createPaket({
      ...req.body,
      gambar,
      harga_coret: req.body.harga_coret || null,
    });
    res.status(201).json({ message: "Paket berhasil ditambahkan", data: paketBaru });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── PUT /api/paket/:id ───────────────────────────────────────────────────────
router.put("/:id", uploadGambar, (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = findPaketById(id);
    if (!existing) return res.status(404).json({ message: "Paket tidak ditemukan" });

    // Tentukan gambar: file baru > URL baru > tetap gambar lama
    let gambar = existing.gambar;

    if (req.file) {
      gambar = `/uploads/${req.file.filename}`;
      // Hapus file gambar lama dari disk jika ada
      if (existing.gambar?.startsWith("/uploads/")) {
        const oldFilePath = path.join(__dirname, "../../public", existing.gambar);
        if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
      }
    } else if (req.body.gambar_url !== undefined) {
      gambar = req.body.gambar_url || null;
    }

    const paketUpdated = updatePaket(id, { ...req.body, gambar });
    res.json({ message: "Paket berhasil diupdate", data: paketUpdated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── DELETE /api/paket/:id ────────────────────────────────────────────────────
router.delete("/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const deletedPaket = deletePaket(id);

    if (!deletedPaket) {
      return res.status(404).json({ message: "Paket tidak ditemukan" });
    }

    // Hapus file gambar dari disk jika ada
    if (deletedPaket.gambar?.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "../../public", deletedPaket.gambar);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.json({ message: "Paket berhasil dihapus", data: deletedPaket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
