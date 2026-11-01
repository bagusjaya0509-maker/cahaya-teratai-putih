// Susunan HTML satu kabar. Dipakai build (halaman statis per kabar) dan
// peramban (kabar yang belum ikut build), supaya hasilnya selalu sama.
import { esc, deltaKeHtml, lamaBaca, tanggalPanjang } from './isi.js';

export function susunArtikel({ kabar, isi, base, urlHalaman = '', gantiGambar, sampul, sprite = `${base}aset/img/ikon.svg` }) {
  const kat = kabar.kategori || 'Kabar';
  const iso = kabar.terbitPada ? new Date(kabar.terbitPada).toISOString() : '';
  const gambarSampul = sampul ?? isi?.sampul ?? '';
  const badan = deltaKeHtml(isi?.delta || '[]', { gantiGambar });
  const bagikan = encodeURIComponent(urlHalaman);
  const teksBagikan = encodeURIComponent(kabar.judul || '');
  return `
<header class="baca-kepala">
  <nav class="remah" aria-label="Remah roti">
    <a href="${base}">Beranda</a><span aria-hidden="true">/</span>
    <a href="${base}kabar/">Kabar</a><span aria-hidden="true">/</span>
    <a href="${base}kabar/?kategori=${encodeURIComponent(kat)}">${esc(kat)}</a>
  </nav>
  <h1 class="baca-judul">${esc(kabar.judul)}</h1>
  ${kabar.ringkasan ? `<p class="baca-ringkasan">${esc(kabar.ringkasan)}</p>` : ''}
  <div class="baca-meta">
    ${kabar.penulis ? `<span>${esc(kabar.penulis)}</span>` : ''}
    ${iso ? `<time datetime="${iso}">${tanggalPanjang(kabar.terbitPada)}</time>` : ''}
    <span>${lamaBaca(isi?.delta || '[]')} menit baca</span>
  </div>
</header>
${gambarSampul ? `<figure class="baca-sampul"><img src="${esc(gambarSampul)}" alt="${esc(isi?.keteranganSampul || kabar.judul)}" width="1200" height="675" fetchpriority="high">${isi?.keteranganSampul ? `<figcaption>${esc(isi.keteranganSampul)}</figcaption>` : ''}</figure>` : ''}
<div class="prosa">
${badan || '<p>Isi kabar ini belum tersedia.</p>'}
</div>
<footer class="baca-kaki">
  <p class="baca-kaki-label">Bagikan kabar ini</p>
  <div class="bagikan" data-bagikan>
    <a class="tombol tombol-garis kecil" href="https://wa.me/?text=${teksBagikan}%20${bagikan}" target="_blank" rel="noopener"><svg class="ikon"><use href="${sprite}#i-whatsapp"/></svg>WhatsApp</a>
    <a class="tombol tombol-garis kecil" href="https://www.facebook.com/sharer/sharer.php?u=${bagikan}" target="_blank" rel="noopener"><svg class="ikon"><use href="${sprite}#i-facebook"/></svg>Facebook</a>
    <button class="tombol tombol-garis kecil" type="button" data-salin-tautan><svg class="ikon"><use href="${sprite}#i-copy"/></svg>Salin tautan</button>
  </div>
</footer>`;
}
