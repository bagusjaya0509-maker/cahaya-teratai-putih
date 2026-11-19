// Kotak "masuk dengan Google (opsional)" untuk formulir testimoni dan booking.
// Tanpa masuk, formulir tetap bisa dipakai sebagai tamu. Bila masuk, testimoni menampilkan foto profil
// dan email yang disamarkan sehingga lebih tepercaya.
import { esc, ikon, roti, pesanGalat, denganMemuat } from './inti.js';
import { L, pantauSesi, samarkanEmail } from './layanan.js';

export function pasangOpsiMasuk(wadah, { tujuan = 'testimoni' } = {}) {
  if (!wadah) return;
  const manfaat = tujuan === 'testimoni'
    ? 'Testimoni Anda akan tampil dengan foto profil dan email yang disamarkan, sehingga lebih tepercaya.'
    : 'Data Anda terisi otomatis dan status booking bisa dipantau dari halaman akun.';
  pantauSesi((p) => {
    if (p && !p.tamu && p.email) {
      wadah.innerHTML = `<div class="opsi-masuk masuk">
        ${p.foto ? `<img src="${esc(p.foto)}" alt="" referrerpolicy="no-referrer" width="44" height="44">` : `<span class="opsi-masuk-inisial">${esc((p.nama || p.email)[0].toUpperCase())}</span>`}
        <div><b>${esc(p.nama || '')}</b><small>${ikon('badge-check')}${esc(samarkanEmail(p.email))}</small></div>
        <button class="tombol-teks" type="button" data-keluar-opsi>Ganti akun</button>
      </div>`;
      wadah.querySelector('[data-keluar-opsi]').addEventListener('click', () => L.keluar().catch(() => {}));
      return;
    }
    wadah.innerHTML = `<div class="opsi-masuk">
      <div><b>Masuk dengan Google (opsional)</b><small>${esc(manfaat)} Tanpa masuk pun tetap bisa.</small></div>
      <button class="tombol tombol-garis kecil" type="button" data-masuk-google>${ikon('log-in')}Masuk dengan Google</button>
    </div>`;
    const b = wadah.querySelector('[data-masuk-google]');
    b.addEventListener('click', () => denganMemuat(b, async () => {
      try { await L.masukGoogle(); roti('Berhasil masuk.', 'berhasil'); } catch (e) {
        if (!/popup-closed|cancelled-popup/.test(e?.code || '')) roti(pesanGalat(e), 'galat');
      }
    }));
  });
}
