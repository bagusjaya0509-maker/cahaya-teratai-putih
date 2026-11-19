// Animasi lambang teratai (sinar berputar, teratai mekar-bernapas, sosok bercahaya, partikel cahaya naik).
// Dipakai menggantikan foto testimoni yang ditandai pengurus (gambarAnimasi: 'teratai'), mis. testimoni akun yayasan.
import { BASE } from './inti.js';

const SPRITE = `${BASE}aset/img/lambang-sprite.svg`;
const lapis = (id, kelas) => `<svg class="${kelas}" viewBox="0 0 1254 1254" aria-hidden="true"><use href="${SPRITE}#${id}"/></svg>`;

export const htmlAnimasiTeratai = () => `<div class="animasi-teratai" role="img" aria-label="Lambang teratai Yayasan Cahaya Teratai Putih">
  <span class="at-cahaya"></span>
  ${Array.from({ length: 7 }, (_, i) => `<span class="at-partikel" style="--i:${i}"></span>`).join('')}
  <div class="at-lambang">
    ${lapis('i-surya', 'at-surya')}
    ${lapis('i-teratai', 'at-teratai')}
    ${lapis('i-sosok', 'at-sosok')}
  </div>
</div>`;

export const pakaiAnimasi = (t) => t?.gambarAnimasi === 'teratai';
