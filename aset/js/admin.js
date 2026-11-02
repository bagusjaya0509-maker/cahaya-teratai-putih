// Panel pengurus: booking, testimoni, kabar, jadwal, pengguna, sistem.
import { $, $$, BASE, ASAL, MODE, KONFIG, esc, ikon, roti, denganMemuat, pesanGalat, tanggalPendek, tanggalJam, waktuLalu, fotoAkun } from './inti.js';
import { L, pantauSesi } from './layanan.js';
import { LAYANAN_BOOKING, STATUS_BOOKING, STATUS_TESTIMONI, NAMA_HARI, PENGATURAN_BAWAAN, namaLayanan, namaCara, namaSesi, tanggalBooking, hariIni, kataKlaim, KATA_KLAIM } from './rujukan.js';
import { pilStatus, langkahStatus, rincianBooking, liniTanggapan, waIntl, jadwalTeks, bintangHtml } from './booking-tampil.js';
import { KATEGORI_KABAR, buatSlug, deltaKeTeks } from './isi.js';
import { susunArtikel } from './artikel.js';
import { kompres, ukuranDataUrl, formatUkuran } from './gambar.js';
import { buatXlsx, unduhBlob } from './xlsx.js';
import { KABAR_AWAL } from './kabar-awal.js';
import { ambilPengaturan } from './publik.js';
import { kartuMati } from './gerbang.js';

const isi = $('[data-adm-isi]');
const judul = $('[data-adm-judul]');
const aksi = $('[data-adm-aksi]');
let saya = null;
const cache = { booking: null, testimoni: null };
let adaPerubahan = false; // editor kabar
let ruteKini = '';

// ======================================================================
// gerbang akses
// ======================================================================
const gerbang = $('[data-adm-gerbang]');
function tampilGerbang(html) {
  gerbang.innerHTML = `<div class="kartu kartu-gerbang" style="max-width:560px">${html}</div>`;
  gerbang.hidden = false;
  $('[data-adm]').hidden = true;
}

if (MODE === 'mati') {
  gerbang.innerHTML = `<div style="max-width:620px;display:grid;gap:16px">${kartuMati()}<div class="kartu"><h2 style="font-size:1.3rem">Untuk pengelola situs</h2><p style="color:var(--tinta-2)">Panel ini aktif setelah konfigurasi Firebase diisi di <span class="kode">situs.config.json</span> dan situs dibangun ulang. Langkah lengkapnya ada di berkas <span class="kode">PANDUAN.md</span> pada repositori.</p></div></div>`;
} else {
  let mulaiSekali = false;
  pantauSesi((p) => {
    if (!p || p.tamu) {
      const lanjut = encodeURIComponent(location.pathname + location.hash);
      return tampilGerbang(`${ikon('lock', 'ikon ikon-besar')}<h2>Masuk sebagai pengurus</h2><p>Panel ini hanya untuk pengurus yayasan yang sudah diberi akses.</p><div class="aksi-formulir"><a class="tombol tombol-utama" href="${BASE}masuk/?lanjut=${lanjut}">Masuk</a><a class="tombol tombol-garis" href="${BASE}">Ke beranda</a></div>`);
    }
    if (!p.admin) {
      return tampilGerbang(`${ikon('shield', 'ikon ikon-besar')}<h2>Akun ini belum memiliki akses pengurus</h2><p>Anda masuk sebagai <b>${esc(p.email)}</b>. Minta pengurus yang sudah memiliki akses untuk menambahkan email ini di menu <i>Pengguna &amp; pengurus</i>.</p>${
        (KONFIG.adminUtama || []).includes(p.email) && !p.terverifikasi ? '<p class="pesan pesan-peringatan">Email ini terdaftar sebagai pengurus utama, tetapi belum diverifikasi. Buka tautan verifikasi di email Anda, lalu muat ulang halaman ini.</p>' : ''
      }<div class="aksi-formulir"><a class="tombol tombol-garis" href="${BASE}akun/">Buka akun saya</a></div>`);
    }
    saya = p;
    gerbang.hidden = true;
    $('[data-adm]').hidden = false;
    $('[data-adm-nama]').innerHTML = `${fotoAkun(p)}<span><b>${esc(p.nama)}</b><small>${esc(p.email)}</small></span>`;
    if (!mulaiSekali) {
      mulaiSekali = true;
      rute();
      segarkanLencana();
    }
  });
}

$('[data-adm-keluar]').addEventListener('click', async () => {
  if (adaPerubahan && !confirm('Ada perubahan kabar yang belum disimpan. Tetap keluar?')) return;
  await L.keluar();
  location.href = BASE;
});

// menu samping di layar kecil
const sisi = $('[data-adm-sisi]');
const latar = $('[data-adm-latar]');
const tutupSisi = () => { sisi.classList.remove('terbuka'); latar.hidden = true; };
$('[data-adm-menu]').addEventListener('click', () => { sisi.classList.add('terbuka'); latar.hidden = false; });
latar.addEventListener('click', tutupSisi);

// ======================================================================
// rute
// ======================================================================
addEventListener('hashchange', () => rute());
addEventListener('beforeunload', (e) => { if (adaPerubahan) { e.preventDefault(); e.returnValue = ''; } });

async function rute() {
  if (!saya) return;
  const [bagian = 'ringkasan', a, b] = location.hash.slice(1).split('/');
  const ruteBaru = [bagian, a, b].filter(Boolean).join('/');
  if (adaPerubahan && ruteBaru !== ruteKini) {
    if (!confirm('Ada perubahan kabar yang belum disimpan. Tinggalkan halaman editor?')) {
      history.replaceState(null, '', '#' + ruteKini);
      return;
    }
    adaPerubahan = false;
  }
  ruteKini = ruteBaru;
  tutupSisi();
  $$('[data-rute]').forEach((el) => el.toggleAttribute('aria-current', el.dataset.rute === bagian));
  aksi.innerHTML = '';
  isi.innerHTML = '<div class="kerangka" style="height:120px"></div><div class="kerangka" style="height:320px;margin-top:16px"></div>';
  try {
    if (bagian === 'ringkasan') await vRingkasan();
    else if (bagian === 'kabar' && a === 'baru') await vEditor(null);
    else if (bagian === 'kabar' && a === 'edit') await vEditor(b);
    else if (bagian === 'kabar') await vKabar();
    else if (bagian === 'booking' && a) await vDetailBooking(a);
    else if (bagian === 'booking') await vBooking();
    else if (bagian === 'testimoni') await vTestimoni();
    else if (bagian === 'trafik') await vTrafik();
    else if (bagian === 'jadwal') await vJadwal();
    else if (bagian === 'pengguna') await vPengguna();
    else if (bagian === 'sistem') await vSistem();
    else location.hash = 'ringkasan';
  } catch (e) {
    console.error(e);
    isi.innerHTML = `<div class="pesan pesan-galat">${ikon('triangle-alert')}<div><p><b>Data tidak bisa dimuat.</b> ${esc(pesanGalat(e))}</p>${e.tautanIndeks ? `<p><a href="${esc(e.tautanIndeks)}" target="_blank" rel="noopener">Buat indeks Firestore yang dibutuhkan</a></p>` : ''}</div></div>`;
  }
  isi.focus({ preventScroll: true });
  scrollTo({ top: 0 });
}

const PIL_TERBIT = '<span class="status" data-status="terbit">Terbit</span>';
const pilTestimoni = (st) => `<span class="status" data-status="${esc(st)}">${esc(STATUS_TESTIMONI[st] || st)}</span>`;
const setJudul = (t) => { judul.textContent = t; document.title = `${t} — Panel Cahaya Teratai Putih`; };

async function ambilBooking(paksa = false) {
  if (!cache.booking || paksa) cache.booking = await L.semuaBooking();
  return cache.booking;
}
async function ambilTestimoni(paksa = false) {
  if (!cache.testimoni || paksa) cache.testimoni = await L.semuaTestimoni();
  return cache.testimoni;
}
const perluPerhatian = (b) => b.status === 'baru' || (b.balasanTamu && (!b.dibacaAdmin || b.balasanTamu > b.dibacaAdmin));
const waktuBooking = (b) => b.jadwalTanggal || b.tanggal;

async function segarkanLencana() {
  try {
    const [bk, ts] = await Promise.all([ambilBooking(), ambilTestimoni()]);
    const set = (k, n) => { const el = $(`[data-lencana="${k}"]`); el.textContent = n; el.hidden = !n; };
    set('booking', bk.filter(perluPerhatian).length);
    set('testimoni', ts.filter((t) => t.status === 'menunggu').length);
  } catch (e) { console.warn(e); }
}

// ======================================================================
// modal
// ======================================================================
const modal = $('[data-modal]');
$('[data-modal-tutup]').addEventListener('click', () => modal.close());
modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });
function bukaModal(judulModal, html, kaki = '', lebar = 560) {
  $('[data-modal-judul]').textContent = judulModal;
  $('[data-modal-isi]').innerHTML = html;
  $('[data-modal-kaki]').innerHTML = kaki;
  $('[data-modal-kaki]').hidden = !kaki;
  modal.style.width = `min(${lebar}px, calc(100vw - 32px))`;
  modal.showModal();
  return modal;
}

// ======================================================================
// grafik batang sederhana (satu seri; label & nilai memakai warna teks)
// ======================================================================
function grafikBatang(data, { kosong = 'Belum ada data.', nol = false } = {}) {
  const ada = nol ? data : data.filter((d) => d.nilai > 0);
  if (!ada.some((d) => d.nilai > 0)) return `<p class="petunjuk" style="color:var(--tinta-2)">${esc(kosong)}</p>`;
  const maks = Math.max(1, ...ada.map((d) => d.nilai));
  return `<ul class="grafik-batang">${ada
    .map((d) => `<li title="${esc(d.label)}: ${d.nilai}"><span class="gb-label">${esc(d.label)}</span><span class="gb-jalur"><span class="gb-batang" style="width:${d.nilai ? Math.max(2, (d.nilai / maks) * 100) : 0}%"></span></span><span class="gb-nilai">${d.nilai.toLocaleString('id-ID')}</span></li>`)
    .join('')}</ul>`;
}
const hitungMenurut = (daftar, kunci) => {
  const m = new Map();
  for (const x of daftar) { const k = kunci(x) || 'Tidak diisi'; m.set(k, (m.get(k) || 0) + 1); }
  return [...m.entries()].map(([label, nilai]) => ({ label, nilai })).sort((a, b) => b.nilai - a.nilai);
};
function perBulan(daftar, n = 6) {
  const hasil = [];
  const kini = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(kini.getFullYear(), kini.getMonth() - i, 1);
    const akhir = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    hasil.push({
      label: d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
      nilai: daftar.filter((l) => l.dibuat >= d.getTime() && l.dibuat < akhir.getTime()).length,
    });
  }
  return hasil;
}

// ======================================================================
// RINGKASAN
// ======================================================================
async function vRingkasan() {
  setJudul('Ringkasan');
  aksi.innerHTML = `<button class="tombol tombol-garis kecil" type="button" data-segarkan>${ikon('refresh-cw')}Muat ulang</button>`;
  $('[data-segarkan]').addEventListener('click', async () => { cache.booking = cache.testimoni = null; await segarkanLencana(); vRingkasan(); });
  const [bk, ts, kabar] = await Promise.all([ambilBooking(), ambilTestimoni(), L.semuaKabarAdmin()]);
  const kini = hariIni();
  const akanDatang = bk.filter((b) => b.status === 'terjadwal' && (b.jadwalTanggal || '') >= kini).sort((a, b) => (`${a.jadwalTanggal}${a.jadwalJam}`).localeCompare(`${b.jadwalTanggal}${b.jadwalJam}`));
  const ubin = [
    { n: bk.filter((b) => b.status === 'baru').length, t: 'Booking baru', k: 'Menunggu konfirmasi', href: '#booking', tanda: true },
    { n: akanDatang.length, t: 'Jadwal mendatang', k: 'Sudah dikonfirmasi', href: '#booking' },
    { n: ts.filter((t) => t.status === 'menunggu').length, t: 'Testimoni baru', k: 'Perlu ditinjau', href: '#testimoni' },
    { n: kabar.filter((k) => k.terbit).length, t: 'Kabar terbit', k: `${kabar.filter((k) => !k.terbit).length} draf`, href: '#kabar' },
  ];
  const perhatian = bk.filter(perluPerhatian).slice(0, 8);
  isi.innerHTML = `
    <div class="adm-ubin">${ubin.map((u) => `<a class="ubin ${u.tanda && u.n ? 'ubin-tanda' : ''}" href="${u.href}"><span class="ubin-angka">${u.n}</span><span class="ubin-judul">${u.t}</span><span class="ubin-ket">${u.k}</span></a>`).join('')}</div>
    ${!kabar.length ? `<div class="pesan" style="margin-top:20px">${ikon('newspaper')}<div><p><b>Belum ada kabar terbit.</b> Dua kabar awal sudah disiapkan dari berkas resmi yayasan.</p><p><a href="#kabar">Buka menu Kabar untuk menerbitkannya</a></p></div></div>` : ''}
    <div class="adm-kisi-2">
      <section class="adm-kartu">
        <h2>Jadwal mendatang</h2>
        ${akanDatang.length ? `<ul class="adm-daftar">${akanDatang.slice(0, 8).map((b) => `<li><a href="#booking/${b.id}"><span class="kode">${esc(b.nomor)}</span><b>${esc(b.nama)}</b><span class="meta-kecil">${esc(jadwalTeks(b))} · ${esc(namaLayanan(b.layanan))}</span></a></li>`).join('')}</ul>` : '<p class="petunjuk" style="color:var(--tinta-2)">Belum ada jadwal yang dikonfirmasi.</p>'}
      </section>
      <section class="adm-kartu">
        <h2>Perlu perhatian</h2>
        ${perhatian.length ? `<ul class="adm-daftar">${perhatian.map((b) => `<li><a href="#booking/${b.id}"><span class="kode">${esc(b.nomor)}</span><b>${esc(b.nama)}</b><span class="meta-kecil">${esc(namaLayanan(b.layanan))} · ${esc(tanggalBooking(b.tanggal))} · ${esc(waktuLalu(b.dibuat))}</span><span class="adm-daftar-tanda">${b.status === 'baru' ? pilStatus('baru') : '<span class="status" data-status="terjadwal">Pesan baru</span>'}</span></a></li>`).join('')}</ul>` : '<p class="petunjuk" style="color:var(--tinta-2)">Tidak ada booking yang menunggu.</p>'}
      </section>
      <section class="adm-kartu">
        <h2>Booking masuk per bulan</h2>
        ${grafikBatang(perBulan(bk), { kosong: 'Belum ada booking dalam enam bulan terakhir.', nol: true })}
      </section>
      <section class="adm-kartu">
        <h2>Booking per keperluan</h2>
        ${grafikBatang(hitungMenurut(bk, (b) => namaLayanan(b.layanan)))}
      </section>
    </div>`;
}

// ======================================================================
// TRAFIK
// ======================================================================
const NAMA_HALAMAN = {
  h_beranda: 'Beranda', h_tentang: 'Tentang', h_layanan: 'Layanan', h_kabar: 'Kabar', h_donasi: 'Donasi',
  h_kontak: 'Kontak', h_booking: 'Booking', h_testimoni: 'Testimoni', h_privasi: 'Kebijakan privasi',
};
const tanggalHari = (id) => tanggalPendek(Date.parse(`${id}T12:00:00+08:00`));

async function vTrafik() {
  setJudul('Trafik');
  aksi.innerHTML = `<button class="tombol tombol-garis kecil" type="button" data-segarkan>${ikon('refresh-cw')}Muat ulang</button>`;
  $('[data-segarkan]').addEventListener('click', () => vTrafik());
  const hari = await L.trafikHarian(30);
  const kini = hariIni();
  const jumlah = (daftar, kunci) => daftar.reduce((s, h) => s + (h[kunci] || 0), 0);
  const ini = hari.find((h) => h.id === kini) || {};
  const ubin = [
    { n: ini.kunjungan || 0, t: 'Pengunjung hari ini', k: `${ini.tayangan || 0} halaman dibuka` },
    { n: jumlah(hari.slice(0, 7), 'kunjungan'), t: 'Pengunjung 7 hari', k: `${jumlah(hari.slice(0, 7), 'tayangan')} halaman dibuka` },
    { n: jumlah(hari, 'kunjungan'), t: 'Pengunjung 30 hari', k: `${jumlah(hari, 'tayangan')} halaman dibuka` },
  ];
  const perHari = hari.slice(0, 14).map((h) => ({ label: tanggalHari(h.id), nilai: h.kunjungan || 0 }));
  const perHalaman = Object.entries(NAMA_HALAMAN)
    .map(([kunci, label]) => ({ label, nilai: jumlah(hari, kunci) }))
    .sort((a, b) => b.nilai - a.nilai);
  isi.innerHTML = `
    <div class="adm-ubin">${ubin.map((u) => `<div class="ubin"><span class="ubin-angka">${u.n}</span><span class="ubin-judul">${u.t}</span><span class="ubin-ket">${u.k}</span></div>`).join('')}</div>
    <div class="adm-kisi-2">
      <section class="adm-kartu">
        <h2>Pengunjung per hari</h2>
        ${grafikBatang(perHari, { kosong: 'Belum ada kunjungan tercatat.', nol: true })}
      </section>
      <section class="adm-kartu">
        <h2>Halaman paling sering dibuka</h2>
        ${grafikBatang(perHalaman, { kosong: 'Belum ada kunjungan tercatat.' })}
      </section>
    </div>
    <p class="petunjuk" style="margin-top:16px;color:var(--tinta-2)">Satu peramban dihitung sekali per hari sebagai pengunjung. Kunjungan pengurus yang sedang masuk tidak dihitung, dan tidak ada data pribadi yang disimpan.</p>`;
}

// ======================================================================
// KABAR
// ======================================================================
async function vKabar() {
  setJudul('Kabar');
  aksi.innerHTML = `<a class="tombol tombol-utama kecil" href="#kabar/baru">${ikon('plus')}Tulis kabar</a>`;
  const daftar = await L.semuaKabarAdmin();
  const awalBelum = KABAR_AWAL.filter((k) => !daftar.some((d) => d.slug === k.slug));
  isi.innerHTML = `
    ${awalBelum.length ? `<div class="pesan" style="margin-bottom:20px">${ikon('newspaper')}<div><p><b>${awalBelum.length} kabar awal siap terbit.</b> Disusun dari berkas resmi yayasan: ${awalBelum.map((k) => `“${esc(k.judul)}”`).join(', ')}.</p><p style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="tombol tombol-utama kecil" type="button" data-terbit-awal>Terbitkan kabar awal</button><button class="tombol tombol-garis kecil" type="button" data-lihat-awal>Lihat isinya dulu</button></p></div></div>` : ''}
    ${daftar.length ? `<div class="tabel-wadah"><table class="tabel adm-tabel">
      <thead><tr><th>Judul</th><th>Kategori</th><th>Status</th><th>Tanggal terbit</th><th>Diubah</th><th><span class="sr-only">Aksi</span></th></tr></thead>
      <tbody>${daftar.map((k) => `<tr>
        <td><a class="adm-tautan-judul" href="#kabar/edit/${esc(k.slug)}">${esc(k.judul || '(tanpa judul)')}</a><small class="kode">/kabar/${esc(k.slug)}/</small></td>
        <td>${esc(k.kategori || '-')}</td>
        <td>${k.terbit ? PIL_TERBIT : ''}${k.terbit && k.adaDraf ? ' <span class="status" data-status="draf">Ada draf perubahan</span>' : ''}${!k.terbit ? '<span class="status" data-status="draf">Draf</span>' : ''}</td>
        <td>${esc(tanggalPendek(k.terbitPada))}</td>
        <td>${esc(waktuLalu(k.diubah))}</td>
        <td class="adm-aksi-sel"><a class="tombol tombol-garis kecil" href="#kabar/edit/${esc(k.slug)}">${ikon('pencil')}Sunting</a>${k.terbit ? `<a class="tombol-ikon" href="${BASE}kabar/${esc(k.slug)}/" target="_blank" rel="noopener" title="Lihat di situs">${ikon('external-link')}</a>` : ''}</td>
      </tr>`).join('')}</tbody></table></div>` : '<div class="kosong"><h3>Belum ada kabar</h3><p>Tulis kabar pertama tentang kegiatan yayasan. Foto sampul dan gambar di dalam kabar otomatis diperkecil.</p></div>'}
    <p class="petunjuk adm-catatan">${ikon('info')} Kabar yang diterbitkan langsung muncul di beranda. Halaman statisnya (untuk pratinjau tautan WhatsApp/Facebook dan Google) dibangun ulang otomatis paling lambat satu jam kemudian.</p>`;
  $('[data-lihat-awal]')?.addEventListener('click', () => {
    bukaModal('Kabar awal', awalBelum.map((k) => `<article class="baca" style="padding:0 0 28px;border-bottom:1px solid var(--garis);margin-bottom:28px">${susunArtikel({ kabar: k, isi: { delta: k.delta }, base: BASE })}</article>`).join(''), '', 820);
  });
  $('[data-terbit-awal]')?.addEventListener('click', (e) => denganMemuat(e.currentTarget, async () => {
    try {
      for (const k of awalBelum) await L.terbitkan({ ...k, sampul: '', keteranganSampul: k.keteranganSampul || '' });
      roti(`${awalBelum.length} kabar awal terbit.`, 'berhasil');
      vKabar();
    } catch (err) { roti(pesanGalat(err), 'galat'); }
  }));
}

function muatQuill() {
  if (window.Quill) return Promise.resolve(window.Quill);
  return new Promise((ok, gagal) => {
    const s = document.createElement('script');
    s.src = `${BASE}aset/vendor/quill/quill.js`;
    s.onload = () => ok(window.Quill);
    s.onerror = () => gagal(new Error('Editor gagal dimuat. Periksa koneksi internet.'));
    document.head.append(s);
  });
}

const BATAS_ISI = 900_000; // bita; batas dokumen Firestore 1 MiB

async function rampingkanGambar(ops) {
  // Gambar tempelan (paste) bisa berukuran beberapa MB; kecilkan sebelum disimpan.
  for (const op of ops) {
    const src = op.insert?.image;
    if (typeof src === 'string' && src.startsWith('data:') && ukuranDataUrl(src) > 320_000) {
      const blob = await (await fetch(src)).blob();
      op.insert.image = await kompres(blob, { maks: 1280, mutu: 0.74 });
    }
  }
  return ops;
}

const keLokal = (ms) => {
  const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
};

// Kategori kabar: bawaan + kategori buatan pengurus yang pernah dipakai.
const rapikanKategori = (t) => {
  // Huruf pertama tiap kata kapital (seperti "Dharma Sastra"); sisanya tetap, jadi "HUT RI" tidak berubah.
  return String(t || '').replace(/\s+/g, ' ').trim().slice(0, 40).replace(/(^|\s)(\S)/g, (_, a, b) => a + b.toUpperCase());
};

async function vEditor(slug) {
  const [lama, semuaKabar] = await Promise.all([slug ? L.ambilKabarEdit(slug) : null, L.semuaKabarAdmin().catch(() => [])]);
  if (slug && !lama) { isi.innerHTML = `<div class="kosong"><h3>Kabar tidak ditemukan</h3><p><a href="#kabar">Kembali ke daftar kabar</a></p></div>`; return; }
  setJudul(lama ? 'Sunting kabar' : 'Tulis kabar');
  const k = {
    slug: lama?.slug || '', judul: lama?.judul || '', kategori: lama?.kategori || 'Kegiatan', ringkasan: lama?.ringkasan || '',
    penulis: lama?.penulis || saya.nama, unggulan: Boolean(lama?.unggulan), sampul: lama?.sampul || '', sampulKecil: lama?.sampulKecil || '',
    keteranganSampul: lama?.keteranganSampul || '', delta: lama?.delta || '[]', terbitPada: lama?.terbitPada || Date.now(), terbit: Boolean(lama?.terbit),
  };
  const daftarKategori = [...new Set([...KATEGORI_KABAR, ...semuaKabar.map((x) => x.kategori).filter(Boolean), k.kategori])];
  let slugTerkunci = Boolean(lama);
  aksi.innerHTML = `<a class="tombol tombol-garis kecil" href="#kabar">${ikon('arrow-left')}Daftar kabar</a>`;
  isi.innerHTML = `
    <div class="editor-tata">
      <div class="editor-utama">
        <textarea class="editor-judul" data-e="judul" rows="1" maxlength="160" placeholder="Judul kabar" aria-label="Judul kabar">${esc(k.judul)}</textarea>
        <textarea class="editor-ringkasan" data-e="ringkasan" maxlength="300" rows="2" placeholder="Ringkasan satu-dua kalimat (tampil di kartu kabar dan pratinjau tautan)" aria-label="Ringkasan">${esc(k.ringkasan)}</textarea>
        <div class="editor-quill"><div data-quill></div></div>
      </div>
      <aside class="editor-sisi">
        <section class="adm-kartu">
          <h2>Terbitkan</h2>
          <p class="editor-status">${k.terbit ? `${PIL_TERBIT} <a href="${BASE}kabar/${esc(k.slug)}/" target="_blank" rel="noopener">Lihat</a>` : '<span class="status" data-status="draf">Belum terbit</span>'}</p>
          <p class="editor-simpan-info" data-info-simpan>${lama ? `Terakhir diubah ${esc(waktuLalu(lama.diubah))}` : 'Belum disimpan'}</p>
          <div class="editor-tombol">
            <button class="tombol tombol-utama lebar" type="button" data-terbit>${ikon('send')}${k.terbit ? 'Perbarui kabar terbit' : 'Terbitkan'}</button>
            <button class="tombol tombol-garis lebar" type="button" data-draf>${ikon('bookmark')}Simpan sebagai draf</button>
            <button class="tombol tombol-garis lebar" type="button" data-pratinjau>${ikon('eye')}Pratinjau</button>
          </div>
          <p class="editor-ukuran" data-ukuran></p>
        </section>
        <section class="adm-kartu medan-kecil">
          <h2>Pengaturan</h2>
          <div class="medan"><label for="e-kategori">Kategori</label><select id="e-kategori" data-e="kategori">${daftarKategori.map((x) => `<option value="${esc(x)}" ${x === k.kategori ? 'selected' : ''}>${esc(x)}</option>`).join('')}<option value="__baru__">+ Kategori baru…</option></select>
            <input data-e="kategoriBaru" type="text" maxlength="40" placeholder="Contoh: Bakti Sosial" aria-label="Nama kategori baru" hidden>
            <p class="petunjuk" data-petunjuk-kategori hidden>Kategori baru otomatis muncul sebagai pilihan saring di halaman Kabar.</p></div>
          <div class="medan"><label for="e-tanggal">Tanggal terbit</label><input id="e-tanggal" data-e="terbitPada" type="datetime-local" value="${keLokal(k.terbitPada)}"><p class="petunjuk">Bisa diisi tanggal kegiatan berlangsung.</p></div>
          <div class="medan"><label for="e-penulis">Penulis</label><input id="e-penulis" data-e="penulis" type="text" maxlength="80" value="${esc(k.penulis)}"></div>
          <label class="centang"><input type="checkbox" data-e="unggulan" ${k.unggulan ? 'checked' : ''}><span>Jadikan kabar utama di beranda</span></label>
          <div class="medan"><label for="e-slug">Alamat halaman</label><div class="slug-medan"><span class="kode">/kabar/</span><input id="e-slug" data-e="slug" type="text" maxlength="80" value="${esc(k.slug)}" ${slugTerkunci ? 'readonly' : ''} pattern="[a-z0-9-]+"></div><p class="petunjuk">${slugTerkunci ? 'Alamat dikunci sesudah disimpan agar tautan yang sudah dibagikan tidak rusak.' : 'Terisi otomatis dari judul. Alamat dikunci setelah pertama kali disimpan.'}</p></div>
        </section>
        <section class="adm-kartu medan-kecil">
          <h2>Foto sampul</h2>
          <label class="unggah sampul-unggah" data-sampul-unggah>
            <input type="file" accept="image/*" hidden data-sampul-berkas>
            <div data-sampul-pratinjau>${k.sampul ? `<img src="${k.sampul}" alt="">` : `${ikon('image')}<p><b>Pilih foto</b> (dipotong 16:9)</p>`}</div>
          </label>
          ${k.sampul ? '' : ''}
          <div class="medan"><label for="e-ket">Keterangan foto</label><input id="e-ket" data-e="keteranganSampul" type="text" maxlength="200" value="${esc(k.keteranganSampul)}" placeholder="Contoh: Upacara Homma Jnana di Cakranegara"></div>
          <button class="tombol-teks" type="button" data-hapus-sampul ${k.sampul ? '' : 'hidden'}>${ikon('trash-2')}Hapus foto sampul</button>
        </section>
        ${lama ? `<section class="adm-kartu medan-kecil"><h2>Lainnya</h2><div class="editor-tombol">${k.terbit ? `<button class="tombol tombol-garis lebar" type="button" data-tarik>${ikon('eye-off')}Tarik dari situs</button>` : ''}<button class="tombol tombol-hapus lebar" type="button" data-hapus-kabar>${ikon('trash-2')}Hapus kabar</button></div></section>` : ''}
      </aside>
    </div>`;

  const Quill = await muatQuill();
  const q = new Quill($('[data-quill]'), {
    theme: 'snow',
    placeholder: 'Tulis isi kabar di sini. Pakai tombol gambar untuk menyisipkan foto kegiatan.',
    modules: {
      toolbar: {
        container: [[{ header: [2, 3, false] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['blockquote', 'link', 'image'], ['clean']],
        handlers: {
          image() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async () => {
              const file = input.files[0];
              if (!file) return;
              try {
                const data = await kompres(file, { maks: 1280, mutu: 0.75 });
                const r = q.getSelection(true);
                q.insertEmbed(r.index, 'image', data, 'user');
                q.setSelection(r.index + 1, 0);
              } catch { roti('Gambar tidak bisa dibaca.', 'galat'); }
            };
            input.click();
          },
        },
      },
    },
  });
  try { q.setContents(JSON.parse(k.delta || '[]')); } catch { q.setContents([]); }
  // label bahasa Indonesia untuk tombol editor
  const label = { 'ql-bold': 'Tebal', 'ql-italic': 'Miring', 'ql-underline': 'Garis bawah', 'ql-blockquote': 'Kutipan', 'ql-link': 'Tautan', 'ql-image': 'Sisipkan gambar', 'ql-clean': 'Hapus format' };
  $$('.ql-toolbar button').forEach((b) => {
    const kls = [...b.classList].find((c) => label[c]);
    if (kls) b.setAttribute('aria-label', label[kls]), b.title = label[kls];
    if (b.classList.contains('ql-list')) { const t = b.value === 'ordered' ? 'Daftar bernomor' : 'Daftar butir'; b.setAttribute('aria-label', t); b.title = t; }
  });

  const E = (n) => $(`[data-e="${n}"]`);
  const kumpulkan = () => ({
    ...k,
    judul: E('judul').value.trim(),
    ringkasan: E('ringkasan').value.trim(),
    kategori: E('kategori').value === '__baru__' ? rapikanKategori(E('kategoriBaru').value) : E('kategori').value,
    penulis: E('penulis').value.trim(),
    unggulan: E('unggulan').checked,
    keteranganSampul: E('keteranganSampul').value.trim(),
    slug: E('slug').value.trim(),
    terbitPada: E('terbitPada').value ? new Date(E('terbitPada').value).getTime() : Date.now(),
    delta: JSON.stringify(q.getContents().ops),
  });
  const ukurIsi = () => {
    const n = new Blob([JSON.stringify(q.getContents().ops)]).size + (k.sampul?.length || 0);
    const el = $('[data-ukuran]');
    el.textContent = `Ukuran isi ${formatUkuran(n)} dari batas ${formatUkuran(BATAS_ISI)}`;
    el.classList.toggle('lewat', n > BATAS_ISI);
    return n;
  };
  const tandaiUbah = () => { adaPerubahan = true; $('[data-info-simpan]').textContent = 'Ada perubahan yang belum disimpan'; ukurIsi(); };
  q.on('text-change', tandaiUbah);
  $$('[data-e]').forEach((el) => el.addEventListener('input', tandaiUbah));
  E('kategori').addEventListener('change', () => {
    const baru = E('kategori').value === '__baru__';
    E('kategoriBaru').hidden = !baru;
    $('[data-petunjuk-kategori]').hidden = !baru;
    if (baru) E('kategoriBaru').focus();
    tandaiUbah();
  });
  const tumbuh = () => { E('judul').style.height = 'auto'; E('judul').style.height = `${E('judul').scrollHeight}px`; };
  E('judul').addEventListener('input', () => { tumbuh(); if (!slugTerkunci) E('slug').value = buatSlug(E('judul').value); });
  E('judul').addEventListener('keydown', (e) => { if (e.key === 'Enter') e.preventDefault(); });
  tumbuh();
  E('slug').addEventListener('input', () => { E('slug').value = buatSlug(E('slug').value); });
  ukurIsi();

  // sampul
  const pratinjauSampul = $('[data-sampul-pratinjau]');
  $('[data-sampul-berkas]').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    pratinjauSampul.innerHTML = `${ikon('loader-circle', 'ikon berputar')}<p>Memperkecil foto…</p>`;
    try {
      k.sampul = await kompres(file, { maks: 1600, mutu: 0.8, rasio: 16 / 9 });
      k.sampulKecil = await kompres(file, { maks: 640, mutu: 0.72, rasio: 16 / 10 });
      pratinjauSampul.innerHTML = `<img src="${k.sampul}" alt="">`;
      $('[data-hapus-sampul]').hidden = false;
      tandaiUbah();
    } catch {
      pratinjauSampul.innerHTML = `${ikon('image')}<p>Foto tidak bisa dibaca. Coba foto lain.</p>`;
    }
  });
  $('[data-hapus-sampul]').addEventListener('click', (e) => {
    k.sampul = k.sampulKecil = '';
    pratinjauSampul.innerHTML = `${ikon('image')}<p><b>Pilih foto</b> (dipotong 16:9)</p>`;
    e.currentTarget.hidden = true;
    tandaiUbah();
  });

  async function siapkan(untukTerbit) {
    const d = kumpulkan();
    if (d.judul.length < 8) throw Object.assign(new Error('Judul minimal 8 karakter.'), { pesan: 'Judul minimal 8 karakter.' });
    if (!d.kategori) {
      E('kategoriBaru').focus();
      throw new Error('Tulis nama kategori baru, atau pilih kategori dari daftar.');
    }
    if (untukTerbit && deltaKeTeks(d.delta).trim().length < 40) throw Object.assign(new Error('Isi kabar masih terlalu pendek untuk diterbitkan.'), {});
    d.delta = JSON.stringify(await rampingkanGambar(q.getContents().ops));
    if (!d.ringkasan) {
      const teks = deltaKeTeks(d.delta).replace(/\s+/g, ' ').trim();
      d.ringkasan = teks.length > 180 ? `${teks.slice(0, 180).replace(/\s+\S*$/, '')}…` : teks;
    }
    if (!slugTerkunci) {
      let s = buatSlug(d.slug || d.judul) || `kabar-${Date.now()}`;
      let calon = s;
      for (let i = 2; await L.slugTerpakai(calon); i++) calon = `${s}-${i}`;
      d.slug = calon;
    }
    const ukuran = new Blob([d.delta]).size + d.sampul.length + d.sampulKecil.length;
    if (ukuran > BATAS_ISI) throw new Error(`Isi kabar ${formatUkuran(ukuran)}, melebihi batas ${formatUkuran(BATAS_ISI)}. Kurangi jumlah gambar di dalam isi.`);
    return d;
  }
  function sesudahSimpan(d, terbit) {
    adaPerubahan = false;
    Object.assign(k, d, { terbit: terbit || k.terbit });
    if (!slugTerkunci) {
      slugTerkunci = true;
      history.replaceState(null, '', `#kabar/edit/${d.slug}`);
      ruteKini = `kabar/edit/${d.slug}`;
    }
  }

  $('[data-draf]').addEventListener('click', (e) => denganMemuat(e.currentTarget, async () => {
    try {
      const d = await siapkan(false);
      await L.simpanDraf(d);
      sesudahSimpan(d, false);
      roti(k.terbit ? 'Draf perubahan disimpan. Versi terbit belum berubah.' : 'Draf disimpan.', 'berhasil');
      vEditor(d.slug);
    } catch (err) { roti(pesanGalat(err), 'galat'); }
  }));
  $('[data-terbit]').addEventListener('click', (e) => denganMemuat(e.currentTarget, async () => {
    try {
      const d = await siapkan(true);
      await L.terbitkan(d);
      sesudahSimpan(d, true);
      roti('Kabar terbit dan sudah tampil di situs.', 'berhasil');
      vEditor(d.slug);
    } catch (err) { roti(pesanGalat(err), 'galat'); }
  }));
  $('[data-pratinjau]').addEventListener('click', () => {
    const d = kumpulkan();
    bukaModal('Pratinjau kabar', `<div class="baca" style="padding:0">${susunArtikel({ kabar: { ...d, terbitPada: d.terbitPada }, isi: { delta: d.delta, sampul: k.sampul, keteranganSampul: d.keteranganSampul }, base: BASE })}</div>`, '', 860);
  });
  $('[data-tarik]')?.addEventListener('click', (e) => {
    if (!confirm('Tarik kabar ini dari situs? Kabar kembali menjadi draf dan tautannya tidak bisa dibuka pengunjung.')) return;
    denganMemuat(e.currentTarget, async () => {
      try { await L.tarikKabar(k.slug); adaPerubahan = false; roti('Kabar ditarik menjadi draf.', 'berhasil'); vEditor(k.slug); } catch (err) { roti(pesanGalat(err), 'galat'); }
    });
  });
  $('[data-hapus-kabar]')?.addEventListener('click', (e) => {
    if (!confirm(`Hapus kabar “${k.judul}” secara permanen? Tindakan ini tidak bisa dibatalkan.`)) return;
    denganMemuat(e.currentTarget, async () => {
      try { await L.hapusKabar(k.slug); adaPerubahan = false; roti('Kabar dihapus.', 'berhasil'); location.hash = 'kabar'; } catch (err) { roti(pesanGalat(err), 'galat'); }
    });
  });
}

// ======================================================================
// BOOKING
// ======================================================================
const saringan = {};

function terapkanSaring(daftar, s) {
  const q = (s.cari || '').toLowerCase();
  return daftar.filter((b) =>
    (!s.status || b.status === s.status) &&
    (!s.layanan || b.layanan === s.layanan) &&
    (!s.dari || waktuBooking(b) >= s.dari) &&
    (!s.sampai || waktuBooking(b) <= s.sampai) &&
    (!s.perhatian || perluPerhatian(b)) &&
    (!q || `${b.nomor} ${b.nama} ${b.wa} ${b.kota}`.toLowerCase().includes(q)));
}

async function vBooking(paksa = false) {
  setJudul('Booking');
  const semua = await ambilBooking(paksa);
  const s = saringan;
  aksi.innerHTML = `
    <button class="tombol tombol-garis kecil" type="button" data-segarkan>${ikon('refresh-cw')}Muat ulang</button>
    <button class="tombol tombol-garis kecil" type="button" data-cetak>${ikon('printer')}Cetak rekap</button>
    <button class="tombol tombol-utama kecil" type="button" data-unduh>${ikon('file-spreadsheet')}Unduh Excel</button>`;
  isi.innerHTML = `
    <form class="adm-saring" data-saring>
      <label class="cari"><span class="sr-only">Cari</span>${ikon('search')}<input type="search" name="cari" placeholder="Cari nomor, nama, WhatsApp, kota" value="${esc(s.cari || '')}"></label>
      <select name="status" aria-label="Status"><option value="">Semua status</option>${Object.entries(STATUS_BOOKING).map(([k, v]) => `<option value="${k}" ${s.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <select name="layanan" aria-label="Keperluan"><option value="">Semua keperluan</option>${LAYANAN_BOOKING.map((l) => `<option value="${l.kunci}" ${s.layanan === l.kunci ? 'selected' : ''}>${esc(l.nama)}</option>`).join('')}</select>
      <label class="adm-rentang"><span>Dari</span><input type="date" name="dari" value="${esc(s.dari || '')}"></label>
      <label class="adm-rentang"><span>Sampai</span><input type="date" name="sampai" value="${esc(s.sampai || '')}"></label>
      <label class="centang"><input type="checkbox" name="perhatian" ${s.perhatian ? 'checked' : ''}><span>Perlu perhatian</span></label>
      <button class="tombol-teks" type="reset">Hapus saringan</button>
    </form>
    <p class="adm-hitung" data-hitung></p>
    <div data-tabel></div>`;
  const form = $('[data-saring]');
  const gambar = () => {
    const hasil = terapkanSaring(semua, s);
    $('[data-hitung]').textContent = `Menampilkan ${hasil.length} dari ${semua.length} booking`;
    $('[data-tabel]').innerHTML = hasil.length
      ? `<div class="tabel-wadah"><table class="tabel adm-tabel adm-tabel-klik">
        <thead><tr><th>Nomor</th><th>Tamu</th><th>Keperluan</th><th>Waktu</th><th>Status</th><th>Masuk</th></tr></thead>
        <tbody>${hasil.map((b) => `<tr data-buka="${b.id}" tabindex="0">
          <td class="kode">${esc(b.nomor)}</td>
          <td><a class="adm-tautan-judul" href="#booking/${b.id}">${esc(b.nama)}</a><small>${esc(b.wa)}${b.kota ? ` · ${esc(b.kota)}` : ''}</small></td>
          <td>${esc(namaLayanan(b.layanan))}<small>${esc(namaCara(b.cara))}</small></td>
          <td>${esc(tanggalBooking(waktuBooking(b)))}<small>${esc(b.jadwalJam ? `Pukul ${b.jadwalJam} WITA` : 'Permintaan tamu')}</small></td>
          <td><div class="adm-tanda">${pilStatus(b.status)}${b.balasanTamu && (!b.dibacaAdmin || b.balasanTamu > b.dibacaAdmin) ? '<span class="status" data-status="terjadwal">Pesan baru</span>' : ''}</div></td>
          <td>${esc(tanggalPendek(b.dibuat))}</td>
        </tr>`).join('')}</tbody></table></div>`
      : `<div class="kosong"><h3>${semua.length ? 'Tidak ada yang cocok dengan saringan' : 'Belum ada booking'}</h3><p>${semua.length ? 'Ubah atau hapus saringan untuk melihat data lain.' : 'Booking yang dikirim lewat situs akan muncul di sini.'}</p></div>`;
    return hasil;
  };
  const baca = () => {
    const d = new FormData(form);
    Object.assign(s, { cari: d.get('cari'), status: d.get('status'), layanan: d.get('layanan'), dari: d.get('dari'), sampai: d.get('sampai'), perhatian: d.get('perhatian') === 'on' });
    gambar();
  };
  form.addEventListener('input', baca);
  form.addEventListener('reset', () => setTimeout(() => { Object.keys(s).forEach((k) => delete s[k]); baca(); }));
  form.addEventListener('submit', (e) => e.preventDefault());
  $('[data-tabel]').addEventListener('click', (e) => { const tr = e.target.closest('[data-buka]'); if (tr && !e.target.closest('a')) location.hash = `booking/${tr.dataset.buka}`; });
  $('[data-tabel]').addEventListener('keydown', (e) => { const tr = e.target.closest('[data-buka]'); if (tr && e.key === 'Enter') location.hash = `booking/${tr.dataset.buka}`; });
  gambar();
  $('[data-segarkan]').addEventListener('click', () => { segarkanLencana(); vBooking(true); });
  $('[data-unduh]').addEventListener('click', () => unduhBooking(terapkanSaring(semua, s)));
  $('[data-cetak]').addEventListener('click', () => cetakRekap(terapkanSaring(semua, s), s));
}

function unduhBooking(daftar) {
  if (!daftar.length) return roti('Tidak ada data untuk diunduh.', 'galat');
  const kol = [['Nomor', 16], ['Status', 18], ['Nama', 24], ['WhatsApp', 16], ['Domisili', 20], ['Keperluan', 24], ['Cara', 18], ['Tanggal diminta', 26], ['Sesi', 12], ['Jadwal tetap', 30], ['Catatan', 60], ['Dikirim', 20], ['Ditangani', 18]].map(([judul, lebar]) => ({ judul, lebar }));
  const rekap = (label, data) => [[label, ''], ...data.map((d) => [d.label, d.nilai]), ['', '']];
  const blob = buatXlsx([
    { nama: 'Booking', kolom: kol, baris: daftar.map((b) => [b.nomor, STATUS_BOOKING[b.status] || b.status, b.nama, b.wa, b.kota || '', namaLayanan(b.layanan), namaCara(b.cara), tanggalBooking(b.tanggal), b.sesi, jadwalTeks(b), b.catatan || '', tanggalJam(b.dibuat), b.ditangani || '']) },
    { nama: 'Ringkasan', kolom: [{ judul: 'Rekap', lebar: 40 }, { judul: 'Jumlah', lebar: 12 }], baris: [...rekap('Menurut status', hitungMenurut(daftar, (b) => STATUS_BOOKING[b.status])), ...rekap('Menurut keperluan', hitungMenurut(daftar, (b) => namaLayanan(b.layanan)))] },
  ]);
  unduhBlob(blob, `rekap-booking-cahaya-teratai-putih-${new Date().toISOString().slice(0, 10)}.xlsx`);
  roti(`${daftar.length} booking diunduh sebagai Excel.`, 'berhasil');
}

function cetakRekap(daftar, s) {
  const w = window.open('', '_blank');
  if (!w) return roti('Peramban memblokir jendela cetak. Izinkan pop-up lalu coba lagi.', 'galat');
  const keterangan = [s.status && STATUS_BOOKING[s.status], s.layanan && namaLayanan(s.layanan), s.dari && `dari ${s.dari}`, s.sampai && `sampai ${s.sampai}`].filter(Boolean).join(' · ') || 'Semua data';
  const tabelRekap = (judulR, data) => `<h3>${judulR}</h3><table><tbody>${data.map((d) => `<tr><td>${esc(d.label)}</td><td style="text-align:right">${d.nilai}</td></tr>`).join('')}</tbody></table>`;
  w.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Rekap booking — Yayasan Cahaya Teratai Putih</title><style>
    body{font-family:'Segoe UI',Arial,sans-serif;font-size:11px;color:#0f3437;margin:24px}h1{font-size:18px;margin:0}h2{font-size:13px;font-weight:normal;color:#4b6466;margin:4px 0 16px}h3{font-size:12px;margin:16px 0 6px}
    table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:5px 6px;text-align:left;vertical-align:top}th{background:#0f3437;color:#fff}.rekap{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:16px}.kepala{display:flex;gap:12px;align-items:center;border-bottom:2px solid #0f3437;padding-bottom:10px;margin-bottom:12px}
    @page{size:A4 landscape;margin:12mm}</style></head><body>
    <div class="kepala"><img src="${ASAL}aset/img/lambang.svg" width="40"><div><h1>Rekap booking konsultasi — Yayasan Cahaya Teratai Putih</h1><h2>${esc(keterangan)} · ${daftar.length} data · dicetak ${esc(tanggalJam(Date.now()))} oleh ${esc(saya.nama)}</h2></div></div>
    <div class="rekap">${tabelRekap('Menurut status', hitungMenurut(daftar, (b) => STATUS_BOOKING[b.status]))}${tabelRekap('Menurut keperluan', hitungMenurut(daftar, (b) => namaLayanan(b.layanan)))}</div>
    <table><thead><tr><th>Nomor</th><th>Nama</th><th>WhatsApp</th><th>Keperluan</th><th>Waktu</th><th>Status</th></tr></thead><tbody>
    ${daftar.map((b) => `<tr><td>${esc(b.nomor)}</td><td>${esc(b.nama)}</td><td>${esc(b.wa)}</td><td>${esc(namaLayanan(b.layanan))}</td><td>${esc(jadwalTeks(b) || tanggalBooking(b.tanggal))}</td><td>${esc(STATUS_BOOKING[b.status])}</td></tr>`).join('')}
    </tbody></table><script>onload=()=>setTimeout(()=>print(),300)<\/script></body></html>`);
  w.document.close();
}

async function vDetailBooking(id) {
  const semua = await ambilBooking();
  const b = semua.find((x) => x.id === id) || (await L.ambilBooking(id));
  if (!b) { isi.innerHTML = `<div class="kosong"><h3>Booking tidak ditemukan</h3><p><a href="#booking">Kembali ke daftar booking</a></p></div>`; return; }
  setJudul(b.nomor);
  aksi.innerHTML = `<a class="tombol tombol-garis kecil" href="#booking">${ikon('arrow-left')}Daftar booking</a>`;
  const [tg, catatan, atur] = await Promise.all([L.tanggapan(id), L.catatanInternal(id), ambilPengaturan()]);
  if (b.balasanTamu && (!b.dibacaAdmin || b.balasanTamu > b.dibacaAdmin)) {
    L.ubahBooking(id, {}).then(() => { b.dibacaAdmin = Date.now(); segarkanLencana(); }).catch(() => {});
  }
  const pesanWa = (d) => `Salam ${b.nama}. Kami dari Yayasan Cahaya Teratai Putih. Booking ${b.nomor} untuk ${namaLayanan(b.layanan)} sudah kami jadwalkan pada ${d}. Mohon balas pesan ini bila waktunya sesuai.`;
  isi.innerHTML = `
    <div class="detail-laporan adm-detail">
      <div>
        <div class="detail-kepala"><span class="kode">${esc(b.nomor)}</span>${pilStatus(b.status)}<span>${esc(namaCara(b.cara))}</span></div>
        <h2 class="detail-judul">${esc(b.nama)}</h2>
        ${langkahStatus(b.status)}
        <h3 class="sub-judul">Catatan dari tamu</h3>
        ${b.catatan ? `<p class="teks-panjang">${esc(b.catatan)}</p>` : '<p class="petunjuk" style="color:var(--tinta-2)">Tamu tidak menulis catatan.</p>'}
        <h3 class="sub-judul">Pesan dengan tamu</h3>
        ${liniTanggapan(tg, { kosong: 'Belum ada pesan. Pesan di bawah terbaca tamu di halaman Booking saya.' })}
        <form class="formulir adm-tanggap" data-tanggap>
          <div class="medan"><label for="t-pesan">Kirim pesan ke tamu</label><textarea id="t-pesan" name="pesan" rows="3" maxlength="3000" placeholder="Contoh: Mohon datang 15 menit lebih awal."></textarea></div>
          <div><button class="tombol tombol-garis" type="submit">${ikon('send')}Kirim pesan</button></div>
        </form>
        <h3 class="sub-judul">${ikon('lock')} Catatan internal pengurus</h3>
        <div class="adm-catatan-internal">
          ${catatan.length ? `<ol class="lini">${catatan.map((c) => `<li><div class="lini-kepala"><b>${esc(c.oleh)}</b><span>${esc(tanggalJam(c.dibuat))}</span></div><p>${esc(c.teks)}</p></li>`).join('')}</ol>` : '<p class="petunjuk" style="color:var(--tinta-2)">Belum ada catatan. Catatan ini tidak terlihat oleh tamu.</p>'}
          <form class="formulir" data-catatan style="gap:10px;margin-top:12px"><div class="medan"><label class="sr-only" for="c-teks">Catatan internal</label><textarea id="c-teks" name="teks" rows="3" maxlength="3000" placeholder="Hasil pertemuan, tindak lanjut, siapa yang menangani…"></textarea></div><div><button class="tombol tombol-garis kecil" type="submit">${ikon('plus')}Tambah catatan</button></div></form>
        </div>
      </div>
      <aside class="adm-samping">
        <form class="adm-kartu medan-kecil adm-jadwal" data-jadwal>
          <h2>Tetapkan jadwal</h2>
          <div class="medan"><label for="j-tanggal">Tanggal</label><input id="j-tanggal" name="tanggal" type="date" value="${esc(b.jadwalTanggal || b.tanggal)}" required></div>
          <div class="medan"><label for="j-jam">Jam (WITA)</label><input id="j-jam" name="jam" type="text" inputmode="numeric" maxlength="5" placeholder="09.30" value="${esc(b.jadwalJam)}"></div>
          <div class="medan"><label for="j-status">Status</label><select id="j-status" name="status">${Object.entries(STATUS_BOOKING).map(([k, v]) => `<option value="${k}" ${(b.status === 'baru' ? 'terjadwal' : b.status) === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
          <button class="tombol tombol-utama lebar" type="submit">${ikon('calendar')}Simpan jadwal</button>
          <p class="petunjuk">Sesudah disimpan, tombol WhatsApp di bawah berisi pesan konfirmasi siap kirim.</p>
        </form>
        <section class="adm-kartu">
          ${rincianBooking(b, { admin: true, sesi: atur.sesi })}
          <div class="editor-tombol" style="margin-top:16px">
            <a class="tombol tombol-garis lebar" href="https://wa.me/${esc(waIntl(b.wa))}?text=${encodeURIComponent(b.jadwalTanggal ? pesanWa(jadwalTeks(b)) : `Salam ${b.nama}. Kami dari Yayasan Cahaya Teratai Putih, terkait booking ${b.nomor}.`)}" target="_blank" rel="noopener">${ikon('whatsapp')}Hubungi lewat WhatsApp</a>
            <button class="tombol tombol-garis lebar" type="button" data-unduh-satu>${ikon('download')}Unduh sebagai Excel</button>
          </div>
        </section>
      </aside>
    </div>`;
  $('[data-jadwal]').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    const jam = f.jam.value.trim().replace(':', '.');
    if (jam && !/^\d{2}\.\d{2}$/.test(jam)) return roti('Tulis jam seperti 09.30.', 'galat');
    denganMemuat($('[type=submit]', f), async () => {
      try {
        await L.ubahBooking(id, { jadwalTanggal: f.tanggal.value, jadwalJam: jam, status: f.status.value });
        cache.booking = null;
        roti('Jadwal disimpan.', 'berhasil');
        segarkanLencana();
        vDetailBooking(id);
      } catch (err) { roti(pesanGalat(err), 'galat'); }
    });
  });
  $('[data-tanggap]').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    const pesan = f.pesan.value.trim();
    if (!pesan) return roti('Tulis pesan terlebih dahulu.', 'galat');
    denganMemuat($('[type=submit]', f), async () => {
      try {
        await L.kirimTanggapan(id, pesan, { sebagaiAdmin: true });
        cache.booking = null;
        roti('Pesan terkirim.', 'berhasil');
        segarkanLencana();
        vDetailBooking(id);
      } catch (err) { roti(pesanGalat(err), 'galat'); }
    });
  });
  $('[data-catatan]').addEventListener('submit', (e) => {
    e.preventDefault();
    const teks = e.currentTarget.teks.value.trim();
    if (!teks) return;
    denganMemuat($('[type=submit]', e.currentTarget), async () => {
      try { await L.tambahCatatan(id, teks); vDetailBooking(id); } catch (err) { roti(pesanGalat(err), 'galat'); }
    });
  });
  $('[data-unduh-satu]').addEventListener('click', () => unduhBooking([b]));
}

// ======================================================================
// TESTIMONI
// ======================================================================
const saringTesti = { status: 'menunggu' };

function tandaiKlaim(teks) {
  const pola = new RegExp(`(^|[^a-z])(${KATA_KLAIM.map((k) => k.replace('%', '\\%')).join('|')})`, 'gi');
  return esc(teks).replace(pola, (m, a, b) => `${a}<mark>${b}</mark>`);
}

async function vTestimoni(paksa = false) {
  setJudul('Testimoni');
  const semua = await ambilTestimoni(paksa);
  aksi.innerHTML = `<button class="tombol tombol-garis kecil" type="button" data-segarkan>${ikon('refresh-cw')}Muat ulang</button>`;
  const s = saringTesti;
  const gambar = () => {
    const h = semua.filter((t) => !s.status || t.status === s.status);
    $('[data-pilih-status]').innerHTML = [['', 'Semua'], ...Object.entries(STATUS_TESTIMONI)].map(([k, v]) => `<button class="chip" type="button" data-st="${k}" aria-pressed="${s.status === k}">${v} (${k ? semua.filter((t) => t.status === k).length : semua.length})</button>`).join('');
    $('[data-tabel]').innerHTML = h.length
      ? `<ul class="adm-testimoni">${h.map((t) => {
        const klaim = kataKlaim(t.isi);
        return `<li class="adm-kartu"><div class="adm-testimoni-kepala"><div><b>${esc(t.nama)}</b><small>${esc([t.kota, t.wa].filter(Boolean).join(' · '))}</small></div>${pilTestimoni(t.status)}</div>
          <p class="adm-testimoni-tentang">${bintangHtml(t.bintang)} <span>${esc(t.tentang)}</span></p>
          <p class="adm-testimoni-isi">${tandaiKlaim(t.isi)}</p>
          ${t.foto ? `<img src="${esc(t.foto)}" alt="Foto dari ${esc(t.nama)}" loading="lazy">` : ''}
          ${klaim.length ? `<p class="pesan pesan-peringatan">${ikon('triangle-alert')}<span>Menyebut ${esc(klaim.join(', '))}. Periksa dulu sebelum ditampilkan.</span></p>` : ''}
          <div class="aksi-formulir"><button class="tombol tombol-utama kecil" type="button" data-tinjau="${t.id}">${ikon('eye')}Tinjau</button><span class="meta-kecil">${esc(waktuLalu(t.dibuat))}</span></div></li>`;
      }).join('')}</ul>`
      : `<div class="kosong"><h3>${semua.length ? 'Tidak ada di kelompok ini' : 'Belum ada testimoni'}</h3><p>${semua.length ? 'Pilih kelompok lain di atas.' : 'Testimoni yang ditulis pengunjung masuk ke sini dulu, tidak langsung tampil di situs.'}</p></div>`;
  };
  isi.innerHTML = `
    <div class="pesan pesan-peringatan" style="margin-bottom:18px">${ikon('info')}<div><p><b>Baca dulu sebelum menampilkan.</b> Aturan Kemenkes dan BPOM melarang iklan layanan kesehatan, obat tradisional, dan suplemen memuat testimoni kesembuhan. Tampilkan cerita pengalaman, bukan janji sembuh. Kata berisiko ditandai kuning.</p></div></div>
    <div class="chip-grup" data-pilih-status style="margin-bottom:16px"></div>
    <div data-tabel></div>`;
  gambar();
  $('[data-pilih-status]').addEventListener('click', (e) => { const b = e.target.closest('[data-st]'); if (b) { s.status = b.dataset.st; gambar(); } });
  $('[data-tabel]').addEventListener('click', (e) => { const b = e.target.closest('[data-tinjau]'); if (b) tinjauTestimoni(semua.find((t) => t.id === b.dataset.tinjau)); });
  $('[data-segarkan]').addEventListener('click', () => { segarkanLencana(); vTestimoni(true); });
}

function tinjauTestimoni(t) {
  bukaModal(`Testimoni dari ${t.nama}`, `
    <p class="adm-testimoni-tentang">${bintangHtml(t.bintang)} <span>${esc(t.tentang)}</span></p>
    <dl class="rincian"><dt>Tampil sebagai</dt><dd>${t.tampilNama === 'inisial' ? 'Nama disingkat' : 'Nama lengkap'}</dd>${t.wa ? `<dt>WhatsApp (tidak ditampilkan)</dt><dd><a href="https://wa.me/${esc(waIntl(t.wa))}" target="_blank" rel="noopener">${esc(t.wa)}</a></dd>` : ''}</dl>
    <div class="medan" style="margin-top:14px"><label for="m-isi">Isi testimoni</label><textarea id="m-isi" rows="7" maxlength="1200">${esc(t.isi)}</textarea><p class="petunjuk">Perbaikan ejaan boleh. Jangan menambah kalimat yang tidak ditulis pengirim.</p></div>
    <p class="pesan pesan-peringatan" data-klaim hidden></p>`,
    `<button class="tombol tombol-hapus kecil" type="button" data-putus="ditolak">Jangan tampilkan</button>
     <button class="tombol tombol-utama kecil" type="button" data-putus="tampil">${t.status === 'tampil' ? 'Simpan perubahan' : 'Tampilkan di situs'}</button>`, 640);
  const area = $('#m-isi');
  const klaim = $('[data-klaim]', modal);
  const cek = () => {
    const k = kataKlaim(area.value);
    klaim.hidden = !k.length;
    klaim.textContent = `Masih menyebut: ${k.join(', ')}. Hubungi pengirim bila perlu mengubah maknanya.`;
    return k;
  };
  area.addEventListener('input', cek);
  cek();
  $$('[data-putus]', modal).forEach((b) => b.addEventListener('click', () => {
    const tampil = b.dataset.putus === 'tampil';
    if (tampil && cek().length && !confirm('Testimoni ini masih memuat kata yang terbaca sebagai klaim pengobatan. Tetap tampilkan?')) return;
    denganMemuat(b, async () => {
      try {
        if (tampil) await L.tampilkanTestimoni(t, area.value.trim());
        else await L.tolakTestimoni(t.id);
        roti(tampil ? 'Testimoni tampil di situs.' : 'Testimoni tidak ditampilkan.', 'berhasil');
        modal.close();
        segarkanLencana();
        vTestimoni(true);
      } catch (err) { roti(pesanGalat(err), 'galat'); }
    });
  }));
}

// ======================================================================
// JADWAL & PRODUK
// ======================================================================
let ctlJadwal;
async function vJadwal() {
  setJudul('Jadwal & produk');
  const a = await ambilPengaturan();
  const d = { hariBuka: [...a.hariBuka], sesi: a.sesi.map((s) => ({ ...s })), libur: [...a.libur], produk: [...a.produk], catatanBooking: a.catatanBooking || '' };
  const kunciSesi = (nama, i) => buatSlug(nama).slice(0, 18) || `sesi-${i + 1}`;
  const gambar = () => {
    isi.innerHTML = `
    <form class="adm-kisi-2" data-atur style="margin-top:0">
      <section class="adm-kartu medan-kecil adm-tumpuk">
        <h2>Hari buka</h2>
        <div class="adm-hari">${[1, 2, 3, 4, 5, 6, 0].map((h) => `<label class="centang"><input type="checkbox" name="hari" value="${h}" ${d.hariBuka.includes(h) ? 'checked' : ''}><span>${NAMA_HARI[h]}</span></label>`).join('')}</div>
        <h2>Sesi</h2>
        ${d.sesi.map((s, i) => `<div class="baris-medan adm-sesi"><div class="medan"><label for="s-n${i}">Nama sesi</label><input id="s-n${i}" data-sesi-nama="${i}" type="text" maxlength="20" value="${esc(s.nama)}"></div><div class="medan"><label for="s-j${i}">Jam</label><input id="s-j${i}" data-sesi-jam="${i}" type="text" maxlength="30" value="${esc(s.jam)}"></div><button class="tombol-ikon" type="button" data-hapus-sesi="${i}" aria-label="Hapus sesi ${esc(s.nama)}">${ikon('trash-2')}</button></div>`).join('')}
        <div><button class="tombol tombol-garis kecil" type="button" data-tambah-sesi>${ikon('plus')}Tambah sesi</button></div>
        <h2>Tanggal tutup</h2>
        <p class="petunjuk" style="margin:0">Tanggal ini tidak muncul di formulir booking, misalnya saat hari raya atau pengurus bepergian.</p>
        <ul class="adm-label">${d.libur.map((t, i) => `<li>${esc(tanggalBooking(t))}<button type="button" data-hapus-libur="${i}" aria-label="Hapus ${esc(t)}">${ikon('x')}</button></li>`).join('') || '<li class="kosong-kecil">Belum ada</li>'}</ul>
        <div class="adm-tambah"><input type="date" data-libur-baru aria-label="Tanggal tutup baru" min="${hariIni()}"><button class="tombol tombol-garis kecil" type="button" data-tambah-libur>${ikon('plus')}Tambah</button></div>
      </section>
      <section class="adm-kartu medan-kecil adm-tumpuk">
        <h2>Produk untuk testimoni</h2>
        <p class="petunjuk" style="margin:0">Nama produk yang bisa dipilih pengunjung saat menulis testimoni. Layanan seperti konseling dan meditasi sudah otomatis ada.</p>
        <ul class="adm-label">${d.produk.map((p, i) => `<li>${esc(p)}<button type="button" data-hapus-produk="${i}" aria-label="Hapus ${esc(p)}">${ikon('x')}</button></li>`).join('') || '<li class="kosong-kecil">Belum ada produk</li>'}</ul>
        <div class="adm-tambah"><input type="text" data-produk-baru maxlength="60" placeholder="Nama produk" aria-label="Nama produk baru"><button class="tombol tombol-garis kecil" type="button" data-tambah-produk>${ikon('plus')}Tambah</button></div>
        <h2>Catatan di formulir booking</h2>
        <div class="medan"><label for="a-catatan">Tampil di samping formulir</label><textarea id="a-catatan" data-catatan-booking rows="4" maxlength="400" placeholder="Contoh: bawa kain dan selendang bila datang untuk upacara.">${esc(d.catatanBooking)}</textarea></div>
        <button class="tombol tombol-utama" type="submit">${ikon('check')}Simpan pengaturan</button>
      </section>
    </form>`;
  };
  gambar();
  const bacaIsian = () => {
    d.hariBuka = $$('[name=hari]:checked', isi).map((c) => Number(c.value));
    d.sesi.forEach((s, i) => { s.nama = $(`[data-sesi-nama="${i}"]`).value.trim(); s.jam = $(`[data-sesi-jam="${i}"]`).value.trim(); });
    d.catatanBooking = $('[data-catatan-booking]').value.trim();
  };
  // Pendengar dipasang pada wadah yang dipakai semua menu; yang lama dicabut tiap kali halaman ini dibuka.
  ctlJadwal?.abort();
  ctlJadwal = new AbortController();
  const { signal } = ctlJadwal;
  isi.addEventListener('click', (e) => {
    if (!location.hash.startsWith('#jadwal')) return ctlJadwal.abort();
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.tambahSesi !== undefined) { bacaIsian(); d.sesi.push({ kunci: '', nama: '', jam: '' }); gambar(); }
    else if (t.dataset.hapusSesi !== undefined) { bacaIsian(); d.sesi.splice(Number(t.dataset.hapusSesi), 1); gambar(); }
    else if (t.dataset.tambahLibur !== undefined) { const v = $('[data-libur-baru]').value; if (v) { bacaIsian(); d.libur = [...new Set([...d.libur, v])].sort(); gambar(); } }
    else if (t.dataset.hapusLibur !== undefined) { bacaIsian(); d.libur.splice(Number(t.dataset.hapusLibur), 1); gambar(); }
    else if (t.dataset.tambahProduk !== undefined) { const v = $('[data-produk-baru]').value.trim(); if (v) { bacaIsian(); d.produk = [...new Set([...d.produk, v])]; gambar(); } }
    else if (t.dataset.hapusProduk !== undefined) { bacaIsian(); d.produk.splice(Number(t.dataset.hapusProduk), 1); gambar(); }
  }, { signal });
  isi.addEventListener('submit', (e) => {
    if (!e.target.matches('[data-atur]')) return;
    e.preventDefault();
    bacaIsian();
    if (!d.hariBuka.length || !d.sesi.length || d.sesi.some((s) => !s.nama)) return roti('Pilih minimal satu hari buka dan satu sesi bernama.', 'galat');
    const simpan = { ...d, sesi: d.sesi.map((s, i) => ({ kunci: s.kunci || kunciSesi(s.nama, i), nama: s.nama, jam: s.jam })) };
    denganMemuat($('[type=submit]', e.target), async () => {
      try { await L.simpanPengaturan(simpan); roti('Pengaturan disimpan. Formulir booking langsung mengikuti.', 'berhasil'); } catch (err) { roti(pesanGalat(err), 'galat'); }
    });
  }, { signal });
}

// ======================================================================
// PENGGUNA & PENGURUS
// ======================================================================
async function vPengguna() {
  setJudul('Pengguna & pengurus');
  const [pengguna, admin] = await Promise.all([L.semuaPengguna(), L.daftarAdmin()]);
  aksi.innerHTML = `<button class="tombol tombol-utama kecil" type="button" data-unduh>${ikon('file-spreadsheet')}Unduh Excel</button>`;
  const utama = (KONFIG.adminUtama || []);
  isi.innerHTML = `
    <section class="adm-kartu" style="margin-bottom:24px">
      <h2>Pengurus dengan akses panel</h2>
      <ul class="adm-daftar-admin">
        ${utama.map((e) => `<li><span><b>${esc(e)}</b><small>Pengurus utama (diatur di konfigurasi situs)</small></span></li>`).join('')}
        ${admin.filter((a) => !utama.includes(a.email)).map((a) => `<li><span><b>${esc(a.nama || a.email)}</b><small>${esc(a.email)} · ditambahkan ${esc(tanggalPendek(a.ditambahkan))}${a.oleh ? ` oleh ${esc(a.oleh)}` : ''}</small></span>${a.id !== saya.uid ? `<button class="tombol tombol-hapus kecil" type="button" data-cabut="${a.id}">Cabut akses</button>` : '<span class="status">Anda</span>'}</li>`).join('')}
      </ul>
      <form class="adm-tambah-admin" data-tambah-admin>
        <div class="medan"><label for="ta-email">Tambah pengurus</label><input id="ta-email" name="email" type="email" required placeholder="email@contoh.com"><p class="petunjuk">Orangnya harus sudah membuat akun di situs ini.</p></div>
        <button class="tombol tombol-utama" type="submit">${ikon('user-check')}Beri akses</button>
      </form>
    </section>
    <section>
      <div class="adm-saring"><label class="cari"><span class="sr-only">Cari pengguna</span>${ikon('search')}<input type="search" data-cari-pengguna placeholder="Cari nama atau email"></label></div>
      <p class="adm-hitung" data-hitung></p>
      <div data-tabel></div>
    </section>`;
  const gambar = () => {
    const q = $('[data-cari-pengguna]').value.toLowerCase();
    const h = pengguna.filter((u) => !q || `${u.nama} ${u.email}`.toLowerCase().includes(q));
    $('[data-hitung]').textContent = `${h.length} dari ${pengguna.length} akun terdaftar`;
    $('[data-tabel]').innerHTML = `<div class="tabel-wadah"><table class="tabel adm-tabel"><thead><tr><th>Nama</th><th>WhatsApp</th><th>Domisili</th><th>Daftar</th><th>Status</th><th><span class="sr-only">Aksi</span></th></tr></thead><tbody>${h.map((u) => `<tr><td><b>${esc(u.nama)}</b><small>${esc(u.email)}</small></td><td>${esc(u.wa || '-')}</td><td>${esc(u.kota || '-')}</td><td>${esc(tanggalPendek(u.dibuat))}</td><td><div class="adm-tanda">${u.admin ? '<span class="status" data-status="terbit">Pengurus</span>' : ''}${u.diblokir ? '<span class="status" data-status="mendesak">Diblokir</span>' : ''}</div></td><td class="adm-aksi-sel">${u.id !== saya.uid && !u.admin ? `<button class="tombol ${u.diblokir ? 'tombol-garis' : 'tombol-hapus'} kecil" type="button" data-blokir="${u.id}" data-nilai="${u.diblokir ? '0' : '1'}">${u.diblokir ? 'Buka blokir' : 'Blokir'}</button>` : ''}</td></tr>`).join('')}</tbody></table></div>`;
  };
  $('[data-cari-pengguna]').addEventListener('input', gambar);
  gambar();
  $('[data-tabel]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-blokir]');
    if (!b) return;
    const blokir = b.dataset.nilai === '1';
    if (blokir && !confirm('Blokir akun ini? Pemiliknya tidak bisa lagi mengirim booking atau testimoni.')) return;
    denganMemuat(b, async () => { try { await L.aturBlokir(b.dataset.blokir, blokir); roti(blokir ? 'Akun diblokir.' : 'Blokir dibuka.', 'berhasil'); vPengguna(); } catch (err) { roti(pesanGalat(err), 'galat'); } });
  });
  $$('[data-cabut]').forEach((b) => b.addEventListener('click', () => {
    if (!confirm('Cabut akses panel pengurus untuk akun ini?')) return;
    denganMemuat(b, async () => { try { await L.hapusAdmin(b.dataset.cabut); roti('Akses dicabut.', 'berhasil'); vPengguna(); } catch (err) { roti(pesanGalat(err), 'galat'); } });
  }));
  $('[data-tambah-admin]').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    denganMemuat($('[type=submit]', f), async () => { try { await L.tambahAdmin(f.email.value); roti('Akses pengurus diberikan.', 'berhasil'); vPengguna(); } catch (err) { roti(pesanGalat(err), 'galat'); } });
  });
  $('[data-unduh]').addEventListener('click', () => unduhBlob(buatXlsx([{ nama: 'Pengguna', kolom: ['Nama', 'Email', 'WhatsApp', 'Kab/Kota', 'Daftar', 'Pengurus', 'Diblokir'].map((judul) => ({ judul, lebar: 24 })), baris: pengguna.map((u) => [u.nama, u.email, u.wa || '', u.kota || '', tanggalJam(u.dibuat), u.admin ? 'Ya' : '', u.diblokir ? 'Ya' : '']) }]), `pengguna-cahaya-teratai-putih-${new Date().toISOString().slice(0, 10)}.xlsx`));
}

// ======================================================================
// SISTEM
// ======================================================================
async function vSistem() {
  setJudul('Sistem');
  const fb = KONFIG.firebase || {};
  isi.innerHTML = `
    <div class="adm-kisi-2" style="margin-top:0">
      <section class="adm-kartu">
        <h2>Status layanan</h2>
        <dl class="rincian">
          <dt>Mode</dt><dd>${MODE === 'firebase' ? '<span class="status" data-status="terbit">Terhubung ke Firebase</span>' : '<span class="status" data-status="draf">Demo (data di peramban ini)</span>'}</dd>
          <dt>Proyek Firebase</dt><dd class="kode">${esc(fb.projectId || 'belum diisi')}</dd>
          <dt>Alamat situs</dt><dd><a href="${ASAL}" target="_blank" rel="noopener">${esc(ASAL)}</a></dd>
          <dt>Email notifikasi</dt><dd>${esc(KONFIG.notifikasi?.emailBookingBaru || 'tidak aktif')}</dd>
        </dl>
        <button class="tombol tombol-garis kecil" type="button" data-periksa style="margin-top:16px">${ikon('shield-check')}Periksa koneksi</button>
        <div data-hasil-periksa style="margin-top:14px"></div>
      </section>
      <section class="adm-kartu">
        <h2>Cara kerja situs</h2>
        <ul class="adm-poin">
          <li>Situs disajikan GitHub Pages tanpa server sendiri. Booking, testimoni, dan kabar disimpan di Cloud Firestore.</li>
          <li>Kabar baru langsung tampil di beranda. Halaman statis per kabar dibangun ulang otomatis tiap jam oleh GitHub Actions.</li>
          <li>Booking hanya bisa dibaca tamu pemiliknya dan pengurus; aturan aksesnya ada di berkas <span class="kode">firestore.rules</span>.</li>
          <li>Unduh rekap Excel secara berkala sebagai cadangan arsip yayasan.</li>
        </ul>
        ${MODE === 'demo' ? `<div class="pesan pesan-peringatan" style="margin-top:16px">${ikon('triangle-alert')}<div><p>Data demo hanya ada di peramban ini.</p><p style="margin-top:8px"><button class="tombol tombol-hapus kecil" type="button" data-setel-demo>Hapus semua data demo</button></p></div></div>` : ''}
      </section>
    </div>`;
  $('[data-setel-demo]')?.addEventListener('click', async () => {
    if (!confirm('Hapus semua akun, booking, testimoni, dan kabar demo di peramban ini?')) return;
    const { setelUlangDemo } = await import('./demo.js');
    setelUlangDemo();
    location.href = BASE;
  });
  $('[data-periksa]').addEventListener('click', (e) => denganMemuat(e.currentTarget, async () => {
    const hasil = [];
    const uji = async (nama, fn) => {
      try { const pesan = await fn(); hasil.push({ nama, ok: true, pesan }); } catch (err) { hasil.push({ nama, ok: false, pesan: pesanGalat(err), tautan: err.tautanIndeks }); }
    };
    const { daftarKabar, daftarTestimoni } = await import('./publik.js');
    await uji('Membaca kabar publik', async () => `${(await daftarKabar({ batas: 3 })).length} kabar terbaca`);
    await uji('Saring kabar per kategori', async () => {
      if (MODE !== 'firebase') return 'mode demo';
      const { kueriKabar } = await import('./rest.js');
      await kueriKabar({ projectId: fb.projectId, apiKey: fb.apiKey, batas: 1, kategori: 'Kegiatan' });
      return 'indeks tersedia';
    });
    await uji('Membaca testimoni publik', async () => `${(await daftarTestimoni()).length} testimoni tampil`);
    await uji('Membaca booking (akses pengurus)', async () => `${(await L.semuaBooking()).length} booking`);
    $('[data-hasil-periksa]').innerHTML = `<ul class="adm-periksa">${hasil.map((h) => `<li class="${h.ok ? 'ok' : 'gagal'}">${ikon(h.ok ? 'circle-check' : 'circle-x')}<span><b>${esc(h.nama)}</b><small>${esc(h.pesan)}${h.tautan ? ` — <a href="${esc(h.tautan)}" target="_blank" rel="noopener">buat indeks</a>` : ''}</small></span></li>`).join('')}</ul>`;
  }));
}
