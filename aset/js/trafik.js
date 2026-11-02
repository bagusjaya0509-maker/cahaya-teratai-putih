// Hitungan kunjungan harian untuk panel pengurus. Yang disimpan hanya angka per hari
// dan per halaman: tidak ada nama, alamat IP, atau cookie. Satu peramban dihitung
// sekali per hari sebagai pengunjung, dan setiap halaman yang dibuka sebagai tayangan.
import { KONFIG, MODE, sesiLokal, lokalBaca, lokalSimpan } from './inti.js';

const HALAMAN = ['tentang', 'layanan', 'kabar', 'donasi', 'kontak', 'booking', 'testimoni', 'privasi'];

function catat() {
  if (MODE !== 'firebase' || navigator.webdriver || sesiLokal.baca()?.admin) return;
  const ruas = location.pathname.split('/')[1] || 'beranda';
  if (ruas !== 'beranda' && !HALAMAN.includes(ruas)) return;

  const hari = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(new Date());
  const tambah = (fieldPath) => ({ fieldPath, increment: { integerValue: '1' } });
  const ubah = [tambah('tayangan'), tambah(`h_${ruas}`)];
  if (lokalBaca('ctp.kunjung') !== hari) ubah.push(tambah('kunjungan'));

  const { projectId, apiKey } = KONFIG.firebase;
  const akar = `projects/${projectId}/databases/(default)/documents`;
  fetch(`https://firestore.googleapis.com/v1/${akar}:commit?key=${apiKey}`, {
    method: 'POST',
    keepalive: true,
    body: JSON.stringify({ writes: [{ transform: { document: `${akar}/trafik/${hari}`, fieldTransforms: ubah } }] }),
  })
    .then((j) => { if (j.ok) lokalSimpan('ctp.kunjung', hari); })
    .catch(() => {});
}

catat();
