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
