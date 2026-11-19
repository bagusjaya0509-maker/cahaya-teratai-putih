// Potongan HTML kabar yang dipakai beranda, daftar kabar, dan "baca juga".
import { BASE, esc, ikon, tanggal } from './inti.js';
import { gambarYoutube } from './isi.js';

export const URL_WACANA = `${BASE}kabar/?kategori=${encodeURIComponent('Dharma Wacana')}`;
// Video Dharma Wacana tidak punya halaman sendiri: semuanya diputar di galeri kategori.
export const urlKabar = (k) => (k.video ? `${URL_WACANA}#v-${k.video}` : `${BASE}kabar/${k.id || k.slug}/`);

/** Ubin video vertikal (9:16) di galeri Dharma Wacana; klik untuk memutar di tempat. */
export const ubinWacana = (k) => `
<figure class="ubin-wacana" id="v-${esc(k.video)}">
  <button class="ubin-putar" type="button" data-putar="${esc(k.video)}" data-judul="${esc(k.judul)}" aria-label="Putar video: ${esc(k.judul)}">
    <img src="${esc(k.sampulKecil ? urlSampul(k.sampulKecil) : gambarYoutube(k.video))}" alt="" loading="lazy" decoding="async"${k.sampulKecil ? '' : ' class="mini-yt"'}>
    <span class="tanda-putar" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
  </button>
  <figcaption><h3>${esc(k.judul)}</h3><span class="meta-kecil"><time>${tanggal(k.terbitPada)}</time></span></figcaption>
</figure>`;

/** Ganti ubin dengan pemutar YouTube. */
export function putarWacana(tombol) {
  const id = tombol.dataset.putar;
  if (!/^[\w-]{11}$/.test(id)) return;
  const f = document.createElement('iframe');
  f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
  f.title = tombol.dataset.judul || 'Video Dharma Wacana';
  f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  f.referrerPolicy = 'strict-origin-when-cross-origin';
  f.allowFullscreen = true;
  f.className = 'ubin-pemutar';
  tombol.replaceWith(f);
}

// Kabar awal memakai nama foto kegiatan yang sudah ada di situs, bukan data URL.
const urlSampul = (s) => (/^[a-z]+$/.test(s) ? `${BASE}aset/img/kegiatan/${s}.webp` : s);

export function sampul(k, kelas = '') {
  if (k.video) {
    const src = k.sampulKecil ? urlSampul(k.sampulKecil) : gambarYoutube(k.video);
    return `<div class="sampul sampul-video ${kelas}"><img src="${esc(src)}" alt="" loading="lazy" decoding="async"><span class="tanda-putar" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span></div>`;
  }
  const galeri = (Array.isArray(k.galeriKecil) ? k.galeriKecil : []).filter((g) => typeof g === 'string' && g);
  if (galeri.length > 1) {
    return `<div class="sampul sampul-putar ${kelas}">${galeri.map((g, i) => `<img src="${esc(urlSampul(g))}" alt="" loading="lazy" decoding="async"${i ? '' : ' class="aktif"'}>`).join('')}</div>`;
  }
  if (k.sampulKecil) return `<div class="sampul ${kelas}"><img src="${esc(urlSampul(k.sampulKecil))}" alt="" loading="lazy" decoding="async"></div>`;
  return `<div class="sampul sampul-kosong ${kelas}" aria-hidden="true"><span class="sampul-kat">${esc(k.kategori || 'Kabar')}</span></div>`;
}

export const slideKegiatan = (k) => `
<a class="geser-kartu" href="${urlKabar(k)}">
  <img src="${esc(urlSampul(k.sampulKecil))}" alt="${esc(k.judul)}" loading="lazy" decoding="async">
  <span class="geser-judul">${esc(k.judul)}</span>
  <span class="geser-lanjut">Lihat keterangan ${ikon('arrow-right')}</span>
</a>`;

export const kartuKabar = (k) => `
<a class="kartu-kabar" href="${urlKabar(k)}">
  ${sampul(k)}
  <span class="kat">${esc(k.kategori || 'Kabar')}</span>
  <h3>${esc(k.judul)}</h3>
  ${k.ringkasan ? `<p>${esc(k.ringkasan)}</p>` : ''}
  <span class="meta-kecil"><time>${tanggal(k.terbitPada)}</time></span>
</a>`;

export const barisKabar = (k) => `
<li><a class="kabar-baris" href="${urlKabar(k)}">
  ${sampul(k)}
  <div>
    <span class="kat">${esc(k.kategori || 'Kabar')}</span>
    <h3>${esc(k.judul)}</h3>
    <span class="meta-kecil"><time>${tanggal(k.terbitPada)}</time></span>
  </div>
</a></li>`;

export const utamaKabar = (k) => `
<a class="kabar-utama" href="${urlKabar(k)}">
  ${sampul(k)}
  <h3>${esc(k.judul)}</h3>
  ${k.ringkasan ? `<p>${esc(k.ringkasan)}</p>` : ''}
  <span class="meta-kecil"><span class="kat">${esc(k.kategori || 'Kabar')}</span><time>${tanggal(k.terbitPada)}</time>${k.penulis ? `<span>${esc(k.penulis)}</span>` : ''}</span>
</a>`;

export const kerangkaKartu = (n = 3) => Array.from({ length: n }, () => `
<div class="kartu-kabar" aria-hidden="true">
  <div class="sampul kerangka"></div>
  <div class="kerangka" style="height:14px;width:30%;margin-bottom:10px"></div>
  <div class="kerangka" style="height:22px;width:92%;margin-bottom:8px"></div>
  <div class="kerangka" style="height:22px;width:70%"></div>
</div>`).join('');

// Sampul kartu yang berisi beberapa foto berganti setiap 3,5 detik
// (berhenti bila pengguna memilih gerak dikurangi atau tab tidak terlihat).
function putarSampul() {
  if (typeof document === 'undefined' || document.hidden) return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.sampul-putar').forEach((w) => {
    const img = [...w.querySelectorAll('img')];
    const i = img.findIndex((x) => x.classList.contains('aktif'));
    img[i]?.classList.remove('aktif');
    img[(i + 1) % img.length].classList.add('aktif');
  });
}
if (typeof window !== 'undefined') setInterval(putarSampul, 3500);
