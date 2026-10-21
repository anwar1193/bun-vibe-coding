# bun-vibe-coding

REST API sederhana dengan **Bun**, **ElysiaJS**, **Drizzle ORM**, dan **MySQL**.

## Stack

- [Bun](https://bun.com) — runtime & package manager
- [ElysiaJS](https://elysiajs.com) — web framework
- [Drizzle ORM](https://orm.drizzle.team) — ORM & migration
- [bcrypt](https://www.npmjs.com/package/bcrypt) — hashing password
- MySQL — database

## Prasyarat

- Bun terpasang
- MySQL server berjalan (project ini diuji pada MySQL 5.7)

## Setup

1. Install dependency:

   ```bash
   bun install
   ```

2. Salin file environment dan sesuaikan kredensial database:

   ```bash
   cp .env.example .env
   ```

   Variabel yang tersedia:

   | Variabel | Keterangan | Default |
   |----------|------------|---------|
   | `DB_HOST` | Host database | `localhost` |
   | `DB_PORT` | Port database | `3306` |
   | `DB_USER` | User database | `root` |
   | `DB_PASSWORD` | Password database | — |
   | `DB_NAME` | Nama database | `bun_vibe_coding` |
   | `PORT` | Port HTTP server | `3000` |

3. Buat database di MySQL:

   ```sql
   CREATE DATABASE bun_vibe_coding CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

4. Jalankan migration:

   ```bash
   bun run db:migrate
   ```

5. Jalankan server:

   ```bash
   bun run dev
   ```

   Server berjalan di `http://localhost:3000`.

## Script

| Script | Fungsi |
|--------|--------|
| `bun run dev` | Jalankan server dengan hot reload |
| `bun run start` | Jalankan server untuk production |
| `bun run typecheck` | Cek tipe TypeScript |
| `bun run db:generate` | Generate file migration dari schema |
| `bun run db:migrate` | Jalankan migration ke database |
| `bun run db:push` | Push schema langsung ke database — **tidak jalan di MySQL 5.7** |
| `bun run db:studio` | Buka Drizzle Studio — **tidak jalan di MySQL 5.7** |

## Endpoint

| Method | Path | Keterangan |
|--------|------|------------|
| `GET` | `/` | Health check |
| `POST` | `/api/users` | Registrasi user baru |

Dokumentasi API interaktif tersedia di `http://localhost:3000/swagger`.

### Contoh

```bash
# Registrasi user baru
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Eko","email":"eko@localhost","password":"rahasia"}'
```

Response sukses — HTTP `201`:

```json
{
  "data": "OK"
}
```

Response gagal (email sudah terdaftar) — HTTP `409`:

```json
{
  "error": "Email sudah terdaftar"
}
```

### Format Response Error

| Status | Keterangan |
|--------|------------|
| `404` | Route tidak ditemukan |
| `409` | Email sudah terdaftar |
| `422` | Validasi request gagal |
| `500` | Kesalahan internal server |

## Struktur Project

```
src/
├── db/
│   ├── index.ts              # Koneksi database
│   └── schema.ts             # Definisi schema Drizzle
├── routes/
│   └── users-route.ts        # Routing HTTP (prefix /api/users)
├── services/
│   └── users-service.ts      # Logic bisnis registrasi user
└── index.ts                  # Entry point aplikasi
drizzle/                      # File migration hasil generate
drizzle.config.ts             # Konfigurasi Drizzle Kit
```

### Pemisahan Tanggung Jawab

- **`routes/`** — hanya menangani HTTP: validasi request, pemetaan status code, format response. File memakai suffix `-route.ts`.
- **`services/`** — hanya menangani logic bisnis: query database, hashing password. Tidak boleh mengimpor `elysia`. File memakai suffix `-service.ts`.

## Catatan

- File `.env` tidak di-commit ke repository. Gunakan `.env.example` sebagai template.
- Schema menggunakan `CURRENT_TIMESTAMP` untuk kolom `created_at` agar kompatibel dengan MySQL 5.7.
- Password disimpan sebagai hash bcrypt (`$2b$10$...`), tidak pernah dalam bentuk plaintext.
- **`bun run db:push` dan `bun run db:studio` tidak berfungsi pada MySQL 5.7.** Keduanya memerlukan MySQL 8.0.16+ karena mengandalkan tabel `information_schema.check_constraints`. Gunakan `bun run db:generate` + `bun run db:migrate` sebagai gantinya.
- Validasi email memakai regex permisif (`/^[^\s@]+@[^\s@]+$/`), bukan `format: "email"`, agar domain tanpa TLD seperti `eko@localhost` dapat diterima.
