// Terjemahan otomatis lewat Google Translate.
// Skrip Google dimuat hanya bila bahasanya bukan Indonesia, jadi pengunjung biasa
// tidak terhubung ke Google. Halaman akun dan masuk tidak pernah diterjemahkan
// supaya datanya tidak terkirim ke layanan luar.
import { $$, lokalBaca, lokalSimpan } from './inti.js';

const KUNCI = 'ctp.bahasa';
const BAHASA = [
  ['id', 'Indonesia'], ['en', 'English'], ['de', 'Deutsch'], ['fr', 'Français'], ['nl', 'Nederlands'],
  ['ru', 'Русский'], ['ja', '日本語'], ['ko', '한국어'], ['zh-CN', '中文'],
];
const halamanPribadi = /\/(akun|masuk)\//.test(location.pathname);

function aturCookie(nilai) {
  const akhir = nilai ? '' : '; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = `googtrans=${nilai}; path=/${akhir}`;
  if (!nilai) document.cookie = `googtrans=; path=/; domain=${location.hostname}${akhir}`;
}

/** Bahasa peramban tamu dari luar Indonesia. HP berbahasa Inggris di Indonesia tetap dibiarkan. */
function deteksi() {
  const zona = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  if (/^Asia\/(Jakarta|Pontianak|Makassar|Jayapura)$/.test(zona)) return 'id';
  for (const l of navigator.languages || [navigator.language]) {
    const dasar = String(l).split('-')[0].toLowerCase();
    if (['id', 'ms', 'jv', 'su'].includes(dasar)) return 'id';
    if (dasar === 'zh') return 'zh-CN';
    if (BAHASA.some(([k]) => k === dasar)) return dasar;
  }
  return 'id';
}

function pasangGoogle() {
  const wadah = document.createElement('div');
  wadah.id = 'terjemah-wadah';
  wadah.setAttribute('translate', 'no');
  document.body.append(wadah);
  window.pasangTerjemah = () => new window.google.translate.TranslateElement({ pageLanguage: 'id', autoDisplay: false }, 'terjemah-wadah');
  const s = document.createElement('script');
  s.src = 'https://translate.google.com/translate_a/element.js?cb=pasangTerjemah';
  s.async = true;
  document.head.append(s);
}

const kini = lokalBaca(KUNCI) || deteksi();

$$('[data-bahasa]').forEach((label) => {
  if (halamanPribadi) return;
  const pilih = label.querySelector('select');
  pilih.innerHTML = BAHASA.map(([k, n]) => `<option value="${k}" ${k === kini ? 'selected' : ''}>${n}</option>`).join('');
  label.hidden = false;
  pilih.addEventListener('change', () => {
    lokalSimpan(KUNCI, pilih.value);
    aturCookie(pilih.value === 'id' ? '' : `/id/${pilih.value}`);
    location.reload();
  });
});

if (kini !== 'id' && !halamanPribadi) {
  aturCookie(`/id/${kini}`);
  pasangGoogle();
  $$('[data-catatan-terjemah]').forEach((el) => (el.hidden = false));
} else {
  aturCookie('');
}
