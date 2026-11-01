// Halaman baca kabar. Kabar yang sudah ikut build datang sebagai HTML statis;
// kabar yang baru terbit (belum ikut build) dibuka lewat 404.html dan
// dirender di sini dari Firestore.
import { $, BASE, roti } from './inti.js';
import { ambilKabar, daftarKabar } from './publik.js';
import { susunArtikel } from './artikel.js';
import { kartuKabar } from './kartu.js';

const utama = $('main.baca');
const artikel = $('#artikel');
const tak = $('#tak-ditemukan');

function pasangBagikan() {
  const url = location.origin + location.pathname;
  $('[data-salin-tautan]')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      roti('Tautan disalin.', 'berhasil');
    } catch {
      prompt('Salin tautan ini:', url);
    }
  });
  if (navigator.share) {
    const t = $('[data-bagikan]');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tombol tombol-utama kecil';
    b.textContent = 'Bagikan…';
    b.addEventListener('click', () => navigator.share({ title: document.title, url }).catch(() => {}));
    t?.prepend(b);
  }
}

async function kabarLain(slugIni) {
  try {
    const daftar = (await daftarKabar({ batas: 4 })).filter((k) => k.id !== slugIni).slice(0, 3);
    if (!daftar.length) return;
    $('[data-kabar-lain]').innerHTML = daftar.map(kartuKabar).join('');
    $('#kabar-lain').hidden = false;
  } catch { /* bagian tambahan, abaikan */ }
}

function tampilTakDitemukan() {
  artikel.hidden = true;
  tak.hidden = false;
  document.title = 'Halaman tidak ditemukan — Yayasan Cahaya Teratai Putih';
}

async function renderDariData(slug) {
  artikel.innerHTML = `<div aria-busy="true"><div class="kerangka" style="height:14px;width:30%"></div><div class="kerangka" style="height:44px;width:90%;margin-top:18px"></div><div class="kerangka" style="height:44px;width:70%;margin-top:10px"></div><div class="kerangka" style="aspect-ratio:16/9;margin-top:32px"></div></div>`;
  try {
    const data = await ambilKabar(slug);
    if (!data) return tampilTakDitemukan();
    artikel.innerHTML = susunArtikel({ ...data, base: BASE, urlHalaman: location.origin + location.pathname });
    document.title = `${data.kabar.judul} — Yayasan Cahaya Teratai Putih`;
    $('meta[name="description"]')?.setAttribute('content', data.kabar.ringkasan || '');
    $('meta[name="robots"]')?.setAttribute('content', 'index,follow');
    pasangBagikan();
    kabarLain(slug);
  } catch (e) {
    console.error(e);
    artikel.innerHTML = `<div class="kosong"><h3>Kabar belum bisa dimuat</h3><p>Periksa koneksi internet, lalu muat ulang halaman ini.</p></div>`;
  }
}

if (utama.dataset.prerender === '1') {
  pasangBagikan();
  kabarLain(utama.dataset.slug);
} else {
  const m = location.pathname.slice(BASE.length - 1).match(/^\/kabar\/([a-z0-9-]{1,90})\/?$/);
  if (m) renderDariData(m[1]);
  else tampilTakDitemukan();
}
