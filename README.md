# bun-vibe-coding

REST API sederhana dengan **Bun**, **ElysiaJS**, **Drizzle ORM**, dan **MySQL**.

## Stack

- [Bun](https://bun.com) — runtime & package manager
- [ElysiaJS](https://elysiajs.com) — web framework
- [Drizzle ORM](https://orm.drizzle.team) — ORM & migration
- [bcrypt](https://www.npmjs.com/package/bcrypt) — hashing password
- [uuid](https://www.npmjs.com/package/uuid) — generate session token
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
| `POST` | `/api/users/login` | Login user, mengembalikan session token |
| `GET` | `/api/users/current` | Ambil data user yang sedang login |
| `DELETE` | `/api/users/logout` | Logout user, menghapus session token |

Dokumentasi API interaktif tersedia di `http://localhost:3000/swagger`.

### Registrasi User

```bash
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

### Login User

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"eko@localhost","password":"rahasia"}'
```

Response sukses — HTTP `200`:

```json
{
  "data": "7050b6f2-7ad3-43ad-92a1-4a3b88375691"
}
```

Nilai `data` adalah UUID session token yang di-generate saat login.

Response gagal — HTTP `401`:

```json
{
  "error": "Email atau Password Salah"
}
```

Pesan error ini dipakai baik untuk email yang tidak terdaftar maupun password yang salah, agar tidak membocorkan email mana yang terdaftar.

### Get Current User

Memerlukan header `Authorization` berisi token hasil login.

```bash
curl http://localhost:3000/api/users/current \
  -H "Authorization: Bearer 7050b6f2-7ad3-43ad-92a1-4a3b88375691"
```

Response sukses — HTTP `200`:

```json
{
  "data": {
    "id": 1,
    "name": "eko",
    "email": "eko@localhost",
    "created_at": "2026-10-21 14:30:42"
  }
}
```

Field `created_at` memakai format MySQL (`YYYY-MM-DD HH:MM:SS`), bukan ISO 8601. Kolom `password` tidak pernah disertakan dalam response.

Response gagal — HTTP `401`:

```json
{
  "error": "Unauthorized"
}
```

Status `401` dikembalikan untuk semua kondisi berikut:

- Header `Authorization` tidak ada
- Header tidak diawali `Bearer `
- Token tidak ditemukan di tabel `sessions`
- Session ditemukan tetapi `user_id`-nya `NULL` (user sudah dihapus)

Kata `Bearer` bersifat case-insensitive, sehingga `bearer` dan `BEARER` juga diterima.

### Logout User

Menghapus session token dari database. Memerlukan header `Authorization`.

```bash
curl -X DELETE http://localhost:3000/api/users/logout \
  -H "Authorization: Bearer 7050b6f2-7ad3-43ad-92a1-4a3b88375691"
```

Response sukses — HTTP `200`:

```json
{
  "data": "OK"
}
```

Baris session dengan token tersebut dihapus dari tabel `sessions`, sehingga token tidak dapat dipakai lagi.

Response gagal — HTTP `401`:

```json
{
  "error": "Unauthorized"
}
```

Status `401` dikembalikan untuk semua kondisi berikut:

- Header `Authorization` tidak ada
- Header tidak diawali `Bearer `
- Token tidak ditemukan di tabel `sessions` (termasuk saat logout dipanggil dua kali)

Logout **tidak** bersifat idempotent: memanggilnya dua kali dengan token yang sama akan mengembalikan `401` pada panggilan kedua.

Berbeda dari `GET /api/users/current`, logout **tetap menghapus** session yang `user_id`-nya `NULL` dan mengembalikan `200`. Tujuan logout adalah menghapus session, dan itu tercapai.

### Format Response Error

| Status | Keterangan |
|--------|------------|
| `401` | Email/password salah, atau token tidak valid |
| `404` | Route tidak ditemukan |
| `409` | Email sudah terdaftar |
| `422` | Validasi request gagal |
| `500` | Kesalahan internal server |

## Struktur Project

```
src/
├── db/
│   ├── index.ts              # Koneksi database
│   └── schema.ts             # Definisi schema Drizzle (users, sessions)
├── routes/
│   └── users-route.ts        # Routing HTTP (prefix /api/users)
├── services/
│   └── users-service.ts      # Logic bisnis registrasi, login, current user
└── index.ts                  # Entry point aplikasi
drizzle/                      # File migration hasil generate
drizzle.config.ts             # Konfigurasi Drizzle Kit
```

### Pemisahan Tanggung Jawab

- **`routes/`** — hanya menangani HTTP: validasi request, pemetaan status code, format response. File memakai suffix `-route.ts`.
- **`services/`** — hanya menangani logic bisnis: query database, hashing password, generate token. Tidak boleh mengimpor `elysia`. File memakai suffix `-service.ts`.

## Skema Database

### Tabel `users`

| Kolom | Tipe | Constraint |
|-------|------|------------|
| `id` | `int` | AUTO_INCREMENT, PRIMARY KEY |
| `name` | `varchar(255)` | NOT NULL |
| `email` | `varchar(255)` | NOT NULL, UNIQUE |
| `password` | `varchar(255)` | NOT NULL — hash bcrypt |
| `created_at` | `timestamp` | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

### Tabel `sessions`

| Kolom | Tipe | Constraint |
|-------|------|------------|
| `id` | `int` | AUTO_INCREMENT, PRIMARY KEY |
| `token` | `varchar(255)` | NOT NULL, UNIQUE — UUID |
| `user_id` | `int` | NULLABLE, FK ke `users.id` ON DELETE SET NULL |
| `created_at` | `timestamp` | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

Satu user hanya memiliki satu session aktif. Setiap kali login berhasil, session lama user tersebut dihapus lebih dulu sebelum token baru dibuat.

## Catatan

- File `.env` tidak di-commit ke repository. Gunakan `.env.example` sebagai template.
- Schema menggunakan `CURRENT_TIMESTAMP` untuk kolom `created_at` agar kompatibel dengan MySQL 5.7.
- Password disimpan sebagai hash bcrypt (`$2b$10$...`), tidak pernah dalam bentuk plaintext.
- **`bun run db:push` dan `bun run db:studio` tidak berfungsi pada MySQL 5.7.** Keduanya memerlukan MySQL 8.0.16+ karena mengandalkan tabel `information_schema.check_constraints`. Gunakan `bun run db:generate` + `bun run db:migrate` sebagai gantinya.
- Validasi email memakai regex permisif (`/^[^\s@]+@[^\s@]+$/`), bukan `format: "email"`, agar domain tanpa TLD seperti `eko@localhost` dapat diterima.
- Endpoint `GET /api/users/current` dan `DELETE /api/users/logout` membaca token langsung dari header pada setiap request. Belum ada middleware autentikasi global.
- Kolom `created_at` pada response `GET /api/users/current` diformat memakai `DATE_FORMAT` di sisi MySQL. Konversi manual di JavaScript memakai `getHours()` dan sejenisnya akan menghasilkan waktu yang meleset karena perbedaan timezone.
