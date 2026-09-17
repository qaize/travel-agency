import { Router } from "express";
import {
  findAllTestimoni,
  findTestimoniById,
  createTestimoni,
  updateStatusTestimoni,
  deleteTestimoni,
} from "../repositories/testimoniRepository.js";

const router = Router();

// ─── GET /api/testimoni ───────────────────────────────────────────────────────
// Publik: hanya tampilkan yang approved
// Admin:  ?status=pending|approved|rejected|all
router.get("/", (req, res) => {
  try {
    const { status } = req.query;
    // Kalau tidak ada query status → hanya approved (untuk frontend publik)
    const filter = status === "all" ? {} : { status: status || "approved" };
    res.json({ data: findAllTestimoni(filter) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ─── POST /api/testimoni ──────────────────────────────────────────────────────
// Endpoint publik: siapapun bisa submit, status default pending
router.post("/", (req, res) => {
  const { nama, asal, rating, pesan, foto, paket } = req.body;

  if (!nama?.trim() || !pesan?.trim()) {
    return res.status(400).json({ message: "Nama dan pesan wajib diisi." });
  }

  const ratingNum = Math.min(5, Math.max(1, Number(rating) || 5));

  try {
    const testimoni = createTestimoni({ nama, asal, rating: ratingNum, pesan, foto, paket });
    res.status(201).json({
      message: "Testimoni berhasil dikirim! Akan ditampilkan setelah disetujui.",
      data: testimoni,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ─── PUT /api/testimoni/:id/status ───────────────────────────────────────────
// Admin: approve atau reject testimoni
router.put("/:id/status", (req, res) => {
  const { status } = req.body;

  if (!["approved", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ message: "Status harus: approved, rejected, atau pending" });
  }

  try {
    const updated = updateStatusTestimoni(Number(req.params.id), status);
    if (!updated) return res.status(404).json({ message: "Testimoni tidak ditemukan" });
    res.json({ message: `Testimoni ${status}`, data: updated });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ─── DELETE /api/testimoni/:id ────────────────────────────────────────────────
router.delete("/:id", (req, res) => {
  try {
    const deleted = deleteTestimoni(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Testimoni tidak ditemukan" });
    res.json({ message: "Testimoni dihapus", data: deleted });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
