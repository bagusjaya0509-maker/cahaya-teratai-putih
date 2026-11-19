// Halaman "Semua testimoni": kolom-kolom kartu yang bergulir pelan tanpa henti (melambat saat disorot),
// ujung atas-bawah memudar. Diadaptasi dari komponen React "testimonials-6" ke JavaScript biasa.
import { BASE, esc } from './inti.js';
import { bintangHtml } from './booking-tampil.js';
import { htmlAnimasiTeratai, pakaiAnimasi } from './animasi-teratai.js';

const GERAK_PELAN = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const KECEPATAN = [30, 50, 35]; // detik per putaran, sama dengan versi asli
const TINGGI = 640;

export function kartuKolom(t) {
  const peran = [t.kota, t.tentang].filter(Boolean).join(' · ');
  const avatar = t.akunFoto
    ? `<img class="kolom-avatar" src="${esc(t.akunFoto)}" alt="Foto profil ${esc(t.nama)}" referrerpolicy="no-referrer" loading="lazy" width="36" height="36">`
    : `<span class="kolom-avatar kolom-inisial" aria-hidden="true">${esc((t.nama || '?').trim()[0].toUpperCase())}</span>`;
  return `<figure class="kartu-kolom">
  ${pakaiAnimasi(t) ? `<div class="kolom-foto">${htmlAnimasiTeratai()}</div>` : t.foto ? `<img class="kolom-foto" src="${esc(t.foto)}" alt="Foto dari ${esc(t.nama)}" loading="lazy" decoding="async">` : ''}
  ${bintangHtml(t.bintang)}
  <blockquote>${esc(t.isi)}</blockquote>
  <figcaption>${avatar}<div><cite>${esc(t.nama)}</cite>${t.akunEmail ? `<span class="kolom-email"><svg class="ikon" aria-hidden="true"><use href="${BASE}aset/img/ikon.svg#i-badge-check"/></svg>${esc(t.akunEmail)}</span>` : ''}<span>${esc(peran)}</span></div></figcaption>
</figure>`;
}

const jumlahKolom = () => (innerWidth >= 1024 ? 3 : innerWidth >= 768 ? 2 : 1);

let pasangKini = null;
export function pasangTestimoniKolom(wadah, daftar) {
  if (!wadah) return;
  let n = 0;
  const animasi = [];
  function susun() {
    const kini = Math.min(jumlahKolom(), daftar.length);
    if (kini === n && wadah.childElementCount) return;
    n = kini;
    animasi.splice(0).forEach((a) => a.cancel());
    const kolom = Array.from({ length: n }, () => []);
    daftar.forEach((t, i) => kolom[i % n].push(t));
    wadah.className = 'kolom-testimoni';
    wadah.innerHTML = kolom.map(() => '<div class="kolom-jalur"><div class="kolom-isi"></div></div>').join('');
    const diam = GERAK_PELAN();
    [...wadah.children].forEach((jalur, k) => {
      const isi = jalur.firstElementChild;
      const html = kolom[k].map(kartuKolom).join('');
      isi.innerHTML = html;
      if (diam || daftar.length < 4) return; // sedikit testimoni: tampil diam agar tidak berulang-ulang
      // Ulangi kartu sampai lebih tinggi dari wadah, lalu gandakan agar putaran mulus (-50%).
      let ulang = 1;
      while (isi.scrollHeight < TINGGI && ulang < 8) { isi.insertAdjacentHTML('beforeend', html); ulang++; }
      if (isi.scrollHeight < TINGGI * 0.6) return; // terlalu sedikit untuk bergulir
      isi.insertAdjacentHTML('beforeend', isi.innerHTML.replace(/<figure /g, '<figure aria-hidden="true" '));
      const a = isi.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-50%)' }],
        { duration: KECEPATAN[k % 3] * 1000 * Math.max(1, kolom[k].length / 3) * ulang, iterations: Infinity, easing: 'linear' });
      animasi.push(a);
      jalur.addEventListener('mouseenter', () => { a.playbackRate = 0.5; });
      jalur.addEventListener('mouseleave', () => { a.playbackRate = 1; });
      jalur.classList.add('bergulir');
    });
  }
  if (pasangKini) removeEventListener('resize', pasangKini);
  let tunda;
  pasangKini = () => { clearTimeout(tunda); tunda = setTimeout(susun, 200); };
  addEventListener('resize', pasangKini);
  susun();
}
