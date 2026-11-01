// Inti bersama semua halaman: mode layanan, alat bantu DOM, kepala situs.
import { KONFIG } from './konfigurasi.js';

export { KONFIG };
export const BASE = KONFIG.base || '/';
export const ASAL = KONFIG.asal || location.origin + BASE;

function sesiSimpan(k, v) { try { v === null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch { /* mode privat */ } }
function sesiBaca(k) { try { return sessionStorage.getItem(k); } catch { return null; } }
export function lokalBaca(k, cadangan = null) { try { const v = localStorage.getItem(k); return v === null ? cadangan : JSON.parse(v); } catch { return cadangan; } }
export function lokalSimpan(k, v) { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } }

// ?demo=1 memaksa mode demo (data di peramban ini saja), ?demo=0 mematikannya.
const pDemo = new URLSearchParams(location.search).get('demo');
if (pDemo === '1') sesiSimpan('ctp.demo', '1');
if (pDemo === '0') sesiSimpan('ctp.demo', null);
const fbSiap = Boolean(KONFIG.firebase?.apiKey && KONFIG.firebase?.projectId);
const diLokal = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
/** 'firebase' = layanan nyata, 'demo' = tersimpan di peramban, 'mati' = belum disiapkan */
export const MODE = sesiBaca('ctp.demo') === '1' ? 'demo' : fbSiap ? 'firebase' : diLokal ? 'demo' : 'mati';

// ---------- alat bantu ----------
export const $ = (s, akar = document) => akar.querySelector(s);
export const $$ = (s, akar = document) => [...akar.querySelectorAll(s)];
const PETA_ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => PETA_ESC[c]);
export const tautan = (p = '') => BASE + String(p).replace(/^\//, '');
export const SPRITE = `${BASE}aset/img/ikon.svg?v=${KONFIG.versi || ''}`;
export const LAMBANG = `${BASE}aset/img/lambang-sprite.svg?v=${KONFIG.versi || ''}`;
export const ikon = (nama, kelas = 'ikon') => `<svg class="${kelas}" aria-hidden="true"><use href="${SPRITE}#i-${nama}"/></svg>`;
export const param = (k) => new URLSearchParams(location.search).get(k);

const fTgl = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Makassar' });
const fTglPendek = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Makassar' });
const fJam = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' });
export const tanggal = (ms) => (ms ? fTgl.format(new Date(ms)) : '');
export const tanggalPendek = (ms) => (ms ? fTglPendek.format(new Date(ms)) : '');
export const tanggalJam = (ms) => (ms ? `${fTglPendek.format(new Date(ms))}, ${fJam.format(new Date(ms))} WITA` : '');
export function waktuLalu(ms) {
  if (!ms) return '';
  const d = (Date.now() - ms) / 1000;
  if (d < 60) return 'baru saja';
  if (d < 3600) return `${Math.floor(d / 60)} menit lalu`;
  if (d < 86400) return `${Math.floor(d / 3600)} jam lalu`;
  if (d < 86400 * 7) return `${Math.floor(d / 86400)} hari lalu`;
  return tanggalPendek(ms);
}

export function roti(pesan, jenis = '') {
  let wadah = $('.roti-wadah');
  if (!wadah) {
    wadah = document.createElement('div');
    wadah.className = 'roti-wadah';
    wadah.setAttribute('role', 'status');
    wadah.setAttribute('aria-live', 'polite');
    document.body.append(wadah);
  }
  const r = document.createElement('div');
  r.className = `roti ${jenis}`;
  r.textContent = pesan;
  wadah.append(r);
  setTimeout(() => r.remove(), jenis === 'galat' ? 7000 : 4200);
}

/** Jalankan aksi tombol dengan status memuat dan penanganan galat. */
export async function denganMemuat(tombol, fn) {
  const asli = tombol?.innerHTML;
  if (tombol) {
    tombol.disabled = true;
    tombol.innerHTML = `${ikon('loader-circle', 'ikon berputar')}<span>Memproses…</span>`;
  }
  try {
    return await fn();
  } finally {
    if (tombol) {
      tombol.disabled = false;
      tombol.innerHTML = asli;
    }
  }
}

/** Ubah galat Firebase/teknis menjadi kalimat yang bisa ditindaklanjuti. */
export function pesanGalat(e) {
  const k = e?.code || e?.message || '';
  const peta = {
    'auth/invalid-credential': 'Email atau kata sandi salah. Periksa lagi, atau pakai "Lupa kata sandi".',
    'auth/wrong-password': 'Kata sandi salah.',
    'auth/user-not-found': 'Belum ada akun dengan email itu. Daftar dulu lewat tab "Daftar".',
    'auth/email-already-in-use': 'Email ini sudah terdaftar. Masuk lewat tab "Masuk".',
    'auth/weak-password': 'Kata sandi minimal 8 karakter.',
    'auth/invalid-email': 'Format email tidak benar.',
    'auth/too-many-requests': 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.',
    'auth/popup-closed-by-user': 'Jendela Google ditutup sebelum selesai.',
    'auth/popup-blocked': 'Peramban memblokir jendela Google. Izinkan pop-up lalu coba lagi.',
    'auth/network-request-failed': 'Koneksi internet terputus. Periksa jaringan lalu coba lagi.',
    'auth/admin-restricted-operation': 'Booking tanpa akun belum diaktifkan di Firebase (Authentication, Sign-in method, Anonymous).',
    'auth/operation-not-allowed': 'Metode masuk ini belum diaktifkan di Firebase Authentication.',
    'auth/unauthorized-domain': 'Domain situs ini belum diizinkan di Firebase Authentication (Settings → Authorized domains).',
    'permission-denied': 'Akses ditolak. Akun ini tidak memiliki izin untuk tindakan tersebut.',
    unavailable: 'Server sedang tidak bisa dihubungi. Coba lagi sebentar lagi.',
    LAYANAN_MATI: 'Layanan daring belum diaktifkan. Hubungi yayasan lewat WhatsApp atau email.',
    BELUM_MASUK: 'Silakan masuk terlebih dahulu.',
    DIBLOKIR: 'Pengiriman dari perangkat ini dinonaktifkan pengurus. Hubungi yayasan lewat WhatsApp bila menurut Anda ini keliru.',
  };
  for (const [kunci, teks] of Object.entries(peta)) if (k.includes(kunci)) return teks;
  return e?.pesan || e?.message || 'Terjadi kesalahan. Coba lagi.';
}

// ---------- sesi ringan untuk kepala situs ----------
// Halaman publik tidak memuat SDK Firebase; nama pengguna disimpan ringkas di
// localStorage saat masuk supaya tautan "Masuk" bisa berganti menjadi akun.
export const sesiLokal = {
  baca: () => lokalBaca('ctp.sesi'),
  simpan: (s) => lokalSimpan('ctp.sesi', s ? { nama: s.nama || s.email || 'Akun', admin: Boolean(s.admin), tamu: Boolean(s.tamu) } : null),
};
export const inisial = (nama) => String(nama || '?').trim().split(/\s+/).slice(0, 2).map((k) => k[0]).join('').toUpperCase();

function pasangKepala() {
  const kepala = $('[data-kepala]');
  const halaman = document.body.dataset.halaman;
  $$('[data-nav]').forEach((a) => { if (a.dataset.nav === halaman) a.setAttribute('aria-current', 'page'); });

  const sesi = sesiLokal.baca();
  if (sesi) {
    $$('[data-tautan-akun]').forEach((a) => {
      a.href = tautan(sesi.admin ? 'admin/' : 'akun/');
      const label = sesi.admin ? 'Panel' : sesi.tamu ? 'Booking saya' : 'Akun saya';
      if (a.classList.contains('tautan-akun')) a.innerHTML = sesi.tamu ? `${ikon('calendar')}<span>${label}</span>` : `<span class="inisial" aria-hidden="true">${esc(inisial(sesi.nama))}</span><span>${label}</span>`;
      else a.textContent = sesi.admin ? 'Buka panel pengurus' : `Buka ${label.toLowerCase()}`;
    });
  }
  if (!kepala) return;

  const nav = $('#nav-utama');
  const tMenu = $('.tombol-menu');
  const tutupMenu = () => {
    nav.classList.remove('terbuka');
    document.body.classList.remove('menu-terbuka');
    tMenu.setAttribute('aria-expanded', 'false');
    tMenu.innerHTML = ikon('menu');
  };
  tMenu?.addEventListener('click', () => {
    const buka = !nav.classList.contains('terbuka');
    if (!buka) return tutupMenu();
    nav.classList.add('terbuka');
    document.body.classList.add('menu-terbuka');
    tMenu.setAttribute('aria-expanded', 'true');
    tMenu.innerHTML = ikon('x');
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('terbuka')) tutupMenu(); });
  matchMedia('(min-width: 1101px)').addEventListener('change', (m) => m.matches && tutupMenu());

  $$('.nav-turun').forEach((li) => {
    const t = $('.nav-turun-tombol', li);
    t.addEventListener('click', () => {
      const buka = !li.classList.contains('terbuka');
      li.classList.toggle('terbuka', buka);
      t.setAttribute('aria-expanded', String(buka));
    });
    document.addEventListener('click', (e) => {
      if (!li.contains(e.target) && li.classList.contains('terbuka') && matchMedia('(min-width: 1101px)').matches) {
        li.classList.remove('terbuka');
        t.setAttribute('aria-expanded', 'false');
      }
    });
  });

  const cekGulir = () => kepala.classList.toggle('tergulir', scrollY > 24);
  addEventListener('scroll', cekGulir, { passive: true });
  cekGulir();
}

function pasangPitaDemo() {
  if (MODE !== 'demo') return;
  const pita = document.createElement('div');
  pita.className = 'pita-demo';
  pita.innerHTML = '<b>Mode demo.</b> Firebase belum diisi, jadi booking, testimoni, dan kabar baru hanya tersimpan di peramban ini.';
  document.body.prepend(pita);
}

pasangKepala();
pasangPitaDemo();
