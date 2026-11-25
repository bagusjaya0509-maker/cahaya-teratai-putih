// Potongan HTML kabar yang dipakai beranda, daftar kabar, dan "baca juga".
import { BASE, esc, ikon, tanggal } from './inti.js';
import { gambarYoutube, htmlPemutar } from './isi.js';
import { pasangSubtitle } from './subtitle-video.js';

export const urlKabar = (k) => `${BASE}kabar/${k.id || k.slug}/`;

// Kabar awal memakai nama foto kegiatan yang sudah ada di situs, bukan data URL.
const urlSampul = (s) => (/^[a-z]+$/.test(s) ? `${BASE}aset/img/kegiatan/${s}.webp` : s);

const atrVideo = (k) => (k.video ? ` data-video="${esc(k.video)}" data-tegak="${k.videoTegak ? 1 : 0}" data-judul="${esc(k.judul)}" data-latar="${esc(k.sampulKecil ? urlSampul(k.sampulKecil) : '')}"` : '');

/** Buka video dalam jendela pemutar di halaman yang sama, langsung terputar. */
export function bukaPemutar({ video, tegak, judul, latar }) {
  let d = document.querySelector('dialog.dialog-video');
  if (!d) {
    d = document.createElement('dialog');
    d.className = 'dialog-video';
    d.setAttribute('aria-label', 'Pemutar video');
    document.body.appendChild(d);
    d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-tutup-video]')) d.close(); });
    d.addEventListener('close', () => { d.innerHTML = ''; });
  }
  d.innerHTML = `<div class="dialog-video-isi">
  <div class="dialog-video-kepala"><h2>${esc(judul || 'Video')}</h2><button type="button" class="dialog-video-tutup" data-tutup-video aria-label="Tutup video">&times;</button></div>
  ${htmlPemutar({ id: video, tegak, judul, latar, otomatis: true })}
</div>`;
  d.showModal();
  pasangSubtitle(d);
}
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-video]');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
    if (typeof HTMLDialogElement === 'undefined') return;
    e.preventDefault();
    bukaPemutar({ video: a.dataset.video, tegak: a.dataset.tegak === '1', judul: a.dataset.judul, latar: a.dataset.latar });
  });
}

export function sampul(k, kelas = '') {
  if (k.video) {
    const src = esc(k.sampulKecil ? urlSampul(k.sampulKecil) : gambarYoutube(k.video));
    return `<div class="sampul sampul-video ${kelas}"><img class="latar-blur" src="${src}" alt="" aria-hidden="true" loading="lazy"><img class="isi-video" src="${src}" alt="" loading="lazy" decoding="async"><span class="tanda-putar" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span></div>`;
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

// Papan pengumuman (billboard) selebar layar di atas beranda: foto penuh + judul di kotak gelap.
export const slidePengumuman = (k, i, n) => {
  const foto = k.sampul || k.sampulKecil;
  const gambar = foto ? urlSampul(foto) : (k.video ? gambarYoutube(k.video) : '');
  return `
<a class="papan-slide" href="${urlKabar(k)}" role="group" aria-roledescription="slide" aria-label="${i + 1} dari ${n}: ${esc(k.judul)}"${i ? ' tabindex="-1"' : ''}>
  ${gambar ? `<img class="papan-latar" src="${esc(gambar)}" alt="" aria-hidden="true" loading="lazy" decoding="async"><img class="papan-foto" src="${esc(gambar)}" alt="" loading="${i ? 'lazy' : 'eager'}" decoding="async">` : `<span class="papan-foto papan-foto-kosong"><img src="${BASE}aset/img/lambang-emas.svg" alt=""></span>`}
  <span class="papan-keterangan">
    <span class="papan-kat">${esc(k.kategori || 'Pengumuman')}</span>
    <strong class="papan-judul">${esc(k.judul)}</strong>
  </span>
</a>`;
};

export const kartuKabar = (k) => `
<a class="kartu-kabar" href="${urlKabar(k)}"${atrVideo(k)}>
  ${sampul(k)}
  <span class="kat">${esc(k.kategori || 'Kabar')}</span>
  <h3>${esc(k.judul)}</h3>
  ${k.ringkasan ? `<p>${esc(k.ringkasan)}</p>` : ''}
  <span class="meta-kecil"><time>${tanggal(k.terbitPada)}</time></span>
</a>`;

export const barisKabar = (k) => `
<li><a class="kabar-baris" href="${urlKabar(k)}"${atrVideo(k)}>
  ${sampul(k)}
  <div>
    <span class="kat">${esc(k.kategori || 'Kabar')}</span>
    <h3>${esc(k.judul)}</h3>
    <span class="meta-kecil"><time>${tanggal(k.terbitPada)}</time></span>
  </div>
</a></li>`;

export const utamaKabar = (k) => `
<a class="kabar-utama" href="${urlKabar(k)}"${atrVideo(k)}>
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
