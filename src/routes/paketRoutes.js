import { Router } from "express";
import { uploadGambar, uploadToCloudinary, deleteFromCloudinary } from "../middlewares/uploadMiddleware.js";
import { findAllPaket, findPaketById, createPaket, updatePaket, deletePaket } from "../repositories/paketRepository.js";

const router = Router();

// ─── GET /api/paket ───────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { wilayah, kategori, aktif } = req.query;
    const filters = {};
    if (wilayah)             filters.wilayah  = wilayah;
    if (kategori)            filters.kategori = kategori;
    if (aktif !== undefined) filters.aktif    = aktif;
    res.json({ data: await findAllPaket(filters) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ─── GET /api/paket/:id ───────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const paket = await findPaketById(Number(req.params.id));
    if (!paket) return res.status(404).json({ message: "Paket tidak ditemukan" });
    res.json({ data: paket });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ─── POST /api/paket ──────────────────────────────────────────────────────────
router.post("/", uploadGambar, async (req, res) => {
  try {
    const { nama, lokasi, harga, durasi, deskripsi } = req.body;
    if (!nama || !lokasi || !harga || !durasi || !deskripsi) {
      return res.status(400).json({ message: "Field nama, lokasi, harga, durasi, deskripsi wajib diisi" });
    }

    let gambar = req.body.gambar_url || null;
    if (req.file) {
      gambar = await uploadToCloudinary(req.file.buffer, "lomboktrip/paket");
    }

    const paket = await createPaket({ ...req.body, gambar, harga_coret: req.body.harga_coret || null });
    res.status(201).json({ message: "Paket berhasil ditambahkan", data: paket });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ─── PUT /api/paket/:id ───────────────────────────────────────────────────────
router.put("/:id", uploadGambar, async (req, res) => {
  try {
    const id       = Number(req.params.id);
    const existing = await findPaketById(id);
    if (!existing) return res.status(404).json({ message: "Paket tidak ditemukan" });

    let gambar = existing.gambar;
    if (req.file) {
      // Upload baru ke Cloudinary
      gambar = await uploadToCloudinary(req.file.buffer, "lomboktrip/paket");
      // Hapus gambar lama dari Cloudinary jika bukan URL eksternal
      if (existing.gambar?.includes("cloudinary.com")) {
        await deleteFromCloudinary(existing.gambar);
      }
    } else if (req.body.gambar_url !== undefined) {
      gambar = req.body.gambar_url || null;
    }

    const updated = await updatePaket(id, { ...req.body, gambar });
    res.json({ message: "Paket berhasil diupdate", data: updated });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ─── DELETE /api/paket/:id ────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await deletePaket(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Paket tidak ditemukan" });
    if (deleted.gambar?.includes("cloudinary.com")) {
      await deleteFromCloudinary(deleted.gambar);
    }
    res.json({ message: "Paket berhasil dihapus", data: deleted });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
