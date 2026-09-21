# PRD - Event Ticketing (Dummy Vulnerable App)

## Overview & Objectives

Dokumen ini adalah spesifikasi teknis untuk aplikasi web event ticketing yang **sengaja dibuat rentan** (deliberately vulnerable), untuk Final Project (Finpro) JCCSAH-001 format individu — bagian offensive/web-layer dari kombinasi TryHackMe (blue team/SOC) + dummy project offensive.

**Konteks:**

- Salah satu dari 2 dummy project offensive; 3 dari 6 siswa mengerjakan kasus ini (3 siswa lainnya mengerjakan kasus E-commerce — PRD terpisah)
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

**Fitur minimum yang perlu dibangun:**

- Registrasi/login
- Daftar event + detail event (deskripsi, tanggal, harga, kuota kursi)
- Pemilihan jumlah/kursi tiket + checkout
- "My Tickets" — riwayat tiket milik user, masing-masing dengan kode/QR unik
- Kode promo saat checkout
- Admin panel: buat/edit event, lihat semua penjualan

**Kerentanan yang sengaja ditanam:**

| # | Kerentanan | Lokasi/Mekanisme | Flag |
| --- | --- | --- | --- |
| 1 | IDOR | `GET /api/tickets/:id` tidak memverifikasi kepemilikan tiket — user bisa lihat/unduh tiket (termasuk QR code) milik user lain hanya dengan mengubah ID | Flag di detail tiket milik user lain |
| 2 | Race Condition (overselling) | Endpoint pemesanan kursi (`POST /api/events/:id/book`) tidak menggunakan locking/transaction yang tepat — request paralel bisa memesan kursi yang sama lebih dari kapasitas | Flag muncul saat berhasil memesan kursi ke-N+1 pada event berkuota N (dibuktikan lewat concurrent request) |
| 3 | Business Logic Flaw (quantity/price tampering) | Endpoint checkout mempercayai `quantity` dan `price` dari client — quantity negatif bisa mengurangi total, atau harga bisa diubah langsung | Flag muncul saat checkout berhasil dengan total Rp 0 atau minus |
| 4 | Broken Access Control (privilege escalation) | Endpoint create/edit event (`POST /api/events`) tidak memvalidasi role di server, hanya disembunyikan di UI | Flag muncul setelah user biasa berhasil membuat event lewat direct API call |
| 5 | SSRF | Fitur upload banner event via URL (`POST /api/events/:id/banner-from-url`) — server melakukan fetch ke URL yang diberikan tanpa validasi/whitelist, bisa diarahkan ke endpoint internal | Flag disisipkan di endpoint internal/metadata yang berhasil diakses lewat SSRF |
| 6 | Stored XSS | Field deskripsi event tidak di-sanitize saat ditampilkan | Flag muncul saat payload XSS berhasil dieksekusi di halaman detail event |
| 7 | Insecure JWT Handling | Backend menerima token dengan `alg: none` atau tidak memverifikasi signature dengan benar, memungkinkan user memalsukan token dengan role admin | Flag muncul di endpoint admin-only setelah token dipalsukan |
| 8 | Missing Rate Limiting | Endpoint apply kode promo tidak dibatasi, memungkinkan brute-force kode promo | Flag = kode promo tersembunyi dengan diskon besar |

**Catatan implementasi:**

- Kerentanan #2 (race condition) butuh disain khusus supaya bisa direproduksi dengan tool sederhana (curl paralel/Burp Intruder) — pastikan kuota kursi cukup kecil (misal 5) agar mudah dibuktikan
- Kerentanan #5 (SSRF) perlu endpoint "internal" tiruan yang aman untuk diakses sebagai bukti (bukan resource produksi sungguhan)
- Flag unik per siswa, di-embed ke flag string (misal `FLAG{ticket_s2_idor_...}`)

## Deployment & Data Setup

**Vercel:**

- Frontend (Next.js) dan backend (Express.js) di-deploy sebagai satu project atau dua project terhubung — Claude Code perlu menyesuaikan struktur agar Express bisa jalan sebagai Vercel serverless functions
- Environment variables (Supabase URL, service role key, JWT secret, dll) diset lewat Vercel dashboard, tidak hardcoded di repo

**Supabase (PostgreSQL):**

- 1 project Supabase khusus untuk aplikasi event ticketing ini
- Skema tabel harus mendukung isolasi data per siswa — pendekatan yang disarankan: setiap baris data (event, tiket) punya kolom `student_tenant` atau setiap siswa punya akun terpisah dengan data yang di-scope by `user_id`
- Seed data: setiap tenant/siswa di-seed dengan data awal (event, user dummy lain untuk skenario IDOR, dll) plus flag unik yang tertanam sesuai tabel kerentanan di atas

**Reset & isolasi:**

- Perlu skrip/endpoint reset (admin-only, dipakai instruktur) untuk mengembalikan data satu tenant ke kondisi awal tanpa mempengaruhi tenant lain — penting terutama untuk kerentanan #2 (race condition) yang mengubah kuota kursi

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
2. Backend endpoints (termasuk kerentanan yang tertanam, terutama race condition #2) sebelum frontend penuh — frontend minimal cukup untuk mendemonstrasikan alur, tidak perlu polish UI berlebihan
3. Verifikasi setiap kerentanan bisa dieksploitasi end-to-end (termasuk uji concurrent request untuk race condition) sebelum deploy final ke Vercel
