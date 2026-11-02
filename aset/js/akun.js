import { $, $$, BASE, MODE, esc, ikon, roti, denganMemuat, pesanGalat, tanggalPendek, waktuLalu, fotoAkun } from './inti.js';
import { L } from './layanan.js';
import { jagaAkun } from './gerbang.js';
import { ambilPengaturan } from './publik.js';
import { namaLayanan, tanggalBooking, pasangKota } from './rujukan.js';
import { pilStatus, langkahStatus, rincianBooking, liniTanggapan, jadwalTeks } from './booking-tampil.js';

const panel = { booking: $('[data-panel="booking"]'), profil: $('[data-panel="profil"]') };
const fProfil = $('[data-form-profil]');
pasangKota();

let pengguna = null;
let daftar = [];
let sesiJadwal;

// ---------- kepala & verifikasi ----------
function kepala(p) {
  $('[data-akun-kepala]').innerHTML = `
    <div class="akun-identitas">${p.tamu ? `<span class="inisial-besar" aria-hidden="true">${ikon('calendar')}</span>` : fotoAkun(p, 'inisial-besar')}<div><h1>${p.tamu ? 'Booking saya' : esc(p.nama)}</h1><p>${p.tamu ? 'Tersimpan di perangkat ini' : esc(p.email)}</p></div></div>
    <div class="aksi-formulir">
      ${p.admin ? `<a class="tombol tombol-garis-langit" href="${BASE}admin/">${ikon('layout-dashboard')}Panel pengurus</a>` : ''}
      <a class="tombol tombol-utama" href="${BASE}booking/">${ikon('plus')}Booking baru</a>
    </div>`;
  $$('[data-tab="profil"]').forEach((t) => (t.hidden = Boolean(p.tamu)));
  $('[data-catatan-tamu]').hidden = !p.tamu;
  const v = $('[data-verifikasi]');
  if (MODE === 'firebase' && !p.tamu && !p.terverifikasi && p.penyedia === 'password') {
    v.innerHTML = `<div class="pesan pesan-peringatan" style="margin-bottom:24px">${ikon('mail')}<div><p><b>Email belum diverifikasi.</b> Kami mengirim tautan verifikasi ke ${esc(p.email)}.</p><p style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="tombol tombol-garis kecil" type="button" data-kirim-verif>Kirim ulang tautan</button><button class="tombol tombol-garis kecil" type="button" data-cek-verif>Saya sudah verifikasi</button></p></div></div>`;
    $('[data-kirim-verif]', v).addEventListener('click', (e) => denganMemuat(e.currentTarget, async () => {
      try { await L.kirimUlangVerifikasi(); roti('Tautan verifikasi dikirim ulang.', 'berhasil'); } catch (err) { roti(pesanGalat(err), 'galat'); }
    }));
    $('[data-cek-verif]', v).addEventListener('click', (e) => denganMemuat(e.currentTarget, () => L.muatUlangSesi()));
  } else v.innerHTML = '';
}

// ---------- tab & rute hash ----------
function pilihTab(nama) {
  $$('[data-tab]').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === nama)));
  Object.entries(panel).forEach(([k, el]) => (el.hidden = k !== nama));
}
$$('[data-tab]').forEach((t) => t.addEventListener('click', () => (location.hash = t.dataset.tab)));

async function rute() {
  if (!pengguna) return;
  const [bagian, id] = location.hash.slice(1).split('/');
  if (bagian === 'profil' && !pengguna.tamu) { pilihTab('profil'); return isiProfil(); }
  pilihTab('booking');
  if (bagian === 'booking' && id) return tampilDetail(id);
  return tampilDaftar();
}
addEventListener('hashchange', rute);

// ---------- booking ----------
async function muatBooking() {
  daftar = await L.bookingSaya();
  $('[data-hitung-booking]').textContent = daftar.length;
}

async function tampilDaftar() {
  panel.booking.innerHTML = `<div class="kerangka" style="height:96px"></div><div class="kerangka" style="height:96px;margin-top:12px"></div>`;
  try {
    await muatBooking();
  } catch (e) {
    panel.booking.innerHTML = `<div class="pesan pesan-galat">${ikon('triangle-alert')}<p>${esc(pesanGalat(e))}</p></div>`;
    return;
  }
  if (!daftar.length) {
    panel.booking.innerHTML = `<div class="kosong"><h3>Belum ada booking</h3><p>Booking yang Anda kirim akan tercatat di sini lengkap dengan statusnya.</p><p style="margin-top:20px"><a class="tombol tombol-utama" href="${BASE}booking/">Booking konsultasi</a></p></div>`;
    return;
  }
  panel.booking.innerHTML = `<ul class="daftar-laporan">${daftar
    .map((b) => {
      const balasanBaru = b.ditangani && (!b.balasanTamu || (b.dibacaAdmin || 0) > b.balasanTamu);
      return `<li><a class="butir-laporan" href="#booking/${esc(b.id)}">
        <div><span class="kode">${esc(b.nomor)}</span><h3>${esc(namaLayanan(b.layanan))}</h3><span class="meta-kecil">${esc(jadwalTeks(b) || `Diminta ${tanggalBooking(b.tanggal)}`)}</span></div>
        <div style="display:grid;gap:6px;justify-items:end;align-content:start">${pilStatus(b.status)}${balasanBaru && b.status !== 'baru' ? '<span class="ada-balasan">Ada pesan pengurus</span>' : ''}</div>
      </a></li>`;
    })
    .join('')}</ul>`;
}

async function tampilDetail(id) {
  panel.booking.innerHTML = `<div class="kerangka" style="height:240px"></div>`;
  try {
    const [b, tg] = await Promise.all([L.ambilBooking(id), L.tanggapan(id)]);
    if (!b) {
      panel.booking.innerHTML = `<div class="kosong"><h3>Booking tidak ditemukan</h3><p>Mungkin tautannya keliru. <a href="#booking">Kembali ke daftar booking</a>.</p></div>`;
      return;
    }
    sesiJadwal ??= (await ambilPengaturan()).sesi;
    const berjalan = ['baru', 'terjadwal'].includes(b.status);
    panel.booking.innerHTML = `
      <p><a class="tombol-teks" href="#booking">${ikon('arrow-left')}Semua booking</a></p>
      <div class="detail-laporan">
        <div>
          <div class="detail-kepala"><span class="kode">${esc(b.nomor)}</span>${pilStatus(b.status)}</div>
          <h2 class="detail-judul">${esc(namaLayanan(b.layanan))}</h2>
          ${langkahStatus(b.status)}
          ${b.jadwalTanggal ? `<div class="pesan pesan-berhasil">${ikon('calendar')}<p><b>Jadwal Anda:</b> ${esc(jadwalTeks(b))}</p></div>` : ''}
          ${b.catatan ? `<h3 class="sub-judul">Catatan Anda</h3><p class="teks-panjang">${esc(b.catatan)}</p>` : ''}
          <h3 class="sub-judul">Pesan dengan pengurus</h3>
          ${liniTanggapan(tg, { kosong: 'Pengurus belum mengirim pesan. Konfirmasi jadwal biasanya lewat WhatsApp.' })}
          ${berjalan ? `<form class="formulir" data-balas style="margin-top:20px;gap:12px"><div class="medan"><label for="balas">Tulis pesan untuk pengurus</label><textarea id="balas" name="pesan" rows="3" maxlength="3000" required></textarea></div><div class="aksi-formulir"><button class="tombol tombol-utama" type="submit">${ikon('send')}Kirim pesan</button><button class="tombol tombol-hapus" type="button" data-batal>Batalkan booking</button></div></form>` : ''}
        </div>
        <aside class="kartu">${rincianBooking(b, { sesi: sesiJadwal })}</aside>
      </div>`;
    $('[data-balas]', panel.booking)?.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.currentTarget;
      const pesan = f.pesan.value.trim();
      if (pesan.length < 2) return;
      denganMemuat($('[type=submit]', f), async () => {
        try {
          await L.kirimTanggapan(id, pesan);
          roti('Pesan terkirim.', 'berhasil');
          tampilDetail(id);
        } catch (err) { roti(pesanGalat(err), 'galat'); }
      });
    });
    $('[data-batal]', panel.booking)?.addEventListener('click', (e) => {
      if (!confirm('Batalkan booking ini?')) return;
      denganMemuat(e.currentTarget, async () => {
        try {
          await L.batalkanBooking(id);
          roti('Booking dibatalkan.', 'berhasil');
          tampilDetail(id);
        } catch (err) { roti(pesanGalat(err), 'galat'); }
      });
    });
    scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    console.error(e);
    panel.booking.innerHTML = `<div class="pesan pesan-galat">${ikon('triangle-alert')}<p>${esc(pesanGalat(e))}</p></div>`;
  }
}

// ---------- profil ----------
function isiProfil() {
  const E = fProfil.elements;
  E.email.value = pengguna.email;
  E.nama.value = pengguna.nama || '';
  E.wa.value = pengguna.wa || '';
  E.kota.value = pengguna.kota || '';
}
fProfil.addEventListener('submit', (e) => {
  e.preventDefault();
  const E = fProfil.elements;
  const galat = $('[data-galat]', fProfil);
  const wa = E.wa.value.replace(/[\s-]/g, '');
  if (E.nama.value.trim().length < 3) { galat.textContent = 'Isi nama lengkap.'; galat.hidden = false; return; }
  if (wa && !/^(\+?62|0)8\d{7,12}$/.test(wa)) { galat.textContent = 'Nomor WhatsApp diawali 08 atau +628.'; galat.hidden = false; return; }
  galat.hidden = true;
  denganMemuat($('[type=submit]', fProfil), async () => {
    try {
      await L.simpanProfil({ nama: E.nama.value.trim(), wa, kota: E.kota.value.trim() });
      roti('Profil disimpan.', 'berhasil');
    } catch (err) { galat.textContent = pesanGalat(err); galat.hidden = false; }
  });
});
$('[data-keluar]').addEventListener('click', (e) => denganMemuat(e.currentTarget, async () => {
  await L.keluar();
  location.href = BASE;
}));

let pertama = true;
jagaAkun({
  wadah: $('[data-akun]'),
  pesan: $('[data-pesan-gerbang]'),
  keperluan: 'booking',
  saatMasuk(p) {
    pengguna = p;
    kepala(p);
    if (pertama) { pertama = false; rute(); muatBooking().catch(() => {}); }
  },
});
