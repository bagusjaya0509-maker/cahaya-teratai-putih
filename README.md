# Yayasan Cahaya Teratai Putih

Situs resmi Yayasan Cahaya Teratai Putih, Kota Mataram: profil, kabar kegiatan, booking konsultasi,
dan testimoni, dengan panel pengurus untuk mengatur jadwal, menulis kabar, dan meninjau testimoni.

- Situs statis di GitHub Pages, dibangun oleh `skrip/bangun.mjs` (Node 20+, tanpa dependensi).
- Booking dan testimoni disimpan di Firebase Authentication + Cloud Firestore.
- Sebelum Firebase tersambung, formulir booking menyusun pesan WhatsApp, jadi situs tetap bisa dipakai.
- Panduan pemasangan: **[PANDUAN.md](PANDUAN.md)**.

```bash
node skrip/bangun.mjs && node skrip/sajikan.mjs   # http://localhost:8931/cahaya-teratai-putih/
```
