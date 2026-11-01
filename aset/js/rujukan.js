// Daftar rujukan yang dipakai situs dan panel pengurus.

export const LAYANAN_BOOKING = [
  { kunci: 'konseling', nama: 'Konseling kehidupan', ikon: 'message-circle', ringkas: 'Masalah keluarga, tekanan batin, atau peristiwa berat yang sulit diceritakan.' },
  { kunci: 'spiritual', nama: 'Konsultasi spiritual', ikon: 'sprout', ringkas: 'Bimbingan dharma dan kesadaran diri untuk keputusan hidup sehari-hari.' },
  { kunci: 'pengobatan', nama: 'Pengobatan non-medis', ikon: 'hand-heart', ringkas: 'Pendampingan penyembuhan batin, sebagai pelengkap perawatan dokter.' },
  { kunci: 'meditasi', nama: 'Meditasi dan yoga', ikon: 'flower-2', ringkas: 'Belajar dari awal atau memperdalam latihan bersama pembimbing.' },
  { kunci: 'homma', nama: 'Upacara Homma Jnana', ikon: 'landmark', ringkas: 'Bertanya tentang upacara atau mendaftarkan diri dan keluarga.' },
  { kunci: 'lainnya', nama: 'Keperluan lain', ikon: 'circle-help', ringkas: 'Belum yakin termasuk yang mana? Ceritakan di kolom catatan.' },
];

export const CARA_BERTEMU = [
  { kunci: 'tatap-muka', nama: 'Datang ke yayasan', ket: 'Jl. Gora Gang Markisa No. 3, Cakranegara' },
  { kunci: 'telepon', nama: 'Telepon WhatsApp', ket: 'Pengurus menelepon nomor Anda' },
  { kunci: 'video', nama: 'Panggilan video', ket: 'Untuk yang tinggal di luar Mataram' },
];

export const STATUS_BOOKING = {
  baru: 'Menunggu konfirmasi',
  terjadwal: 'Terjadwal',
  selesai: 'Selesai',
  batal: 'Dibatalkan',
};
export const STATUS_TESTIMONI = { menunggu: 'Menunggu tinjauan', tampil: 'Tampil di situs', ditolak: 'Tidak ditampilkan' };

// Jadwal bawaan sebelum pengurus mengaturnya di panel. Hari: 0 = Minggu.
export const PENGATURAN_BAWAAN = {
  hariBuka: [0, 1, 2, 3, 4, 5, 6],
  sesi: [
    { kunci: 'pagi', nama: 'Pagi', jam: '09.00–12.00 WITA' },
    { kunci: 'sore', nama: 'Sore', jam: '15.00–18.00 WITA' },
  ],
  libur: [],
  produk: [],
  catatanBooking: '',
};

export const KOTA_NTB = [
  'Kota Mataram', 'Kabupaten Lombok Barat', 'Kabupaten Lombok Tengah', 'Kabupaten Lombok Timur', 'Kabupaten Lombok Utara',
  'Kabupaten Sumbawa Barat', 'Kabupaten Sumbawa', 'Kabupaten Dompu', 'Kabupaten Bima', 'Kota Bima',
];

/** Saran kabupaten/kota NTB pada setiap kolom kota. */
export function pasangKota(akar = document) {
  if (!document.getElementById('kota-ntb')) {
    const dl = document.createElement('datalist');
    dl.id = 'kota-ntb';
    dl.innerHTML = KOTA_NTB.map((k) => `<option value="${k}">`).join('');
    document.body.append(dl);
  }
  akar.querySelectorAll('input[name=kota]').forEach((i) => i.setAttribute('list', 'kota-ntb'));
}

export const namaLayanan = (k) => LAYANAN_BOOKING.find((x) => x.kunci === k)?.nama || k || '-';
export const namaCara = (k) => CARA_BERTEMU.find((x) => x.kunci === k)?.nama || k || '-';
export const namaSesi = (k, sesi = PENGATURAN_BAWAAN.sesi) => {
  const s = sesi.find((x) => x.kunci === k);
  return s ? `${s.nama} (${s.jam})` : k || '-';
};

/** Nomor booking yang mudah dibacakan lewat telepon: BK-2611-7K2QF */
export function nomorBooking(id, ms = Date.now()) {
  const d = new Date(ms + 8 * 3600e3);
  const yymm = String(d.getUTCFullYear()).slice(2) + String(d.getUTCMonth() + 1).padStart(2, '0');
  const kode = String(id).replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase().replace(/[O]/g, '0').replace(/[I]/g, '1');
  return `BK-${yymm}-${kode}`;
}

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const NAMA_HARI = HARI;

/** yyyy-mm-dd menjadi "Sabtu, 7 November 2026". Tanggal dihitung apa adanya, tanpa geser zona waktu. */
export function tanggalBooking(t) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t || '')) return t || '-';
  const [y, m, d] = t.split('-').map(Number);
  const hari = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${HARI[hari]}, ${d} ${BULAN[m - 1]} ${y}`;
}

/** yyyy-mm-dd hari ini di Mataram. */
export function hariIni(tambah = 0) {
  return new Date(Date.now() + 8 * 3600e3 + tambah * 86400e3).toISOString().slice(0, 10);
}

// Kata yang membuat testimoni terbaca sebagai klaim pengobatan. Panel menandainya
// supaya pengurus memeriksa ulang sebelum menampilkan (lihat PANDUAN.md).
export const KATA_KLAIM = ['sembuh', 'kesembuhan', 'menyembuhkan', 'disembuhkan', 'mengobati', 'obat', 'kanker', 'tumor', 'diabetes', 'stroke', 'jantung', 'lumpuh', 'dijamin', 'garansi', 'pasti', '100%', 'manjur', 'mujarab', 'ampuh', 'ajaib', 'mukjizat'];
export function kataKlaim(teks) {
  const t = String(teks || '').toLowerCase();
  return KATA_KLAIM.filter((k) => new RegExp(`(^|[^a-z])${k.replace('%', '\\%')}`).test(t));
}

// Bulan purnama astronomis (Meeus, Astronomical Algorithms bab 49). Purnama dalam
// kalender Bali bisa selisih sehari, jadi tampilannya selalu "sekitar".
export function purnamaBerikutnya(dari = new Date()) {
  const rad = Math.PI / 180;
  const tahun = dari.getUTCFullYear() + (dari.getUTCMonth() + dari.getUTCDate() / 30) / 12;
  let k = Math.floor((tahun - 2000) * 12.3685) - 1;
  for (;;) {
    const kk = k + 0.5;
    const T = kk / 1236.85;
    const E = 1 - 0.002516 * T - 0.0000074 * T * T;
    const M = rad * (2.5534 + 29.1053567 * kk);
    const Mp = rad * (201.5643 + 385.81693528 * kk);
    const F = rad * (160.7108 + 390.67050284 * kk);
    const Om = rad * (124.7746 - 1.56375588 * kk);
    const koreksi =
      -0.40614 * Math.sin(Mp) + 0.17302 * E * Math.sin(M) + 0.01614 * Math.sin(2 * Mp) + 0.01043 * Math.sin(2 * F)
      + 0.00734 * E * Math.sin(Mp - M) - 0.00515 * E * Math.sin(Mp + M) + 0.00209 * E * E * Math.sin(2 * M)
      - 0.00111 * Math.sin(Mp - 2 * F) - 0.00057 * Math.sin(Mp + 2 * F) + 0.00056 * E * Math.sin(2 * Mp + M)
      - 0.00042 * Math.sin(3 * Mp) + 0.00042 * E * Math.sin(M + 2 * F) + 0.00038 * E * Math.sin(M - 2 * F)
      - 0.00024 * E * Math.sin(2 * Mp - M) - 0.00017 * Math.sin(Om);
    const jde = 2451550.09766 + 29.530588861 * kk + koreksi;
    const ms = (jde - 2440587.5) * 86400e3 - 69e3; // selisih TD-UT sekitar 69 detik
    if (ms > dari.getTime() - 12 * 3600e3) return ms;
    k++;
  }
}
