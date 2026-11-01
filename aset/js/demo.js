// Penyimpanan mode demo: semua data hidup di localStorage peramban ini.
// Dipakai ketika situs dibuka di komputer sendiri sebelum Firebase diisi,
// supaya seluruh alur (booking, testimoni, panel pengurus) bisa dicoba.
import { lokalBaca, lokalSimpan } from './inti.js';
import { KABAR_AWAL } from './kabar-awal.js';

const KUNCI = 'ctp.demo.v1';

function kosong() {
  const s = { akun: {}, pengguna: {}, admin: {}, blokir: {}, kabar: {}, kabarIsi: {}, draf: {}, booking: {}, tanggapan: {}, internal: {}, testimoni: {}, testimoniPublik: {}, pengaturan: null, sesi: null };
  for (const k of KABAR_AWAL) {
    const { delta, sampul, keteranganSampul, ...meta } = k;
    s.kabar[k.slug] = { ...meta, diubah: k.terbitPada };
    s.kabarIsi[k.slug] = { delta, sampul: sampul || '', keteranganSampul: keteranganSampul || '', diubah: k.terbitPada };
  }
  return s;
}

export function bacaDemo() {
  let s = lokalBaca(KUNCI);
  if (!s) {
    s = kosong();
    lokalSimpan(KUNCI, s);
  }
  return s;
}

export function ubahDemo(fn) {
  const s = bacaDemo();
  const hasil = fn(s);
  if (!lokalSimpan(KUNCI, s)) throw new Error('Penyimpanan peramban penuh. Mode demo hanya menampung beberapa MB. Hapus foto besar lalu coba lagi.');
  return hasil;
}

export function setelUlangDemo() {
  lokalSimpan(KUNCI, null);
}

export const idAcak = (n = 20) => {
  const abjad = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  const acak = crypto.getRandomValues(new Uint8Array(n));
  for (const b of acak) s += abjad[b % abjad.length];
  return s;
};

export const tunda = (ms = 250) => new Promise((r) => setTimeout(r, ms));
