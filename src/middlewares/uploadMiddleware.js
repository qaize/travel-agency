import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "../../public/uploads");

/**
 * Multer storage untuk upload gambar ke disk (public/uploads/).
 * Nama file: paket-<timestamp>.<ext>
 */
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `paket-${Date.now()}${ext}`);
  },
});

/** Filter: hanya izinkan file gambar */
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Hanya file gambar (jpg, png, webp, dll) yang diizinkan"), false);
  }
};

/**
 * Middleware upload gambar ke disk.
 * Digunakan di route POST/PUT /api/paket.
 * Field name: "gambar"
 * Batas ukuran: 5MB
 */
export const uploadGambar = multer({
  storage: diskStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
}).single("gambar");

/**
 * Middleware upload ke memory buffer.
 * Digunakan untuk endpoint Gemini (image, document, audio).
 */
export const uploadMemory = multer({ storage: multer.memoryStorage() });
