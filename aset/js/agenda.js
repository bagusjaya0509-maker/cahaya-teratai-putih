// Agenda kegiatan otomatis: jadwal rutin mingguan (mis. meditasi Sabtu 20.00 WITA)
// dihitung sendiri untuk minggu-minggu berikutnya, digabung dengan agenda khusus
// (mis. meditasi outdoor) dari panel pengurus > Jadwal & produk.
import { esc, ikon } from './inti.js';
import { ambilPengaturan } from './publik.js';

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const WITA = 8 * 3600e3;

/** Waktu WITA (ms epoch) dari tanggal yyyy-mm-dd dan jam "20.00". */
function waktu(tgl, jam) {
  const [y, m, d] = tgl.split('-').map(Number);
  const [h, mn] = String(jam || '00.00').replace(':', '.').split('.').map((x) => Number(x) || 0);
  return Date.UTC(y, m - 1, d, h, mn) - WITA;
}
const tglWita = (ms) => new Date(ms + WITA).toISOString().slice(0, 10);

/** Daftar acara berikutnya, terurut. */
export function susunAgenda(p, { sekarang = Date.now(), batas = 5, rentangHari = 42 } = {}) {
  const acara = [];
  const hariIni = tglWita(sekarang);
  for (const r of p.agendaRutin || []) {
    if (!r.judul) continue;
    for (let i = 0; i <= rentangHari; i++) {
      const tgl = tglWita(sekarang + i * 86400e3);
      const [y, m, d] = tgl.split('-').map(Number);
      if (new Date(Date.UTC(y, m - 1, d)).getUTCDay() !== Number(r.hari)) continue;
      acara.push({ ...r, tanggal: tgl, mulai: waktu(tgl, r.jam), rutin: true });
    }
  }
  for (const k of p.agendaKhusus || []) {
    if (k.judul && k.tanggal && k.tanggal >= hariIni) acara.push({ ...k, mulai: waktu(k.tanggal, k.jam), rutin: false });
  }
  // acara yang sudah lewat lebih dari 3 jam tidak ditampilkan
  return acara.filter((a) => a.mulai > sekarang - 3 * 3600e3).sort((a, b) => a.mulai - b.mulai).slice(0, batas);
}

function label(a, sekarang) {
  const selisih = Math.round((Date.parse(a.tanggal) - Date.parse(tglWita(sekarang))) / 86400e3);
  if (a.mulai <= sekarang) return 'Sedang berlangsung';
  if (selisih === 0) return 'Hari ini';
  if (selisih === 1) return 'Besok';
  return `${selisih} hari lagi`;
}

export function htmlAgenda(daftar, sekarang = Date.now()) {
  if (!daftar.length) return '<p class="catatan-kecil">Belum ada agenda terdekat.</p>';
  return `<ol class="agenda-garis">${daftar.map((a, i) => {
    const [y, m, d] = a.tanggal.split('-').map(Number);
    const hari = HARI[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
    const isi = `<span class="agenda-tgl"><b>${d}</b>${BULAN[m - 1]}</span>
      <span class="agenda-isi">
        <span class="agenda-label${i === 0 ? ' pertama' : ''}${a.rutin ? '' : ' khusus'}">${esc(label(a, sekarang))}${a.rutin ? ' · rutin' : ''}</span>
        <b class="agenda-judul">${esc(a.judul)}</b>
        <span class="agenda-meta">${ikon('clock')}${esc(hari)}, pukul ${esc(a.jam || '-')} WITA</span>
        ${a.tempat ? `<span class="agenda-meta">${ikon('map-pin')}${esc(a.tempat)}</span>` : ''}
        ${a.ket ? `<span class="agenda-ket">${esc(a.ket)}</span>` : ''}
      </span>`;
    return `<li>${a.tautan ? `<a class="agenda-butir" href="${esc(a.tautan)}">${isi}</a>` : `<div class="agenda-butir">${isi}</div>`}</li>`;
  }).join('')}</ol>`;
}

/** Isi setiap [data-agenda] di halaman. */
export async function pasangAgenda() {
  const wadah = [...document.querySelectorAll('[data-agenda]')];
  if (!wadah.length) return;
  try {
    const p = await ambilPengaturan();
    for (const w of wadah) w.innerHTML = htmlAgenda(susunAgenda(p, { batas: Number(w.dataset.agenda) || 5 }));
  } catch {
    wadah.forEach((w) => { w.innerHTML = '<p class="catatan-kecil">Agenda belum dapat dimuat.</p>'; });
  }
}
