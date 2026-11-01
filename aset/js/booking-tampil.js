// Potongan tampilan booking yang dipakai halaman akun dan panel pengurus.
import { esc, ikon, tanggalJam } from './inti.js';
import { STATUS_BOOKING, namaLayanan, namaCara, namaSesi, tanggalBooking } from './rujukan.js';

export const pilStatus = (s) => `<span class="status" data-status="${esc(s)}">${esc(STATUS_BOOKING[s] || s)}</span>`;

const URUTAN = ['baru', 'terjadwal', 'selesai'];
export function langkahStatus(status) {
  if (status === 'batal') return `<p class="langkah-tutup">${ikon('circle-x')} Booking ini dibatalkan.</p>`;
  const i = URUTAN.indexOf(status);
  return `<ol class="langkah-status">${URUTAN.map((s, n) => `<li class="${n < i ? 'lewat' : n === i ? 'kini' : ''}"><span>${esc(STATUS_BOOKING[s])}</span></li>`).join('')}</ol>`;
}

export const jadwalTeks = (b) => (b.jadwalTanggal ? `${tanggalBooking(b.jadwalTanggal)}${b.jadwalJam ? `, pukul ${b.jadwalJam} WITA` : ''}` : '');

export function rincianBooking(b, { admin = false, sesi } = {}) {
  const baris = [];
  const t = (k, v) => v && baris.push(`<dt>${k}</dt><dd>${v}</dd>`);
  t('Keperluan', esc(namaLayanan(b.layanan)));
  t('Jadwal tetap', esc(jadwalTeks(b)));
  t('Tanggal yang diminta', esc(tanggalBooking(b.tanggal)));
  t('Sesi yang diminta', esc(namaSesi(b.sesi, sesi)));
  t('Cara bertemu', esc(namaCara(b.cara)));
  if (admin) {
    t('Nama', esc(b.nama));
    t('WhatsApp', `<a href="https://wa.me/${esc(waIntl(b.wa))}" target="_blank" rel="noopener">${esc(b.wa)}</a>`);
    t('Domisili', esc(b.kota));
    t('Email', b.email ? `<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>` : '');
    t('Ditangani', esc(b.ditangani));
  }
  t('Dikirim', esc(tanggalJam(b.dibuat)));
  return `<dl class="rincian">${baris.join('')}</dl>`;
}

export const waIntl = (n) => String(n || '').replace(/[^\d+]/g, '').replace(/^\+/, '').replace(/^0/, '62');

export function liniTanggapan(daftar, { kosong = 'Belum ada pesan.' } = {}) {
  if (!daftar.length) return `<p class="petunjuk" style="color:var(--tinta-2)">${esc(kosong)}</p>`;
  return `<ol class="lini">${daftar
    .map((t) => `<li class="${t.oleh === 'admin' ? 'dari-admin' : ''}"><div class="lini-kepala"><b>${esc(t.nama)}</b><span>${esc(tanggalJam(t.dibuat))}</span></div><p>${esc(t.pesan)}</p></li>`)
    .join('')}</ol>`;
}

/** Bintang sebagai teks yang terbaca pembaca layar. */
export const bintangHtml = (n) => `<span class="bintang" role="img" aria-label="${n} dari 5 bintang">${Array.from({ length: 5 }, (_, i) => `<i class="${i < n ? 'isi' : ''}" aria-hidden="true">${ikon('star')}</i>`).join('')}</span>`;
