# 🌴 LombokTrip — Travel Agency NTB

> **Website:** [https://lomboktrip.vercel.app/](https://lomboktrip.vercel.app/)

Platform pemesanan paket wisata Nusa Tenggara Barat (NTB) — Lombok, Sumbawa, dan Bima. Dilengkapi chatbot AI asisten wisata bernama **Rinjani**, panel admin, dan manajemen konten dinamis.

---

## ✨ Fitur Utama

- **Landing Page** — Hero slider dinamis, daftar paket wisata, testimoni, dan statistik
- **Chatbot AI "Rinjani"** — Asisten wisata NTB berbasis Google Gemini AI dengan riwayat percakapan
- **Panel Admin** — Kelola paket wisata, hero images, testimoni, dan pengaturan situs
- **Upload Gambar** — Upload ke Cloudinary dengan optimasi otomatis (format & kualitas)
- **Moderasi Testimoni** — Sistem approval/reject sebelum ditampilkan ke publik
- **Filter Paket** — Filter berdasarkan wilayah (Lombok/Sumbawa) dan kategori (pantai/petualangan)

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Runtime** | Node.js ≥ 18 |
| **Framework** | Express.js v5 |
| **Database** | Turso (libSQL / SQLite edge) |
| **AI / Chatbot** | Google Gemini AI (`@google/genai`) |
| **Storage Gambar** | Cloudinary |
| **Upload** | Multer (memory storage) |
| **Frontend** | HTML, CSS, Vanilla JavaScript |
| **Deployment** | Vercel (Serverless) |
| **Env Config** | dotenv |

---

## 📁 Struktur Project

```
travel_agency/
├── public/
│   ├── index.html          # Landing page utama
│   ├── admin.html          # Panel admin
│   ├── script.js           # Logic frontend utama
│   ├── lightbox.js         # Lightbox untuk galeri gambar
│   ├── style.css           # Stylesheet global
│   └── admin/
│       └── js/             # Script khusus admin panel
├── src/
│   ├── config/
│   │   └── db.js           # Inisialisasi Turso DB, schema, dan seed data
│   ├── routes/
│   │   ├── paketRoutes.js      # CRUD paket wisata
│   │   ├── heroRoutes.js       # CRUD hero/slider images
│   │   ├── testimoniRoutes.js  # CRUD & moderasi testimoni
│   │   ├── settingsRoutes.js   # Pengaturan situs (statistik, dll)
│   │   └── chatRoutes.js       # Chatbot AI & Gemini multimodal
│   ├── repositories/
│   │   ├── paketRepository.js
│   │   ├── heroRepository.js
│   │   ├── testimoniRepository.js
│   │   └── settingsRepository.js
│   ├── services/
│   │   └── geminiService.js    # Integrasi Google Gemini AI
│   └── middlewares/
│       └── uploadMiddleware.js # Multer + Cloudinary upload
├── server.js               # Entry point & konfigurasi Express
├── vercel.json             # Konfigurasi deployment Vercel
└── .env.example            # Template environment variables
```

---

## 🗃️ Skema Database

### `paket_wisata`
Data paket perjalanan yang dijual — nama, lokasi, wilayah, kategori, harga, durasi, deskripsi, fasilitas, badge, rating, dan galeri gambar (array JSON).

### `hero_images`
Gambar slider pada bagian hero landing page, lengkap dengan judul, subjudul, dan urutan tampil.

### `testimoni`
Ulasan dari wisatawan dengan sistem status: `pending` → `approved` / `rejected`. Hanya testimoni `approved` yang ditampilkan publik.

### `site_settings`
Pengaturan situs berupa pasangan key-value, digunakan untuk statistik dinamis di landing page (jumlah wisatawan, destinasi, dsb).

---

## 🤖 Chatbot AI — Rinjani

Chatbot berbasis **Google Gemini** (`gemini-2.0-flash`) dengan persona asisten wisata NTB. Mendukung:

- Percakapan multi-turn dengan riwayat chat
- Generasi teks dari prompt (`/generate-text`)
- Analisis gambar multimodal (`/generate-from-image`)
- Analisis dokumen PDF (`/generate-from-document`)
- Transkripsi & analisis audio (`/generate-from-audio`)

---

## 🔌 API Endpoints

### Paket Wisata
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/paket` | Daftar semua paket (filter: `wilayah`, `kategori`, `aktif`) |
| `GET` | `/api/paket/:id` | Detail paket |
| `POST` | `/api/paket` | Tambah paket baru (multipart/form-data) |
| `PUT` | `/api/paket/:id` | Update paket |
| `DELETE` | `/api/paket/:id` | Hapus paket |
| `DELETE` | `/api/paket/:id/gambar/:index` | Hapus satu gambar dari paket |

### Hero / Slider
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/hero` | Daftar hero images |
| `POST` | `/api/hero` | Tambah hero image |
| `PUT` | `/api/hero/:id` | Update hero image |
| `PUT` | `/api/hero/reorder/order` | Atur ulang urutan slider |
| `DELETE` | `/api/hero/:id` | Hapus hero image |

### Testimoni
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/testimoni` | Daftar testimoni (default: `approved`) |
| `POST` | `/api/testimoni` | Kirim testimoni baru (status: `pending`) |
| `PUT` | `/api/testimoni/:id/status` | Update status (`approved`/`rejected`/`pending`) |
| `DELETE` | `/api/testimoni/:id` | Hapus testimoni |

### Settings
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/settings` | Ambil semua pengaturan |
| `PUT` | `/api/settings` | Update pengaturan (batch key-value) |

### Chatbot & AI
| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/chat` | Chat dengan Rinjani (JSON: `message`, `history`) |
| `POST` | `/generate-text` | Generate teks dari prompt |
| `POST` | `/generate-from-image` | Analisis gambar + prompt |
| `POST` | `/generate-from-document` | Analisis dokumen PDF + prompt |
| `POST` | `/generate-from-audio` | Transkripsi/analisis audio |

### Auth
| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/admin/login` | Login admin (body: `password`) |

---

## ⚙️ Setup & Instalasi

### 1. Clone & Install
```bash
git clone <repo-url>
cd travel_agency
npm install
```

### 2. Konfigurasi Environment
Salin `.env.example` menjadi `.env` lalu isi nilainya:

```bash
cp .env.example .env
```

```env
PORT=3000
CORS_ORIGIN=*

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash

TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

ADMIN_PASSWORD=ganti_dengan_password_kuat
WHATSAPP_CS=628xxxxxxxxxx
```

### 3. Jalankan Server
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Server berjalan di `http://localhost:3000`
Admin panel di `http://localhost:3000/admin.html`

---

## 🚀 Deployment (Vercel)

Project ini dikonfigurasi untuk deploy ke Vercel via `vercel.json`. Database menggunakan **Turso** (SQLite edge) agar kompatibel dengan environment serverless.

```bash
vercel deploy
```

Pastikan seluruh environment variable sudah diset di dashboard Vercel.

---

## 📦 Dependencies

```json
"@google/genai": "^2.23.0"    // Google Gemini AI SDK
"@libsql/client": "0.14.0"    // Turso/libSQL client
"cloudinary": "2.5.1"         // Cloud image storage
"cors": "2.8.6"               // CORS middleware
"dotenv": "^17.4.2"           // Environment variables
"express": "^5.2.1"           // Web framework
"multer": "^2.4.0"            // Multipart file upload
```

---

## 🌐 Live Demo

**[https://lomboktrip.vercel.app/](https://lomboktrip.vercel.app/)**
