import { Router } from "express";
import { findAllTestimoni, findTestimoniById, createTestimoni, updateStatusTestimoni, deleteTestimoni } from "../repositories/testimoniRepository.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status === "all" ? {} : { status: status || "approved" };
    res.json({ data: await findAllTestimoni(filter) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/", async (req, res) => {
  const { nama, asal, rating, pesan, foto, paket } = req.body;
  if (!nama?.trim() || !pesan?.trim()) {
    return res.status(400).json({ message: "Nama dan pesan wajib diisi." });
  }
  try {
    const t = await createTestimoni({ nama, asal, rating: Math.min(5, Math.max(1, Number(rating) || 5)), pesan, foto, paket });
    res.status(201).json({ message: "Testimoni berhasil dikirim! Akan ditampilkan setelah disetujui.", data: t });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put("/:id/status", async (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ message: "Status harus: approved, rejected, atau pending" });
  }
  try {
    const updated = await updateStatusTestimoni(Number(req.params.id), status);
    if (!updated) return res.status(404).json({ message: "Testimoni tidak ditemukan" });
    res.json({ message: `Testimoni ${status}`, data: updated });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await deleteTestimoni(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Testimoni tidak ditemukan" });
    res.json({ message: "Testimoni dihapus", data: deleted });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
