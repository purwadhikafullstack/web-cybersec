# cybersecurity-vulnerable-web

Dua aplikasi web yang **sengaja dibuat rentan** (deliberately vulnerable) untuk Final Project pentest siswa cybersecurity (JCCSAH-001). Lihat spesifikasi lengkap di [`docs/PRD-ecommerce.md`](docs/PRD-ecommerce.md) dan [`docs/PRD-event-ticketing.md`](docs/PRD-event-ticketing.md).

> Status: **kedua aplikasi selesai** (8/8 kerentanan masing-masing, terimplementasi & terverifikasi end-to-end termasuk lewat browser). Lihat [`docs/INSTRUCTOR-ecommerce.md`](docs/INSTRUCTOR-ecommerce.md) dan [`docs/INSTRUCTOR-event-ticketing.md`](docs/INSTRUCTOR-event-ticketing.md) untuk deploy, seed/reset, dan daftar flag per tenant.

## Struktur

| Folder | Deskripsi | Vercel project |
| --- | --- | --- |
| `ecommerce-frontend` | Next.js (App Router) — UI e-commerce | terpisah |
| `ecommerce-backend` | Express.js API — e-commerce | terpisah |
| `ticketing-frontend` | Next.js (App Router) — UI event ticketing | terpisah |
| `ticketing-backend` | Express.js API — event ticketing | terpisah |

Setiap folder adalah project mandiri (package.json sendiri) sehingga bisa di-deploy sebagai 4 project Vercel terpisah, masing-masing dengan Root Directory yang sesuai. Backend terhubung ke PostgreSQL (Supabase) lewat environment variable — lihat `.env.example` di tiap folder backend.

## Local development

Setiap folder dijalankan independen:

```bash
cd ecommerce-backend && npm install && cp .env.example .env && npm run dev   # :4000
cd ecommerce-frontend && npm install && cp .env.example .env.local && npm run dev  # :3000

cd ticketing-backend && npm install && cp .env.example .env && npm run dev   # :4001
cd ticketing-frontend && npm install && cp .env.example .env.local && npm run dev  # :3001
```
