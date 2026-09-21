# PRD - E-commerce (Dummy Vulnerable App)

## Overview & Objectives

Dokumen ini adalah spesifikasi teknis untuk aplikasi web e-commerce yang **sengaja dibuat rentan** (deliberately vulnerable), untuk Final Project (Finpro) JCCSAH-001 format individu — bagian offensive/web-layer dari kombinasi TryHackMe (blue team/SOC) + dummy project offensive.

**Konteks:**

- Salah satu dari 2 dummy project offensive; 3 dari 6 siswa mengerjakan kasus ini (3 siswa lainnya mengerjakan kasus Event Ticketing — PRD terpisah)
- Materi/environment disiapkan sepenuhnya oleh instruktur (Abdi) — siswa tidak membangun, hanya melakukan pentest terhadap aplikasi yang sudah jadi
- Scope murni app-layer (tidak ada kerentanan level server/infrastruktur — di luar cakupan dokumen ini)

**Tujuan aplikasi:**

- Menyediakan target realistis (fullstack, bukan sekadar single-endpoint) untuk siswa melatih web application penetration testing
- Kerentanan yang ditanam harus bisa dipetakan ke rubrik penilaian Finpro yang sudah ada: Analisis Temuan, Rekomendasi Solusi, Kualitas Laporan Teknis, CTF Write-up (flag-based)

**Output dokumen ini:** spesifikasi teknis yang cukup detail untuk diarahkan ke Claude Code sebagai instruksi pembangunan aplikasi — bukan untuk dibaca siswa.

## Tech Stack & Architecture Constraints

**Stack:**

- Frontend: Next.js (App Router)
- Backend: Express.js — sebagai API terpisah (bukan Next.js API routes), di-deploy sebagai serverless functions di Vercel
- Database: PostgreSQL via Supabase
- Hosting: Vercel (FE + BE), Supabase (DB)

**Batasan scope (app-layer only):**

- Kerentanan yang ditanam WAJIB berada di level aplikasi (business logic, auth, API, query, session) — bukan level server/OS/network
- Tidak ada teknik yang membutuhkan akses shell, privilege escalation OS, atau eksploitasi service non-HTTP
- Volume request tinggi (brute force, automated scanning berat) sebaiknya dihindari sebagai satu-satunya jalur eksploitasi, karena berisiko kena rate-limit/bot protection bawaan Vercel edge network

**Isolasi per siswa:**

- 3 siswa mengerjakan kasus ini, masing-masing mendapat data yang terisolasi — bukan environment terpisah penuh, tapi data/state yang tidak saling tercampur
- Dikonfirmasi: 1 deployment dipakai bersama oleh 3 siswa yang mengerjakan kasus ini, setiap siswa punya akun/tenant sendiri, dengan flag unik per siswa tertanam di data miliknya
- Reset mekanisme: perlu cara untuk me-reset data seorang siswa tanpa mengganggu siswa lain (misal re-seed per tenant)

**Kredensial & environment variables:**

- Koneksi Supabase (connection string, service role key) disiapkan oleh instruktur, tidak boleh ter-expose ke client-side bundle
- Environment variables dikelola lewat Vercel project settings, bukan hardcoded

**Repo:** disarankan monorepo (FE + BE dalam satu repo, folder terpisah) agar mudah di-deploy dan di-maintain oleh satu orang (instruktur).

## Fitur & Kerentanan yang Ditanam

**Fitur minimum yang perlu dibangun** (agar kerentanan punya konteks realistis, bukan endpoint telanjang):

- Registrasi/login (email + password)
- Katalog produk + pencarian produk
- Detail produk + review/rating dari user
- Keranjang belanja (cart) + checkout
- Riwayat pesanan per user ("My Orders")
- Kode diskon/kupon saat checkout
- Profil user (edit nama, alamat, dll)
- Admin panel sederhana (kelola produk, lihat semua order)

**Kerentanan yang sengaja ditanam** (masing-masing dengan flag unik per siswa, disisipkan di data/response):

| # | Kerentanan | Lokasi/Mekanisme | Flag |
| --- | --- | --- | --- |
| 1 | IDOR | `GET /api/orders/:id` tidak memverifikasi kepemilikan order — user A bisa lihat order user B hanya dengan mengubah ID | Flag di detail order milik user lain |
| 2 | SQL Injection | Endpoint pencarian produk (`/api/products/search?q=`) menyusun query secara langsung tanpa parameterized query | Flag di tabel tersembunyi (mis. tabel `admin_notes`) yang bisa diekstrak lewat UNION-based injection |
| 3 | Stored XSS | Field review produk tidak di-sanitize saat render di halaman detail produk | Flag muncul saat payload XSS berhasil mengeksekusi (mis. exfiltrate cookie ke endpoint logging) |
| 4 | Broken Access Control (privilege escalation) | Endpoint update profil (`PATCH /api/users/me`) menerima field `role` dari body request tanpa validasi — user bisa ubah role jadi `admin` | Flag muncul di admin panel setelah berhasil eskalasi |
| 5 | Business Logic Flaw (price/quantity tampering) | Endpoint checkout mempercayai `price` dan `quantity` yang dikirim dari client, bukan menghitung ulang dari data server | Flag muncul saat checkout berhasil dengan total harga Rp 0 atau negatif |
| 6 | Insecure Direct Object Reference (kupon) | Kode kupon admin-only bisa ditebak/diakses lewat endpoint yang tidak memvalidasi peran (`GET /api/coupons/:code`) | Flag = kupon rahasia dengan diskon 100% |
| 7 | Sensitive Data Exposure | Endpoint list user (`/api/users`) yang seharusnya admin-only bocor ke non-admin, menampilkan email/nomor telepon semua user | Flag disisipkan sebagai salah satu entri "user" palsu di response |
| 8 | Missing Rate Limiting | Endpoint apply kupon tidak dibatasi percobaan, memungkinkan brute-force kode kupon 4 digit | Flag = kupon yang hanya bisa ditemukan lewat brute-force |

**Catatan implementasi:**

- Setiap flag harus unik per siswa (embed student ID/tenant ke dalam flag string, misal `FLAG{ecom_s3_idor_...}`)
- Kerentanan #4 dan #6 penting untuk terhubung ke admin panel — pastikan admin panel benar-benar menunjukkan sesuatu yang bernilai (bukan halaman kosong) supaya siswa tahu eskalasi berhasil

## Deployment & Data Setup

**Vercel:**

- Frontend (Next.js) dan backend (Express.js) di-deploy sebagai satu project atau dua project terhubung — Claude Code perlu menyesuaikan struktur agar Express bisa jalan sebagai Vercel serverless functions
- Environment variables (Supabase URL, service role key, JWT secret, dll) diset lewat Vercel dashboard, tidak hardcoded di repo

**Supabase (PostgreSQL):**

- 1 project Supabase khusus untuk aplikasi e-commerce ini
- Skema tabel harus mendukung isolasi data per siswa — pendekatan yang disarankan: setiap baris data (produk, order) punya kolom `student_tenant` atau setiap siswa punya akun terpisah dengan data yang di-scope by `user_id`
- Seed data: setiap tenant/siswa di-seed dengan data awal (produk, user dummy lain untuk skenario IDOR, dll) plus flag unik yang tertanam sesuai tabel kerentanan di atas

**Reset & isolasi:**

- Perlu skrip/endpoint reset (admin-only, dipakai instruktur) untuk mengembalikan data satu tenant ke kondisi awal tanpa mempengaruhi tenant lain

**Kredensial siswa:**

- Setiap siswa mendapat 1 akun login, plus akses ke 1-2 akun "korban" dummy untuk skenario IDOR/data exposure

## Deliverables & Instructions for Claude Code

**Yang perlu dihasilkan:**

1. Repo (monorepo: `/frontend` Next.js, `/backend` Express.js)
2. Skema database (SQL migration untuk Supabase) sesuai tabel kerentanan di atas
3. Seed script yang men-generate data per tenant/siswa (termasuk flag unik)
4. Implementasi fitur sesuai daftar di atas, dengan kerentanan yang **sengaja tidak diperbaiki** sesuai tabel
5. `README.md` untuk instruktur: cara deploy ke Vercel + Supabase, cara menjalankan seed/reset, daftar lengkap flag per tenant (untuk keperluan grading, bukan untuk siswa)
6. `.env.example` yang mendaftar semua environment variable yang dibutuhkan

**Di luar scope (jangan dibangun):**

- Payment gateway sungguhan (checkout cukup simulasi, tidak perlu integrasi Midtrans/Stripe dll)
- Notifikasi email/SMS
- Kerentanan level server/infrastruktur
- Mobile app / native app

**Prioritas eksekusi yang disarankan:**

1. Bangun skema DB + seed dulu (termasuk struktur tenant/flag) sebelum fitur, supaya kerentanan bisa langsung diverifikasi begitu endpoint jadi
2. Backend endpoints (termasuk kerentanan yang tertanam) sebelum frontend penuh — frontend minimal cukup untuk mendemonstrasikan alur, tidak perlu polish UI berlebihan
3. Verifikasi setiap kerentanan bisa dieksploitasi end-to-end sebelum deploy final ke Vercel
