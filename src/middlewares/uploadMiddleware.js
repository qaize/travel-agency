import "dotenv/config";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// ─── Konfigurasi Cloudinary ───────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload buffer ke Cloudinary dan kembalikan URL.
 * @param {Buffer} buffer - File buffer dari multer memory storage
 * @param {string} folder - Folder di Cloudinary (default: 'lomboktrip')
 * @returns {Promise<string>} URL gambar di Cloudinary
 */
export async function uploadToCloudinary(buffer, folder = "lomboktrip") {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}

/**
 * Hapus gambar dari Cloudinary berdasarkan URL.
 * @param {string} url - URL Cloudinary gambar yang akan dihapus
 */
export async function deleteFromCloudinary(url) {
  try {
    // Ekstrak public_id dari URL Cloudinary
    const parts   = url.split("/");
    const filename = parts[parts.length - 1].split(".")[0];
    const folder   = parts[parts.length - 2];
    const publicId = `${folder}/${filename}`;
    await cloudinary.uploader.destroy(publicId);
  } catch (e) {
    console.warn("Gagal hapus dari Cloudinary:", e.message);
  }
}

/**
 * Middleware upload ke memory buffer.
 * Digunakan untuk semua endpoint upload (paket, hero, gemini).
 * File disimpan di memory dulu, lalu dikirim ke Cloudinary atau Gemini.
 */
export const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("audio/") || file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Tipe file tidak didukung"), false);
    }
  },
});

/**
 * Middleware khusus gambar saja (untuk paket & hero upload).
 */
export const uploadGambar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Hanya file gambar yang diizinkan"), false);
  },
}).single("gambar");
