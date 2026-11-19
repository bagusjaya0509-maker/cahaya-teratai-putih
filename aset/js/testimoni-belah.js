// Testimoni gaya "split": kutipan besar di kiri, foto unggahan pengirim di kanan.
// Klik area untuk testimoni berikutnya; titik di bawah untuk memilih langsung.
// Diadaptasi dari komponen React "split-testimonial" ke JavaScript biasa (situs ini tanpa React/Tailwind).
import { BASE, esc } from './inti.js';
import { htmlAnimasiTeratai, pakaiAnimasi } from './animasi-teratai.js';

const GERAK_PELAN = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const LAMBANG = `${BASE}aset/img/lambang-512.png`;

function ukuranKutipan(isi) {
  const n = isi.length;
  return n > 320 ? 'kecil' : n > 170 ? 'sedang' : '';
}

function isiSlide(t) {
  const peran = [t.kota, t.akunEmail].filter(Boolean);
  return {
    label: esc(t.tentang || 'Testimoni'),
    kutipan: esc(t.isi),
    ukuran: ukuranKutipan(t.isi || ''),
    penulis: `${t.akunFoto ? `<img class="belah-avatar" src="${esc(t.akunFoto)}" alt="" referrerpolicy="no-referrer" width="40" height="40">` : '<span class="belah-garis-nama" aria-hidden="true"></span>'}
      <div><p class="belah-nama">${esc(t.nama)}</p>${peran.length ? `<p class="belah-peran">${t.akunEmail ? `<svg class="ikon" aria-hidden="true"><use href="${BASE}aset/img/ikon.svg#i-badge-check"/></svg>` : ''}${esc(peran.join(' · '))}</p>` : ''}</div>`,
    gambar: pakaiAnimasi(t) ? htmlAnimasiTeratai() : t.foto
      ? `<img src="${esc(t.foto)}" alt="Foto dari ${esc(t.nama)}">`
      : `<div class="belah-tanpa-foto"><img src="${LAMBANG}" alt="" aria-hidden="true"><span>${esc((t.nama || '?').trim()[0].toUpperCase())}</span></div>`,
  };
}

export function pasangTestimoniBelah(wadah, daftar) {
  if (!wadah || !daftar.length) return;
  let aktif = 0;
  wadah.innerHTML = `
  <div class="belah" tabindex="0" role="group" aria-roledescription="carousel" aria-label="Suara umat: ulasan peserta dan penerima layanan">
    <div class="belah-kiri">
      <div class="belah-label" data-b="label"></div>
      <div class="belah-kutipan-wadah"><blockquote class="belah-kutipan" data-b="kutipan" aria-live="polite"></blockquote></div>
      <div class="belah-penulis" data-b="penulis"></div>
    </div>
    <div class="belah-kanan">
      <div class="belah-gambar" data-b="gambar"></div>
    </div>
    ${daftar.length > 1 ? `<div class="belah-navigasi">
      <button type="button" class="belah-arah" data-arah="-1" aria-label="Ulasan sebelumnya"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 7 7 17M16 17H7V8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Sebelumnya</span></button>
      <div class="belah-titik">${daftar.map((t, i) => `<button type="button" data-ke="${i}" aria-label="Ulasan ${i + 1} dari ${daftar.length}: ${esc(t.nama)}"><span></span></button>`).join('')}</div>
      <button type="button" class="belah-arah" data-arah="1" aria-label="Ulasan berikutnya"><span>Berikutnya</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    </div>` : ''}
  </div>`;
  const akar = wadah.querySelector('.belah');
  const el = (k) => akar.querySelector(`[data-b="${k}"]`);

  function isi(i) {
    const s = isiSlide(daftar[i]);
    el('label').innerHTML = `<span class="belah-garis" aria-hidden="true"></span>${s.label}`;
    el('kutipan').innerHTML = s.kutipan;
    el('kutipan').className = `belah-kutipan ${s.ukuran}`;
    el('penulis').innerHTML = s.penulis;
    el('gambar').innerHTML = s.gambar;
    // Panel foto hanya muncul bila pengirim mengunggah foto.
    akar.classList.toggle('tanpa-foto', !daftar[i].foto && !pakaiAnimasi(daftar[i]));
    akar.classList.toggle('akun-yayasan', pakaiAnimasi(daftar[i]));
    akar.querySelectorAll('[data-ke]').forEach((b, n) => b.setAttribute('aria-current', String(n === i)));
  }

  const main = (node, dari, ke, durasi, tunda = 0) => node.animate([dari, ke], { duration: durasi, delay: tunda, easing: EASE, fill: 'both' }).finished.catch(() => {});

  let sibuk = false;
  async function ke(i) {
    if (sibuk || i === aktif) return;
    aktif = (i + daftar.length) % daftar.length;
    if (GERAK_PELAN() || !el('kutipan').animate) { isi(aktif); return; }
    sibuk = true;
    await Promise.all([
      main(el('label'), { opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-10px)' }, 250),
      main(el('kutipan'), { opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-40px)' }, 350),
      main(el('penulis'), { opacity: 1 }, { opacity: 0 }, 250),
      main(el('gambar'), { opacity: 1, filter: 'blur(0px)', transform: 'scale(1)' }, { opacity: 0, filter: 'blur(20px)', transform: 'scale(0.95)' }, 350),
    ]);
    isi(aktif);
    main(el('label'), { opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }, 300);
    main(el('kutipan'), { opacity: 0, transform: 'translateY(40px)' }, { opacity: 1, transform: 'translateY(0)' }, 500);
    main(el('penulis'), { opacity: 0 }, { opacity: 1 }, 300, 200);
    await main(el('gambar'), { opacity: 0, filter: 'blur(20px)', transform: 'scale(1.05)' }, { opacity: 1, filter: 'blur(0px)', transform: 'scale(1)' }, 600);
    sibuk = false;
  }

  isi(0);
  if (daftar.length < 2) return;
  akar.addEventListener('click', (e) => {
    const t = e.target.closest('[data-ke]');
    if (t) { e.stopPropagation(); ke(Number(t.dataset.ke)); return; }
    const a = e.target.closest('[data-arah]');
    if (a) { e.stopPropagation(); ke(aktif + Number(a.dataset.arah)); return; }
    if (e.target.closest('a')) return;
    ke(aktif + 1);
  });
  akar.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); ke(aktif + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); ke(aktif - 1); }
  });
}
