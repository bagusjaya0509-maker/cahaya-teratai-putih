import { $, $$, BASE, MODE, param, ikon, denganMemuat, pesanGalat, roti } from './inti.js';
import { L, pantauSesi } from './layanan.js';
import { pasangKota } from './rujukan.js';
import { kartuMati } from './gerbang.js';

const blok = $('[data-blok-akun]');
const pesan = $('[data-pesan-masuk]');

// Tujuan sesudah masuk: hanya jalur di situs ini (cegah pengalihan ke situs lain).
function tujuan(p) {
  const l = param('lanjut');
  if (l && l.startsWith(BASE) && !l.startsWith('//') && !l.includes('/masuk/')) return l;
  return BASE + (p?.admin ? 'admin/' : 'akun/');
}

if (MODE === 'mati') {
  blok.hidden = true;
  pesan.innerHTML = kartuMati();
} else {
  let sudahAlih = false;
  pantauSesi((p) => {
    if (p && !p.tamu && !sudahAlih) {
      sudahAlih = true;
      location.replace(tujuan(p));
    }
  });
}

pasangKota();

const form = { masuk: $('[data-form="masuk"]'), daftar: $('[data-form="daftar"]'), lupa: $('[data-form="lupa"]') };
function pilihTab(nama) {
  $$('[data-tab]').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === nama)));
  form.masuk.hidden = nama !== 'masuk';
  form.daftar.hidden = nama !== 'daftar';
  form.lupa.hidden = nama !== 'lupa';
  $('.tab-daftar').hidden = nama === 'lupa';
  $('[data-google]').hidden = nama === 'lupa';
  $('.pemisah').hidden = nama === 'lupa';
}
$$('[data-tab]').forEach((t) => t.addEventListener('click', () => pilihTab(t.dataset.tab)));
$('[data-ke-lupa]').addEventListener('click', () => {
  form.lupa.email.value = form.masuk.email.value;
  pilihTab('lupa');
});
$('[data-ke-masuk]').addEventListener('click', () => pilihTab('masuk'));
if (param('tab') === 'daftar') pilihTab('daftar');

$$('[data-lihat]').forEach((b) =>
  b.addEventListener('click', () => {
    const i = b.previousElementSibling;
    const lihat = i.type === 'password';
    i.type = lihat ? 'text' : 'password';
    b.innerHTML = ikon(lihat ? 'eye-off' : 'eye');
    b.setAttribute('aria-label', lihat ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
  }),
);

function galat(f, teks) {
  const el = $('[data-galat]', f);
  el.textContent = teks || '';
  el.hidden = !teks;
}

form.masuk.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  galat(f);
  if (!f.email.value.trim() || !f.sandi.value) return galat(f, 'Isi email dan kata sandi.');
  denganMemuat(f.querySelector('[type=submit]'), async () => {
    try {
      await L.masuk(f.email.value, f.sandi.value);
    } catch (err) {
      galat(f, pesanGalat(err));
    }
  });
});

form.daftar.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  galat(f);
  const nama = f.nama.value.trim();
  if (nama.length < 3) return galat(f, 'Tulis nama lengkap Anda.');
  if (!/^\S+@\S+\.\S+$/.test(f.email.value.trim())) return galat(f, 'Format email tidak benar.');
  if (f.wa.value && !/^(\+?62|0)8\d{7,12}$/.test(f.wa.value.replace(/[\s-]/g, ''))) return galat(f, 'Nomor WhatsApp diawali 08 atau +628, contoh 081234567890.');
  if (f.sandi.value.length < 8) return galat(f, 'Kata sandi minimal 8 karakter.');
  if (!f.setuju.checked) return galat(f, 'Centang pernyataan kebijakan privasi untuk melanjutkan.');
  denganMemuat(f.querySelector('[type=submit]'), async () => {
    try {
      await L.daftar({ nama, email: f.email.value, sandi: f.sandi.value, wa: f.wa.value.replace(/[\s-]/g, ''), kota: f.kota.value.trim() });
      roti('Akun dibuat. Periksa email Anda untuk verifikasi.', 'berhasil');
    } catch (err) {
      galat(f, pesanGalat(err));
    }
  });
});

form.lupa.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  galat(f);
  if (!/^\S+@\S+\.\S+$/.test(f.email.value.trim())) return galat(f, 'Format email tidak benar.');
  denganMemuat(f.querySelector('[type=submit]'), async () => {
    try {
      await L.lupaSandi(f.email.value);
      f.innerHTML = `<div class="pesan pesan-berhasil">${ikon('mail')}<div><p><b>Tautan sudah dikirim.</b> Buka email Anda, klik tautannya, lalu buat kata sandi baru. Periksa folder Spam bila belum ada dalam beberapa menit.</p></div></div><p style="text-align:center;margin:0"><a class="tombol-teks" href="${BASE}masuk/">Kembali ke halaman masuk</a></p>`;
    } catch (err) {
      galat(f, pesanGalat(err));
    }
  });
});

$('[data-google]').addEventListener('click', (e) =>
  denganMemuat(e.currentTarget, async () => {
    try {
      await L.masukGoogle();
    } catch (err) {
      roti(pesanGalat(err), 'galat');
    }
  }),
);

if (MODE === 'demo') {
  $('[data-demo]').hidden = false;
  $('[data-pengurus-demo]').addEventListener('click', (e) => denganMemuat(e.currentTarget, () => L.masukPengurusDemo()));
}
