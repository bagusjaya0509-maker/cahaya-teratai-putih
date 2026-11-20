// Lonceng hari raya di panel pengurus: hari raya semua agama + hari besar nasional yang
// terdekat (supaya ucapan disiapkan tepat waktu) + kalender bulanan. Hanya tampil di panel.
import { $, esc, ikon, roti } from './inti.js';
import { hariIni } from './rujukan.js';
import { HARI_RAYA, HARI_BESAR } from './hari-raya.js';

const AGAMA = { hindu: 'Hindu', islam: 'Islam', kristiani: 'Kristen & Katolik', buddha: 'Buddha', konghucu: 'Konghucu', nasional: 'Nasional' };
const KECIL_LAIN = new Set(['Minggu Palma', 'Kamis Putih']);

const RAYA = new Set(['Nyepi', 'Galungan', 'Kuningan', 'Saraswati', 'Pagerwesi', 'Siwaratri']);
function jenis(n) {
  if (RAYA.has(n)) return 'raya';
  if (/^(Tumpek|Banyu Pinaruh|Tawur)/.test(n)) return 'rahina';
  if (n.startsWith('Purnama')) return 'purnama';
  if (n.startsWith('Tilem')) return 'tilem';
  if (/^(Kajeng Kliwon|Anggara Kasih|Buda Cemeng)$/.test(n)) return 'rutin';
  return 'rangkaian';
}
// Yang biasanya dibuatkan ucapan. Rangkaian (Penampahan, Sugihan, dst.) & rahina rutin hanya di kalender.
const PENTING = new Set(['raya', 'besar', 'rahina', 'purnama', 'tilem']);
const URUT = { raya: 0, besar: 0, rahina: 1, purnama: 2, tilem: 2, rangkaian: 3, rutin: 4 };
const DATA = [
  ...HARI_RAYA.map(([t, n, p, s]) => ({ t, n, p, s, j: jenis(n), ag: 'hindu', k: `${t}|${n}` })),
  ...HARI_BESAR.map(([t, n, ag, ket]) => ({ t, n, p: ket, s: '', j: KECIL_LAIN.has(n) ? 'rangkaian' : 'besar', ag, k: `${t}|${n}` })),
].sort((a, b) => a.t.localeCompare(b.t) || URUT[a.j] - URUT[b.j]);
const PER_TANGGAL = new Map();
for (const r of DATA) (PER_TANGGAL.get(r.t) || PER_TANGGAL.set(r.t, []).get(r.t)).push(r);
for (const d of PER_TANGGAL.values()) d.sort((a, b) => URUT[a.j] - URUT[b.j]);
const AKHIR_DATA = DATA.at(-1)?.t || '';

const JENDELA = 7; // hari ke depan yang dihitung di angka lonceng
const RENTANG = 45; // hari ke depan yang tampil di daftar

// Tanda "ucapan sudah dibuat" disimpan per peramban pengurus.
const KUNCI = 'ctp.ucapanSelesai';
let selesai = new Set();
try { selesai = new Set(JSON.parse(localStorage.getItem(KUNCI) || '[]')); } catch { /* tanpa penyimpanan */ }
function tandai(k, ya) {
  ya ? selesai.add(k) : selesai.delete(k);
  try { localStorage.setItem(KUNCI, JSON.stringify([...selesai].filter((x) => x.slice(0, 10) >= hariIni(-60)))); } catch { /* abaikan */ }
}

const selisih = (t, dari = hariIni()) => Math.round((Date.parse(t) - Date.parse(dari)) / 864e5);
const tgl = (t) => new Date(`${t}T12:00:00Z`);
const fHari = new Intl.DateTimeFormat('id-ID', { weekday: 'short', timeZone: 'UTC' });
const fBulan = new Intl.DateTimeFormat('id-ID', { month: 'short', timeZone: 'UTC' });
const fBulanTahun = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const fPanjang = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const hitungMundur = (n) => (n === 0 ? 'Hari ini' : n === 1 ? 'Besok' : `${n} hari lagi`);
const BULAN_GLIF = { purnama: '<span class="hr-bulan hr-purnama" aria-hidden="true"></span>', tilem: '<span class="hr-bulan hr-tilem" aria-hidden="true"></span>' };

function mendatang(rentang = RENTANG) {
  const kini = hariIni();
  return DATA.filter((r) => PENTING.has(r.j) && r.t >= kini && selisih(r.t, kini) <= rentang);
}

// ----------------------------------------------------------------------
// lonceng
// ----------------------------------------------------------------------
let bukaModalFn = null;

function perbaruiAngka() {
  const n = mendatang(JENDELA).filter((r) => !selesai.has(r.k)).length;
  const el = $('[data-lonceng-angka]');
  el.textContent = n;
  el.hidden = !n;
  $('[data-lonceng-tombol]').setAttribute('aria-label', n ? `Hari raya mendatang, ${n} perlu ucapan` : 'Hari raya mendatang');
}

function barisAcara(r) {
  const sudah = selesai.has(r.k);
  return `<li class="hr-acara" data-jenis="${r.j}" data-agama="${r.ag}" ${sudah ? 'data-selesai' : ''}>
    <div><b>${BULAN_GLIF[r.j] || ''}${esc(r.n)}</b><small><span class="hr-agama">${AGAMA[r.ag]}</span>${esc(r.p)}${r.s ? ` · ${esc(r.s)}` : ''}</small></div>
    <button type="button" class="hr-cek" data-cek="${esc(r.k)}" aria-pressed="${sudah}" title="${sudah ? 'Tandai belum dibuat' : 'Tandai ucapan sudah dibuat'}">${ikon('check')}<span>${sudah ? 'Ucapan siap' : 'Tandai siap'}</span></button>
  </li>`;
}

function isiPanel() {
  const daftar = mendatang();
  const grup = new Map();
  for (const r of daftar) (grup.get(r.t) || grup.set(r.t, []).get(r.t)).push(r);
  const kini = hariIni();
  const habis = AKHIR_DATA && selisih(AKHIR_DATA, kini) < 60;
  $('[data-lonceng-panel]').innerHTML = `
    <div class="hr-kepala"><h2>Hari raya mendatang</h2><small>${RENTANG} hari ke depan · tandai setelah ucapannya dibuat</small></div>
    ${grup.size ? `<ol class="hr-daftar">${[...grup].map(([t, acara]) => {
      const n = selisih(t, kini);
      const d = tgl(t);
      return `<li class="hr-hari${n <= 1 ? ' hr-dekat' : ''}">
        <div class="hr-tanggal"><span>${fHari.format(d)}</span><b>${d.getUTCDate()}</b><span>${fBulan.format(d)}</span></div>
        <div class="hr-isi"><span class="hr-mundur">${hitungMundur(n)}</span><ul>${acara.map(barisAcara).join('')}</ul></div>
      </li>`;
    }).join('')}</ol>` : '<p class="hr-kosong">Tidak ada hari raya dalam 45 hari ke depan.</p>'}
    ${habis ? `<p class="pesan pesan-peringatan hr-habis">Data kalender hanya sampai ${esc(fPanjang.format(tgl(AKHIR_DATA)))}. Perbarui dengan administrasi/kalender/buat-hari-raya.py.</p>` : ''}
    <div class="hr-kaki"><button type="button" class="tombol tombol-garis kecil" data-buka-kalender>${ikon('calendar')}Buka kalender</button></div>`;
}

function bukaPanel(buka) {
  const panel = $('[data-lonceng-panel]');
  const tombol = $('[data-lonceng-tombol]');
  if (buka) isiPanel();
  panel.hidden = !buka;
  tombol.setAttribute('aria-expanded', String(buka));
}

// ----------------------------------------------------------------------
// kalender bulanan (modal)
// ----------------------------------------------------------------------
let bulanTampil = hariIni().slice(0, 7);
let hariPilih = hariIni();

function geserBulan(ym, n) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

let saring = 'semua';
const acaraHari = (t) => (PER_TANGGAL.get(t) || []).filter((r) => saring === 'semua' || r.ag === saring);

function rincianHari(t) {
  const acara = acaraHari(t);
  return `<h3>${esc(fPanjang.format(tgl(t)))}</h3>${acara.length
    ? `<ul class="hr-rinci">${acara.map((r) => PENTING.has(r.j) ? barisAcara(r) : `<li class="hr-acara" data-jenis="${r.j}" data-agama="${r.ag}"><div><b>${esc(r.n)}</b><small><span class="hr-agama">${AGAMA[r.ag]}</span>${esc(r.p)}${r.s ? ` · ${esc(r.s)}` : ''}</small></div><span class="hr-jenis">${r.j === 'rutin' ? 'Rahina rutin' : 'Rangkaian'}</span></li>`).join('')}</ul>`
    : '<p class="hr-kosong">Tidak ada hari raya pada tanggal ini.</p>'}`;
}

function isiKalender(wadah) {
  const [y, m] = bulanTampil.split('-').map(Number);
  const pertama = new Date(Date.UTC(y, m - 1, 1));
  const jumlahHari = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const kini = hariIni();
  const sel = [];
  for (let i = 0; i < pertama.getUTCDay(); i++) sel.push('<span class="hr-sel hr-kosong-sel" aria-hidden="true"></span>');
  for (let h = 1; h <= jumlahHari; h++) {
    const t = `${bulanTampil}-${String(h).padStart(2, '0')}`;
    const acara = acaraHari(t);
    const penting = acara.filter((r) => PENTING.has(r.j));
    const bulan = acara.find((r) => r.j === 'purnama' || r.j === 'tilem');
    const raya = acara.some((r) => r.j === 'raya' || (r.j === 'besar' && r.ag !== 'nasional'));
    const label = acara.map((r) => r.n).join(', ');
    const tampil = penting.filter((r) => r.j !== 'purnama' && r.j !== 'tilem').slice(0, 2);
    const lain = acara.length - tampil.length - (bulan ? 1 : 0);
    sel.push(`<button type="button" class="hr-sel${raya ? ' hr-sel-raya' : ''}${t === kini ? ' hr-sel-kini' : ''}" data-hari="${t}" aria-pressed="${t === hariPilih}" aria-label="${h}${label ? `: ${esc(label)}` : ''}">
      <span class="hr-angka">${h}${bulan ? BULAN_GLIF[bulan.j] : ''}</span>
      ${tampil.map((r) => `<span class="hr-label" data-jenis="${r.j}" data-agama="${r.ag}">${esc(r.n)}</span>`).join('')}
      ${lain > 0 ? `<span class="hr-titik" title="${lain} lainnya">${'•'.repeat(Math.min(lain, 3))}</span>` : ''}
    </button>`);
  }
  const awalData = DATA[0]?.t.slice(0, 7);
  const akhirData = AKHIR_DATA.slice(0, 7);
  wadah.innerHTML = `
    <div class="hr-kal-atas">
      <button type="button" class="tombol-ikon" data-geser="-1" aria-label="Bulan sebelumnya" ${bulanTampil <= awalData ? 'disabled' : ''}>${ikon('chevron-left')}</button>
      <h3>${esc(fBulanTahun.format(pertama))}</h3>
      <button type="button" class="tombol-ikon" data-geser="1" aria-label="Bulan berikutnya" ${bulanTampil >= akhirData ? 'disabled' : ''}>${ikon('chevron-right')}</button>
      ${bulanTampil !== kini.slice(0, 7) ? '<button type="button" class="tombol tombol-garis kecil" data-ke-kini>Hari ini</button>' : ''}
    </div>
    <div class="hr-saring" role="group" aria-label="Tampilkan agama">
      ${[['semua', 'Semua'], ...Object.entries(AGAMA)].map(([k, v]) => `<button type="button" data-saring="${k}" data-agama="${k}" aria-pressed="${saring === k}">${k === 'semua' ? '' : '<i></i>'}${v}</button>`).join('')}
    </div>
    <div class="hr-kisi" role="group" aria-label="Kalender ${esc(fBulanTahun.format(pertama))}">
      ${['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => `<span class="hr-nama-hari" aria-hidden="true">${d}</span>`).join('')}
      ${sel.join('')}
    </div>
    <div class="hr-legenda">
      <span>${BULAN_GLIF.purnama}Purnama</span>
      <span>${BULAN_GLIF.tilem}Tilem</span>
      <span><b class="hr-titik">•</b>Rangkaian &amp; rahina rutin (lihat dengan klik tanggal)</span>
    </div>
    <div class="hr-rincian" data-rincian aria-live="polite">${hariPilih.startsWith(bulanTampil) ? rincianHari(hariPilih) : ''}</div>`;
}

function bukaKalender() {
  bukaPanel(false);
  bulanTampil = hariIni().slice(0, 7);
  hariPilih = hariIni();
  const modal = bukaModalFn('Kalender hari raya', '<div class="hr-kalender" data-kalender></div>', '', 820);
  const wadah = $('[data-kalender]', modal);
  isiKalender(wadah);
  wadah.addEventListener('click', (e) => {
    const g = e.target.closest('[data-geser]');
    if (g) { bulanTampil = geserBulan(bulanTampil, Number(g.dataset.geser)); return isiKalender(wadah); }
    const s = e.target.closest('[data-saring]');
    if (s) { saring = s.dataset.saring; return isiKalender(wadah); }
    if (e.target.closest('[data-ke-kini]')) { bulanTampil = hariIni().slice(0, 7); hariPilih = hariIni(); return isiKalender(wadah); }
    const h = e.target.closest('[data-hari]');
    if (h) {
      hariPilih = h.dataset.hari;
      wadah.querySelectorAll('[data-hari]').forEach((b) => b.setAttribute('aria-pressed', String(b === h)));
      const rinci = $('[data-rincian]', wadah);
      rinci.innerHTML = rincianHari(hariPilih);
      rinci.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      return;
    }
    const c = e.target.closest('[data-cek]');
    if (c) { tandai(c.dataset.cek, c.getAttribute('aria-pressed') !== 'true'); $('[data-rincian]', wadah).innerHTML = rincianHari(hariPilih); perbaruiAngka(); }
  });
}

// ----------------------------------------------------------------------
export function pasangLonceng({ bukaModal }) {
  bukaModalFn = bukaModal;
  const wadah = $('[data-lonceng]');
  if (!wadah) return;
  wadah.hidden = false;
  perbaruiAngka();
  $('[data-lonceng-tombol]').addEventListener('click', () => bukaPanel($('[data-lonceng-panel]').hidden));
  $('[data-lonceng-panel]').addEventListener('click', (e) => {
    const c = e.target.closest('[data-cek]');
    if (c) { tandai(c.dataset.cek, c.getAttribute('aria-pressed') !== 'true'); isiPanel(); perbaruiAngka(); return; }
    if (e.target.closest('[data-buka-kalender]')) bukaKalender();
  });
  // composedPath: tombol "Tandai siap" sudah diganti isiPanel() saat klik sampai ke document.
  document.addEventListener('click', (e) => { if (!e.composedPath().includes(wadah)) bukaPanel(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('[data-lonceng-panel]').hidden) { bukaPanel(false); $('[data-lonceng-tombol]').focus(); }
  });

  // Pengingat sekali per sesi untuk hari raya utama yang tinggal 3 hari dan ucapannya belum siap.
  try {
    const dekat = mendatang(3).find((r) => (r.j === 'raya' || (r.j === 'besar' && r.ag !== 'nasional')) && !selesai.has(r.k));
    if (dekat && sessionStorage.getItem('ctp.ingatHariRaya') !== dekat.k) {
      sessionStorage.setItem('ctp.ingatHariRaya', dekat.k);
      roti(`${dekat.n} ${hitungMundur(selisih(dekat.t)).toLowerCase()}. Ucapannya sudah disiapkan?`);
    }
  } catch { /* abaikan */ }
}
