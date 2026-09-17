import { Router } from "express";
import { uploadMemory } from "../middlewares/uploadMiddleware.js";
import {
  sendChatMessage,
  generateText,
  generateFromImage,
  generateFromDocument,
  generateFromAudio,
} from "../services/geminiService.js";

const router = Router();

// ─── POST /chat ───────────────────────────────────────────────────────────────
// Body: { message: string, history: Array<{role: "user"|"model", text: string}> }
router.post("/chat", async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ message: "Pesan tidak boleh kosong." });
  }

  try {
    const reply = await sendChatMessage(message, history);
    res.json({ result: reply });
  } catch (error) {
    console.error("[/chat error]", error.message);
    res.status(500).json({ message: error.message });
  }
});

// ─── POST /generate-text ─────────────────────────────────────────────────────
// Body: { prompt: string }
router.post("/generate-text", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt?.trim()) {
    return res.status(400).json({ message: "Prompt tidak boleh kosong." });
  }

  try {
    const result = await generateText(prompt);
    res.json({ result });
  } catch (error) {
    console.error("[/generate-text error]", error.message);
    res.status(500).json({ message: error.message });
  }
});

// ─── POST /generate-from-image ────────────────────────────────────────────────
// Form-data: file "image" + field "prompt"
router.post("/generate-from-image", uploadMemory.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "File gambar diperlukan." });

  const { prompt = "Deskripsikan gambar ini." } = req.body;
  const base64Image = req.file.buffer.toString("base64");

  try {
    const result = await generateFromImage(prompt, base64Image, req.file.mimetype);
    res.json({ result });
  } catch (error) {
    console.error("[/generate-from-image error]", error.message);
    res.status(500).json({ message: "Gagal memproses gambar." });
  }
});

// ─── POST /generate-from-document ────────────────────────────────────────────
// Form-data: file "document" + field "prompt"
router.post("/generate-from-document", uploadMemory.single("document"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "File dokumen diperlukan." });

  const { prompt = "Rangkum dokumen ini." } = req.body;
  const base64Document = req.file.buffer.toString("base64");

  try {
    const result = await generateFromDocument(prompt, base64Document, req.file.mimetype);
    res.json({ result });
  } catch (error) {
    console.error("[/generate-from-document error]", error.message);
    res.status(500).json({ message: "Gagal memproses dokumen." });
  }
});

// ─── POST /generate-from-audio ────────────────────────────────────────────────
// Form-data: file "audio" + field "prompt" (opsional)
router.post("/generate-from-audio", uploadMemory.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "File audio diperlukan." });

  const { prompt } = req.body;
  const base64Audio = req.file.buffer.toString("base64");

  try {
    const result = await generateFromAudio(prompt, base64Audio, req.file.mimetype);
    res.json({ result });
  } catch (error) {
    console.error("[/generate-from-audio error]", error.message);
    res.status(500).json({ message: "Gagal memproses audio." });
  }
});

export default router;
