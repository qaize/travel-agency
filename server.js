import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Routes
import paketRoutes     from "./src/routes/paketRoutes.js";
import chatRoutes      from "./src/routes/chatRoutes.js";
import heroRoutes      from "./src/routes/heroRoutes.js";
import testimoniRoutes from "./src/routes/testimoniRoutes.js";
import settingsRoutes  from "./src/routes/settingsRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// ─── Middleware global ────────────────────────────────────────────────────────
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ─── Static files ─────────────────────────────────────────────────────────────
// Serve folder public/ → index.html, admin.html, style.css, script.js
app.use(express.static(path.join(__dirname, "public")));
// Serve uploads → /uploads/<filename>
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/paket",     paketRoutes);
app.use("/api/hero",      heroRoutes);
app.use("/api/testimoni", testimoniRoutes);
app.use("/api/settings",  settingsRoutes);
app.use("/",              chatRoutes);

// ─── Admin auth endpoint ──────────────────────────────────────────────────────
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false, message: "Password salah" });
  }
});

// ─── 404 handler untuk route API yang tidak ditemukan ────────────────────────
app.use("/api", (req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} tidak ditemukan` });
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅  LombokTrip server berjalan di http://localhost:${PORT}`);
  console.log(`📋  Admin panel  → http://localhost:${PORT}/admin.html`);
  console.log(`🤖  Chatbot API  → POST http://localhost:${PORT}/chat`);
  console.log(`📦  Paket API    → http://localhost:${PORT}/api/paket`);
});
