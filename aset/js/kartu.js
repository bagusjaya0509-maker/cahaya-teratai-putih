// Potongan HTML kabar yang dipakai beranda, daftar kabar, dan "baca juga".
import { BASE, esc, tanggal } from './inti.js';

export const urlKabar = (k) => `${BASE}kabar/${k.id || k.slug}/`;

// Kabar awal memakai nama foto kegiatan yang sudah ada di situs, bukan data URL.
const urlSampul = (s) => (/^[a-z]+$/.test(s) ? `${BASE}aset/img/kegiatan/${s}.webp` : s);

export function sampul(k, kelas = '') {
  if (k.sampulKecil) return `<div class="sampul ${kelas}"><img src="${esc(urlSampul(k.sampulKecil))}" alt="" loading="lazy" decoding="async"></div>`;
  return `<div class="sampul sampul-kosong ${kelas}" aria-hidden="true"><span class="sampul-kat">${esc(k.kategori || 'Kabar')}</span></div>`;
}

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
