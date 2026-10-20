# bun-vibe-coding

REST API sederhana dengan **Bun**, **ElysiaJS**, **Drizzle ORM**, dan **MySQL**.

## Stack

- [Bun](https://bun.com) — runtime & package manager
- [ElysiaJS](https://elysiajs.com) — web framework
- [Drizzle ORM](https://orm.drizzle.team) — ORM & migration
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
| `bun run db:push` | Push schema langsung ke database (tanpa file migration) |
| `bun run db:studio` | Buka Drizzle Studio untuk inspeksi data |

## Endpoint

| Method | Path | Keterangan |
|--------|------|------------|
| `GET` | `/` | Health check |
| `GET` | `/users` | Ambil semua user |
| `GET` | `/users/:id` | Ambil user berdasarkan id |
| `POST` | `/users` | Tambah user baru |
| `PUT` | `/users/:id` | Ubah data user |
| `DELETE` | `/users/:id` | Hapus user |

Dokumentasi API interaktif tersedia di `http://localhost:3000/swagger`.

### Contoh

```bash
# Tambah user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Munawar Ahmad","email":"munawar@example.com"}'

# Ambil semua user
curl http://localhost:3000/users

# Ubah user
curl -X PUT http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Nama Baru"}'

# Hapus user
curl -X DELETE http://localhost:3000/users/1
```

### Format Response Error

| Status | Keterangan |
|--------|------------|
| `404` | Data tidak ditemukan |
| `409` | Email sudah digunakan |
| `422` | Validasi request gagal |
| `500` | Kesalahan internal server |

## Struktur Project

```
src/
├── db/
│   ├── index.ts      # Koneksi database
│   └── schema.ts     # Definisi schema Drizzle
├── routes/
│   └── users.ts      # Endpoint CRUD users
└── index.ts          # Entry point aplikasi
drizzle/              # File migration hasil generate
drizzle.config.ts     # Konfigurasi Drizzle Kit
```

## Catatan

- File `.env` tidak di-commit ke repository. Gunakan `.env.example` sebagai template.
- Schema menggunakan `CURRENT_TIMESTAMP` untuk kolom `created_at` agar kompatibel dengan MySQL 5.7.
