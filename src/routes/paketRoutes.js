import { Router } from "express";
import {
  uploadGambarMultiple,
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../middlewares/uploadMiddleware.js";
import {
  findAllPaket,
  findPaketById,
  createPaket,
  updatePaket,
  deletePaket,
  parseGambar,
  serializeGambar,
} from "../repositories/paketRepository.js";

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
router.post("/", uploadGambarMultiple, async (req, res) => {
  try {
    const { nama, lokasi, harga, durasi, deskripsi } = req.body;
    if (!nama || !lokasi || !harga || !durasi || !deskripsi) {
      return res.status(400).json({ message: "Field nama, lokasi, harga, durasi, deskripsi wajib diisi" });
    }

    // Upload semua file baru ke Cloudinary (paralel)
    const uploadedUrls = req.files?.length
      ? await Promise.all(req.files.map((f) => uploadToCloudinary(f.buffer, "lomboktrip/paket")))
      : [];

    // Gabung dengan URL eksternal yang dikirim via form (gambar_urls = JSON array string)
    const urlsFromBody = _parseUrlsFromBody(req.body.gambar_urls);
    const gambar       = [...uploadedUrls, ...urlsFromBody];

    const paket = await createPaket({
      ...req.body,
      gambar,
      harga_coret: req.body.harga_coret || null,
    });
    res.status(201).json({ message: "Paket berhasil ditambahkan", data: paket });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ─── PUT /api/paket/:id ───────────────────────────────────────────────────────
router.put("/:id", uploadGambarMultiple, async (req, res) => {
  try {
    const id       = Number(req.params.id);
    const existing = await findPaketById(id);
    if (!existing) return res.status(404).json({ message: "Paket tidak ditemukan" });

    // Mulai dari gambar yang sudah ada (dikirim kembali dari form sebagai JSON)
    // gambar_existing = JSON string dari URL yang dipertahankan
    const keptUrls = _parseUrlsFromBody(req.body.gambar_existing);

    // Upload file-file baru ke Cloudinary
    const newUrls = req.files?.length
      ? await Promise.all(req.files.map((f) => uploadToCloudinary(f.buffer, "lomboktrip/paket")))
      : [];

    // Tambah URL eksternal baru jika ada
    const extUrls = _parseUrlsFromBody(req.body.gambar_urls);

    // Gabung: gambar lama yang dipertahankan + upload baru + URL baru
    const gambar = [...keptUrls, ...newUrls, ...extUrls];

    // Hapus dari Cloudinary gambar lama yang tidak dipertahankan
    const removedUrls = existing.gambar.filter(
      (url) => url.includes("cloudinary.com") && !keptUrls.includes(url)
    );
    await Promise.allSettled(removedUrls.map((url) => deleteFromCloudinary(url)));

    const updated = await updatePaket(id, { ...req.body, gambar });
    res.json({ message: "Paket berhasil diupdate", data: updated });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ─── DELETE /api/paket/:id/gambar/:index ──────────────────────────────────────
// Hapus satu gambar dari array berdasarkan index (0-based)
router.delete("/:id/gambar/:index", async (req, res) => {
  try {
    const id    = Number(req.params.id);
    const index = Number(req.params.index);
    const paket = await findPaketById(id);
    if (!paket) return res.status(404).json({ message: "Paket tidak ditemukan" });

    const gambar = [...paket.gambar];
    if (index < 0 || index >= gambar.length) {
      return res.status(400).json({ message: "Index gambar tidak valid" });
    }

    const [removed] = gambar.splice(index, 1);

    // Hapus dari Cloudinary jika bukan URL eksternal
    if (removed?.includes("cloudinary.com")) {
      await deleteFromCloudinary(removed);
    }

    const updated = await updatePaket(id, { gambar });
    res.json({ message: "Gambar berhasil dihapus", data: updated });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ─── DELETE /api/paket/:id ────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await deletePaket(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Paket tidak ditemukan" });

    // Hapus semua gambar dari Cloudinary
    const cloudinaryUrls = deleted.gambar.filter((url) => url.includes("cloudinary.com"));
    await Promise.allSettled(cloudinaryUrls.map((url) => deleteFromCloudinary(url)));

    res.json({ message: "Paket berhasil dihapus", data: deleted });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ─── Helper internal ──────────────────────────────────────────────────────────

/**
 * Parse array URL dari body form.
 * Menerima: JSON string '["url1","url2"]' atau string kosong/undefined
 * @returns {string[]}
 */
function _parseUrlsFromBody(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    // Mungkin single URL string biasa
    return raw.trim() ? [raw.trim()] : [];
  }
}

export default router;
