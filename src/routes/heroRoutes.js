import { Router } from "express";
import { uploadGambar, uploadToCloudinary, deleteFromCloudinary } from "../middlewares/uploadMiddleware.js";
import { findAllHero, findHeroById, createHero, updateHero, deleteHero, reorderHero } from "../repositories/heroRepository.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { aktif } = req.query;
    const filters = aktif !== undefined ? { aktif } : {};
    res.json({ data: await findAllHero(filters) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const hero = await findHeroById(Number(req.params.id));
    if (!hero) return res.status(404).json({ message: "Hero image tidak ditemukan" });
    res.json({ data: hero });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/", uploadGambar, async (req, res) => {
  try {
    if (!req.file && !req.body.gambar_url) {
      return res.status(400).json({ message: "Gambar wajib diupload atau isi URL gambar" });
    }
    const gambar = req.file
      ? await uploadToCloudinary(req.file.buffer, "lomboktrip/hero")
      : req.body.gambar_url;

    const hero = await createHero({ ...req.body, gambar });
    res.status(201).json({ message: "Hero image berhasil ditambahkan", data: hero });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put("/reorder/order", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids harus berupa array" });
    }
    await reorderHero(ids);
    res.json({ message: "Urutan berhasil diupdate" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put("/:id", uploadGambar, async (req, res) => {
  try {
    const id       = Number(req.params.id);
    const existing = await findHeroById(id);
    if (!existing) return res.status(404).json({ message: "Hero image tidak ditemukan" });

    let gambar = existing.gambar;
    if (req.file) {
      gambar = await uploadToCloudinary(req.file.buffer, "lomboktrip/hero");
      if (existing.gambar?.includes("cloudinary.com")) {
        await deleteFromCloudinary(existing.gambar);
      }
    } else if (req.body.gambar_url !== undefined) {
      gambar = req.body.gambar_url;
    }

    const updated = await updateHero(id, { ...req.body, gambar });
    res.json({ message: "Hero image berhasil diupdate", data: updated });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await deleteHero(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Hero image tidak ditemukan" });
    if (deleted.gambar?.includes("cloudinary.com")) {
      await deleteFromCloudinary(deleted.gambar);
    }
    res.json({ message: "Hero image berhasil dihapus", data: deleted });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
