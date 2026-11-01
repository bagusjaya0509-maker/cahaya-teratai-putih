// Penjaga halaman akun dan kartu pesan untuk layanan yang belum tersambung.
import { MODE, KONFIG, BASE, esc, ikon } from './inti.js';
import { pantauSesi } from './layanan.js';

const kt = () => KONFIG.kontak || {};
export const tautanWa = () => `<a href="https://wa.me/${esc(kt().whatsapp)}" target="_blank" rel="noopener">${esc(kt().telepon)}</a>`;

export function kartuMati() {
  return `<div class="kartu kartu-gerbang">
    ${ikon('clock', 'ikon ikon-besar')}
    <h2>Layanan daring sedang disiapkan</h2>
    <p>Bagian ini belum tersambung ke server. Sementara itu, hubungi yayasan lewat WhatsApp ${tautanWa()} atau email <a href="mailto:${esc(kt().email)}">${esc(kt().email)}</a>.</p>
  </div>`;
}

export function kartuMasuk(keperluan) {
  const lanjut = encodeURIComponent(location.pathname + location.search + location.hash);
  return `<div class="kartu kartu-gerbang">
    ${ikon('calendar', 'ikon ikon-besar')}
    <h2>Belum ada ${esc(keperluan)} di perangkat ini</h2>
    <p>Booking yang dikirim dari perangkat ini tercatat di halaman ini. Pemilik akun dapat masuk untuk melihat riwayatnya.</p>
    <div class="aksi-formulir">
      <a class="tombol tombol-utama" href="${BASE}booking/">Booking konsultasi</a>
      <a class="tombol tombol-garis" href="${BASE}masuk/?lanjut=${lanjut}">Masuk</a>
    </div>
  </div>`;
}

/**
 * wadah   : elemen yang hanya tampil bila ada sesi (akun atau tamu)
 * pesan   : elemen untuk kartu "belum ada" / "layanan belum aktif"
 * saatMasuk(pengguna) dipanggil setiap kali sesi berganti
 */
export function jagaAkun({ wadah, pesan, keperluan, saatMasuk }) {
  if (MODE === 'mati') {
    pesan.innerHTML = kartuMati();
    pesan.hidden = false;
    wadah.hidden = true;
    return;
  }
  pesan.innerHTML = `<div class="kartu kartu-gerbang" aria-busy="true">${ikon('loader-circle', 'ikon ikon-besar berputar')}<p>Memeriksa data…</p></div>`;
  pesan.hidden = false;
  wadah.hidden = true;
  pantauSesi((p) => {
    if (!p) {
      pesan.innerHTML = kartuMasuk(keperluan);
      pesan.hidden = false;
      wadah.hidden = true;
      return;
    }
    if (p.diblokir) {
      pesan.innerHTML = `<div class="kartu kartu-gerbang">${ikon('ban', 'ikon ikon-besar')}<h2>Pengiriman dinonaktifkan</h2><p>Perangkat ini tidak dapat mengirim booking atau testimoni. Bila menurut Anda ini keliru, hubungi yayasan lewat WhatsApp ${tautanWa()}.</p></div>`;
      pesan.hidden = false;
      wadah.hidden = true;
      return;
    }
    pesan.hidden = true;
    wadah.hidden = false;
    saatMasuk?.(p);
  });
}
