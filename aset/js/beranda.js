import { $, $$, BASE, MODE } from './inti.js';
import { daftarKabar, daftarTestimoni } from './publik.js';
import { utamaKabar, barisKabar, slideKegiatan, slidePengumuman } from './kartu.js';
import { pasangTestimoniBelah } from './testimoni-belah.js';

const wadah = $('[data-kabar-portal]');

async function muatKabar() {
  try {
    // Kegiatan sudah punya slide Dokumentasi sendiri, jadi tidak diulang di Kabar (permintaan pemilik).
    const semua = (await daftarKabar({ batas: 20 })).filter((k) => k.kategori !== 'Kegiatan').slice(0, 6);
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
    pasangTestimoniBelah(tWadah, d.slice(0, 8));
  }).catch((e) => console.warn(e));
}

// Pilihan ajaran di bagian pengenalan: satu panel terbuka, panel lain menyempit.
const panel = $$('[data-pilih] .pilih-butir');
panel.forEach((butir) => {
  butir.addEventListener('click', () => {
    panel.forEach((p) => {
      p.classList.toggle('aktif', p === butir);
      p.setAttribute('aria-pressed', String(p === butir));
    });
  });
});

// Dokumentasi kegiatan: kabar berkategori Kegiatan tampil sebagai slide yang bisa dibuka.
// Layar sentuh menggeser sendiri, tombol untuk tetikus dan papan ketik.
const jalur = $('[data-geser-jalur]');
if (jalur) {
  const kendali = $('[data-geser-kendali]');
  const hitung = $('[data-geser-hitung]');
  const mundur = $('[data-geser-mundur]');
  const maju = $('[data-geser-maju]');
  const butir = () => [...jalur.children];
  const posisi = (i) => butir()[i].offsetLeft - butir()[0].offsetLeft;
  const kini = () => {
    if (jalur.scrollLeft + jalur.clientWidth >= jalur.scrollWidth - 2) return butir().length - 1;
    return butir().reduce((dekat, _, i) => (Math.abs(posisi(i) - jalur.scrollLeft) < Math.abs(posisi(dekat) - jalur.scrollLeft) ? i : dekat), 0);
  };
  const perbarui = () => {
    const i = kini();
    hitung.textContent = `${i + 1} / ${butir().length}`;
    mundur.disabled = i === 0;
    maju.disabled = i === butir().length - 1;
    kendali.hidden = jalur.scrollWidth <= jalur.clientWidth + 2;
  };
  const halus = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ke = (i) => jalur.scrollTo({ left: posisi(i), behavior: halus ? 'smooth' : 'auto' });
  mundur.addEventListener('click', () => ke(kini() - 1));
  maju.addEventListener('click', () => ke(kini() + 1));
  jalur.addEventListener('scroll', perbarui, { passive: true });
  jalur.addEventListener('load', perbarui, true);
  addEventListener('resize', perbarui);
  perbarui();
  daftarKabar({ kategori: 'Kegiatan', batas: 12 })
    .then((d) => {
      const ada = d.filter((k) => k.sampulKecil);
      if (!ada.length) return;
      jalur.innerHTML = ada.map(slideKegiatan).join('');
      perbarui();
    })
    .catch((e) => console.warn(e));
}


// Papan pengumuman utama di pembuka beranda: kabar berkategori Pengumuman, yang ditandai
// unggulan didahulukan. Berganti sendiri tiap 2 detik (permintaan pemilik), berhenti saat difokus,
// dan tidak bergerak sendiri bila pengunjung memilih gerak dikurangi.
const papan = $('[data-papan]');
if (papan) {
  daftarKabar({ kategori: 'Pengumuman', batas: 8 })
    .then((d) => {
      const ada = d.filter((k) => k.judul).sort((a, b) => (b.unggulan ? 1 : 0) - (a.unggulan ? 1 : 0)).slice(0, 6);
      if (!ada.length) return;
      const jalurP = $('[data-papan-jalur]', papan);
      const titik = $('[data-papan-titik]', papan);
            const n = ada.length;
      jalurP.innerHTML = ada.map((k, i) => slidePengumuman(k, i, n)).join('');
      titik.innerHTML = n > 1 ? ada.map((k, i) => `<button type="button" aria-label="Tampilkan pengumuman ${i + 1}"></button>`).join('') : '';
      papan.classList.toggle('papan-tunggal', n < 2);
      papan.hidden = false;
      const slide = () => [...jalurP.children];
      const halusP = !matchMedia('(prefers-reduced-motion: reduce)').matches;
      let aktif = 0;
      const tandai = (i) => {
        aktif = i;
        slide().forEach((s, j) => (j === i ? s.removeAttribute('tabindex') : s.setAttribute('tabindex', '-1')));
        [...titik.children].forEach((b, j) => b.setAttribute('aria-current', j === i ? 'true' : 'false'));
      };
      const ke = (i) => {
        const j = (i + n) % n;
        jalurP.scrollTo({ left: slide()[j].offsetLeft - slide()[0].offsetLeft, behavior: halusP ? 'smooth' : 'auto' });
        tandai(j);
      };
      $('[data-papan-mundur]', papan).addEventListener('click', () => { ke(aktif - 1); mulai(); });
      $('[data-papan-maju]', papan).addEventListener('click', () => { ke(aktif + 1); mulai(); });
      titik.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (b) { ke([...titik.children].indexOf(b)); mulai(); }
      });
      let tunda;
      jalurP.addEventListener('scroll', () => {
        clearTimeout(tunda);
        tunda = setTimeout(() => {
          const i = Math.round(jalurP.scrollLeft / jalurP.clientWidth);
          if (i !== aktif && i >= 0 && i < n) tandai(i);
        }, 90);
      }, { passive: true });
      addEventListener('resize', () => jalurP.scrollTo({ left: slide()[aktif].offsetLeft - slide()[0].offsetLeft }));
      // putar otomatis
      let jam = null;
      let diam = false;
      const henti = () => { clearInterval(jam); jam = null; };
      function mulai() {
        henti();
        if (n > 1 && halusP && !diam && !document.hidden) jam = setInterval(() => ke(aktif + 1), 2000);
      }
      papan.addEventListener('focusin', (e) => { if (e.target.matches(':focus-visible')) { diam = true; henti(); } });
      papan.addEventListener('focusout', (e) => { if (!papan.contains(e.relatedTarget)) { diam = false; mulai(); } });
      document.addEventListener('visibilitychange', mulai);
      tandai(0);
      mulai();
    })
    .catch((e) => console.warn(e));
}
