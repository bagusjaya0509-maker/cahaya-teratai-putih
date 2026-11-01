import { $, BASE, MODE } from './inti.js';
import { daftarKabar, daftarTestimoni } from './publik.js';
import { utamaKabar, barisKabar } from './kartu.js';
import { kartuTestimoni } from './testimoni.js';

const wadah = $('[data-kabar-portal]');

async function muatKabar() {
  try {
    const semua = await daftarKabar({ batas: 6 });
    wadah.removeAttribute('aria-busy');
    if (!semua.length) {
      wadah.outerHTML = `<div class="kosong"><h3>Kabar pertama sedang disiapkan</h3><p>Kegiatan yayasan yang diterbitkan pengurus akan tampil di sini.</p></div>`;
      return;
    }
    const iUtama = Math.max(0, semua.findIndex((k) => k.unggulan));
    const [utama] = semua.splice(iUtama, 1);
    wadah.innerHTML = `${utamaKabar(utama)}${semua.length ? `<ul class="kabar-daftar">${semua.slice(0, 4).map(barisKabar).join('')}</ul>` : ''}`;
  } catch (e) {
    console.error(e);
    wadah.removeAttribute('aria-busy');
    wadah.innerHTML = `<div class="kosong" style="grid-column:1/-1"><h3>Kabar belum bisa dimuat</h3><p>Periksa koneksi internet lalu muat ulang halaman. Kabar juga bisa dibaca di <a href="${BASE}kabar/">halaman kabar</a>.</p></div>`;
  }
}
muatKabar();

// Testimoni tampil hanya bila sudah ada; sebelum itu bagiannya berupa ajakan menulis.
const tWadah = $('[data-testimoni-beranda]');
if (tWadah && MODE !== 'mati') {
  daftarTestimoni().then((d) => {
    if (!d.length) return;
    tWadah.innerHTML = d.slice(0, 3).map(kartuTestimoni).join('');
    tWadah.classList.add('kisi-testimoni');
  }).catch((e) => console.warn(e));
}

// Dokumentasi kegiatan: layar sentuh menggeser sendiri, tombol untuk tetikus dan papan ketik.
const jalur = $('[data-geser-jalur]');
if (jalur) {
  const foto = [...jalur.children];
  const hitung = $('[data-geser-hitung]');
  const mundur = $('[data-geser-mundur]');
  const maju = $('[data-geser-maju]');
  const posisi = (i) => foto[i].offsetLeft - foto[0].offsetLeft;
  const kini = () => {
    if (jalur.scrollLeft + jalur.clientWidth >= jalur.scrollWidth - 2) return foto.length - 1;
    return foto.reduce((dekat, _, i) => (Math.abs(posisi(i) - jalur.scrollLeft) < Math.abs(posisi(dekat) - jalur.scrollLeft) ? i : dekat), 0);
  };
  const perbarui = () => {
    const i = kini();
    hitung.textContent = `${i + 1} / ${foto.length}`;
    mundur.disabled = i === 0;
    maju.disabled = i === foto.length - 1;
  };
  const halus = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ke = (i) => jalur.scrollTo({ left: posisi(i), behavior: halus ? 'smooth' : 'auto' });
  mundur.addEventListener('click', () => ke(kini() - 1));
  maju.addEventListener('click', () => ke(kini() + 1));
  jalur.addEventListener('scroll', perbarui, { passive: true });
  addEventListener('resize', perbarui);
  $('[data-geser-kendali]').hidden = false;
  perbarui();
}
