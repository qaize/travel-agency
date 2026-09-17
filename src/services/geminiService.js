import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

/**
 * System prompt untuk chatbot asisten wisata NTB.
 * Mendefinisikan persona, scope, dan aturan jawaban.
 */
const CHATBOT_SYSTEM_PROMPT = `Kamu adalah asisten wisata virtual bernama "Rinjani" dari LombokTrip, agen perjalanan resmi di Nusa Tenggara Barat (NTB), Indonesia.

Tugasmu adalah membantu wisatawan dengan informasi seputar:
- Destinasi wisata di NTB: Lombok (Gili Trawangan, Gili Meno, Gili Air, Gunung Rinjani, Pantai Pink, Pantai Selong Belanak, Pantai Kuta/Mandalika, Pantai Senggigi, Desa Sade, Air Terjun Sendang Gile, dll)
- Destinasi wisata Sumbawa & Bima: Pulau Moyo, Gunung Tambora, Pantai Maluk, Pantai Lakey, Pulau Kenawa, Istana Dalam Loka, dll
- Paket wisata dan harga perkiraan dari LombokTrip
- Tips perjalanan ke NTB (waktu terbaik, cuaca, transportasi, akomodasi)
- Budaya lokal Sasak, Samawa, Mbojo
- Kuliner khas NTB (Plecing Kangkung, Ayam Taliwang, Sate Rembiga, dll)

Aturan:
- Jawab HANYA pertanyaan yang berkaitan dengan wisata NTB dan layanan LombokTrip
- Jika ditanya di luar topik wisata NTB, arahkan kembali dengan ramah
- Gunakan bahasa Indonesia yang ramah, hangat, dan informatif
- Jika ada pertanyaan pemesanan atau detail harga, sarankan untuk menghubungi CS LombokTrip di WhatsApp ${process.env.WHATSAPP_CS || "6285177430585"}
- Selalu sertakan semangat "Explore NTB!" di akhir jawaban yang membutuhkan motivasi
- Berikan informasi yang akurat; jika tidak yakin, katakan dengan jujur`;

/**
 * Kirim pesan ke chatbot Gemini dengan riwayat percakapan.
 * @param {string} message - Pesan terbaru dari user
 * @param {Array<{role: string, text: string}>} history - Riwayat percakapan sebelumnya
 * @returns {Promise<string>} Teks balasan dari AI
 */
export async function sendChatMessage(message, history = []) {
  const contents = [
    ...history.map((h) => ({
      role: h.role,
      parts: [{ text: h.text }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: { systemInstruction: CHATBOT_SYSTEM_PROMPT },
  });

  return response.text;
}

/**
 * Generate teks dari prompt biasa (tanpa context NTB).
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export async function generateText(prompt) {
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  });
  return response.text;
}

/**
 * Generate konten dari gambar + prompt.
 * @param {string} prompt
 * @param {string} base64Image - Gambar dalam format base64
 * @param {string} mimeType - MIME type gambar (misal: image/jpeg)
 * @returns {Promise<string>}
 */
export async function generateFromImage(prompt, base64Image, mimeType) {
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      { text: prompt, type: "text" },
      { inlineData: { data: base64Image, mimeType }, type: "image" },
    ],
  });
  return response.text;
}

/**
 * Generate konten dari dokumen + prompt.
 * @param {string} prompt
 * @param {string} base64Document
 * @param {string} mimeType
 * @returns {Promise<string>}
 */
export async function generateFromDocument(prompt, base64Document, mimeType) {
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      { text: prompt, type: "text" },
      { inlineData: { data: base64Document, mimeType }, type: "document" },
    ],
  });
  return response.text;
}

/**
 * Generate transkrip atau analisis dari audio + prompt.
 * @param {string} prompt
 * @param {string} base64Audio
 * @param {string} mimeType
 * @returns {Promise<string>}
 */
export async function generateFromAudio(prompt, base64Audio, mimeType) {
  const defaultPrompt = "Tolong buatkan transkrip dari rekaman berikut.";
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      { text: prompt || defaultPrompt, type: "text" },
      { inlineData: { data: base64Audio, mimeType }, type: "audio" },
    ],
  });
  return response.text;
}
