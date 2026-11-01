// Keterangan waktu di langit beranda dan tanggal purnama berikutnya.
// Warna langit sendiri dipasang skrip kecil di <head> supaya tidak berkedip.
import { $, $$ } from './inti.js';
import { purnamaBerikutnya } from './rujukan.js';

const fJam = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' });
const fTgl = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', timeZone: 'Asia/Makassar' });

const purnama = fTgl.format(new Date(purnamaBerikutnya()));
$$('[data-purnama]').forEach((el) => (el.textContent = purnama));

const jam = $('[data-jam-mataram]');
if (jam) {
  const tulis = () => { jam.textContent = `Kota Mataram, ${fJam.format(new Date())} WITA`; };
  tulis();
  setInterval(tulis, 30000);
}
