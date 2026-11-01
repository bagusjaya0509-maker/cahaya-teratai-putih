// Formulir booking konsultasi. Tanpa Firebase (mode mati), formulir yang sama
// menyusun pesan WhatsApp, jadi pengunjung tetap bisa booking.
import { $, $$, BASE, MODE, KONFIG, esc, ikon, param, roti, denganMemuat, pesanGalat, lokalBaca, lokalSimpan } from './inti.js';
import { L, pantauSesi } from './layanan.js';
import { ambilPengaturan } from './publik.js';
import { LAYANAN_BOOKING, CARA_BERTEMU, NAMA_HARI, namaLayanan, namaCara, namaSesi, tanggalBooking, hariIni, pasangKota } from './rujukan.js';

const f = $('[data-booking]');
const KUNCI_DRAF = 'ctp.draf.booking';
let atur = null;

// ---------- pilihan ----------
$('[data-layanan]').innerHTML = LAYANAN_BOOKING.map((l) => `<label class="pilihan"><input type="radio" name="layanan" value="${l.kunci}" required><span><b>${esc(l.nama)}${l.gratis ? ' <span class="lencana-gratis">Gratis</span>' : ''}</b><small>${esc(l.ringkas)}</small></span></label>`).join('');
$('[data-cara]').innerHTML = CARA_BERTEMU.map((c, i) => `<label class="pilihan"><input type="radio" name="cara" value="${c.kunci}" ${i === 0 ? 'checked' : ''} required><span><b>${esc(c.nama)}</b><small>${esc(c.ket)}</small></span></label>`).join('');
pasangKota();

const dipilih = param('layanan');
if (dipilih && LAYANAN_BOOKING.some((l) => l.kunci === dipilih)) $(`input[name=layanan][value="${dipilih}"]`, f).checked = true;

/** 21 tanggal buka berikutnya, tidak termasuk hari ini (pengurus perlu waktu konfirmasi). */
function tanggalBuka() {
  const libur = new Set(atur.libur || []);
  const hasil = [];
  for (let i = 1; i < 60 && hasil.length < 21; i++) {
    const t = hariIni(i);
    const [y, m, d] = t.split('-').map(Number);
    const hari = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    if (atur.hariBuka.includes(hari) && !libur.has(t)) hasil.push({ t, hari, tgl: d, bulan: m });
  }
  return hasil;
}
const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function isiJadwal() {
  const daftar = tanggalBuka();
  $('[data-tanggal]').innerHTML = daftar.length
    ? daftar.map((d) => `<label class="kartu-tanggal"><input type="radio" name="tanggal" value="${d.t}" required><span><small>${NAMA_HARI[d.hari].slice(0, 3)}</small><b>${d.tgl}</b><small>${BLN[d.bulan - 1]}</small></span></label>`).join('')
    : `<div class="pesan pesan-peringatan">${ikon('info')}<p>Jadwal sedang ditutup sementara. Hubungi yayasan lewat WhatsApp untuk mengatur waktu.</p></div>`;
  $('[data-sesi]').innerHTML = atur.sesi.map((s, i) => `<label class="pilihan"><input type="radio" name="sesi" value="${esc(s.kunci)}" ${i === 0 ? 'checked' : ''} required><span><b>${esc(s.nama)}</b><small>${esc(s.jam)}</small></span></label>`).join('');
  if (atur.catatanBooking) {
    const c = $('[data-catatan-booking]');
    c.textContent = atur.catatanBooking;
    c.parentElement.hidden = false;
  }
  pulihkanDraf();
}

// ---------- draf di perangkat ----------
const MEDAN = ['nama', 'wa', 'kota', 'catatan'];
function simpanDraf() {
  const d = {};
  MEDAN.forEach((n) => (d[n] = f.elements[n].value));
  lokalSimpan(KUNCI_DRAF, d);
}
function pulihkanDraf() {
  const d = lokalBaca(KUNCI_DRAF);
  if (d) MEDAN.forEach((n) => { if (d[n] && !f.elements[n].value) f.elements[n].value = d[n]; });
}
let tundaDraf;
f.addEventListener('input', () => { clearTimeout(tundaDraf); tundaDraf = setTimeout(simpanDraf, 700); });

// ---------- kirim ----------
function periksa() {
  const E = f.elements;
  const masalah = [];
  const cek = (el, ok, pesan) => {
    const sasaran = el instanceof RadioNodeList ? el[0]?.closest('[role=radiogroup]') : el;
    sasaran?.setAttribute('aria-invalid', String(!ok));
    if (!ok) masalah.push({ el, pesan });
  };
  cek(E.layanan, E.layanan.value, 'Pilih keperluan konsultasi.');
  cek(E.tanggal, E.tanggal?.value, 'Pilih tanggal.');
  cek(E.nama, E.nama.value.trim().length >= 2, 'Isi nama lengkap.');
  cek(E.wa, /^(\+?62|0)8\d{7,12}$/.test(E.wa.value.replace(/[\s-]/g, '')), 'Nomor WhatsApp diawali 08 atau +628, contoh 081234567890.');
  cek(E.setuju, E.setuju.checked, 'Centang persetujuan di bagian bawah.');
  return masalah;
}

const pesanWa = (d) => [
  'Salam, saya ingin booking konsultasi di Yayasan Cahaya Teratai Putih.',
  d.nomor ? `Nomor booking: ${d.nomor}` : '',
  `Nama: ${d.nama}`,
  `Keperluan: ${namaLayanan(d.layanan)}`,
  `Waktu: ${tanggalBooking(d.tanggal)}, ${namaSesi(d.sesi, atur.sesi)}`,
  `Cara: ${namaCara(d.cara)}`,
  d.kota ? `Domisili: ${d.kota}` : '',
  d.catatan && !d.nomor ? `Catatan: ${d.catatan}` : '',
].filter(Boolean).join('\n');
const tautanPesan = (d) => `https://wa.me/${KONFIG.kontak.whatsapp}?text=${encodeURIComponent(pesanWa(d))}`;

function tampilHasil(d) {
  const hasil = $('[data-hasil]');
  hasil.innerHTML = `
    <div class="kartu hasil-kirim">
      <span class="hasil-ikon">${ikon('circle-check')}</span>
      <p class="label">Booking terkirim</p>
      <h2>Simpan nomor booking Anda</h2>
      <p class="nomor-tiket" translate="no">${esc(d.nomor)}</p>
      <p>Pengurus akan memeriksa jadwal dan menghubungi nomor WhatsApp <b translate="no">${esc(d.wa)}</b> untuk memastikan waktu konsultasi. Anda juga dapat mengirim konfirmasi lewat WhatsApp.</p>
      <div class="aksi-formulir">
        <a class="tombol tombol-utama" href="${esc(tautanPesan(d))}" target="_blank" rel="noopener">${ikon('whatsapp')}Konfirmasi lewat WhatsApp</a>
        <a class="tombol tombol-garis" href="${BASE}akun/#booking/${esc(d.id)}">Lihat status booking</a>
        <button class="tombol-teks" type="button" data-salin>${ikon('copy')}Salin nomor</button>
      </div>
    </div>`;
  hasil.hidden = false;
  f.hidden = true;
  $('[data-salin]').addEventListener('click', () => navigator.clipboard?.writeText(d.nomor).then(() => roti('Nomor disalin.', 'berhasil')));
  hasil.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

f.addEventListener('submit', (e) => {
  e.preventDefault();
  const galat = $('[data-galat]', f);
  const masalah = periksa();
  if (masalah.length) {
    galat.textContent = masalah.map((m) => m.pesan).join(' ');
    galat.hidden = false;
    const el = masalah[0].el;
    (el instanceof RadioNodeList ? el[0] : el)?.focus();
    return;
  }
  galat.hidden = true;
  const E = f.elements;
  const data = {
    nama: E.nama.value.trim(),
    wa: E.wa.value.replace(/[\s-]/g, ''),
    kota: E.kota.value.trim(),
    layanan: E.layanan.value,
    cara: E.cara.value,
    tanggal: E.tanggal.value,
    sesi: E.sesi.value,
    catatan: E.catatan.value.trim(),
  };
  if (MODE === 'mati') {
    window.open(tautanPesan(data), '_blank', 'noopener');
    return;
  }
  denganMemuat($('[type=submit]', f), async () => {
    try {
      const { id, nomor } = await L.kirimBooking(data);
      lokalSimpan(KUNCI_DRAF, null);
      tampilHasil({ ...data, id, nomor });
    } catch (err) {
      console.error(err);
      galat.textContent = pesanGalat(err);
      galat.hidden = false;
    }
  });
});

if (MODE === 'mati') {
  $('[type=submit]', f).innerHTML = `${ikon('whatsapp')}Kirim lewat WhatsApp`;
} else {
  pantauSesi((p) => {
    if (!p || p.tamu) return;
    if (!f.elements.nama.value) f.elements.nama.value = p.nama || '';
    if (!f.elements.wa.value && p.wa) f.elements.wa.value = p.wa;
    if (!f.elements.kota.value && p.kota) f.elements.kota.value = p.kota;
  });
}

ambilPengaturan().then((a) => { atur = a; isiJadwal(); }).catch((e) => {
  console.error(e);
  $('[data-tanggal]').innerHTML = `<div class="pesan pesan-galat">${ikon('triangle-alert')}<p>Jadwal belum bisa dimuat. Muat ulang halaman, atau hubungi yayasan lewat WhatsApp.</p></div>`;
});
