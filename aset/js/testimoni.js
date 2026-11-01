// Halaman testimoni: daftar yang sudah ditinjau pengurus dan formulir menulis.
import { $, $$, BASE, MODE, esc, ikon, tanggal, roti, denganMemuat, pesanGalat } from './inti.js';
import { L } from './layanan.js';
import { daftarTestimoni, ambilPengaturan } from './publik.js';
import { LAYANAN_BOOKING, pasangKota, kataKlaim } from './rujukan.js';
import { bintangHtml } from './booking-tampil.js';
import { kompres } from './gambar.js';
import { kartuMati } from './gerbang.js';

export const kartuTestimoni = (t) => `
<figure class="kartu-testimoni">
  ${t.foto ? `<img src="${esc(t.foto)}" alt="" loading="lazy" decoding="async">` : ''}
  ${bintangHtml(t.bintang)}
  <blockquote>${esc(t.isi)}</blockquote>
  <figcaption><b>${esc(t.nama)}</b>${t.kota ? `<span>${esc(t.kota)}</span>` : ''}<span class="kat">${esc(t.tentang)}</span></figcaption>
</figure>`;

const kisi = $('[data-testimoni]');
if (kisi) {
  const f = $('[data-tulis]');
  const saringan = $('[data-saring-testimoni]');
  let semua = [];
  let tentang = '';
  let foto = '';

  function gambar() {
    const h = tentang ? semua.filter((t) => t.tentang === tentang) : semua;
    kisi.innerHTML = h.length
      ? h.map(kartuTestimoni).join('')
      : `<div class="kosong" style="grid-column:1/-1"><h3>${semua.length ? 'Belum ada testimoni untuk pilihan ini' : 'Belum ada testimoni'}</h3><p>${semua.length ? 'Pilih yang lain, atau tulis pengalaman Anda.' : 'Pernah ikut kegiatan atau memakai produk yayasan? Jadilah yang pertama menulis.'}</p></div>`;
    const pilihan = ['', ...new Set(semua.map((t) => t.tentang))];
    saringan.hidden = pilihan.length < 3;
    saringan.innerHTML = pilihan.map((p) => `<button class="chip" type="button" data-pilih="${esc(p)}" aria-pressed="${p === tentang}">${esc(p || 'Semua')}</button>`).join('');
  }
  saringan.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pilih]');
    if (!b) return;
    tentang = b.dataset.pilih;
    gambar();
  });

  daftarTestimoni().then((d) => { semua = d; gambar(); }).catch((e) => {
    console.error(e);
    kisi.innerHTML = '<div class="kosong" style="grid-column:1/-1"><h3>Testimoni belum bisa dimuat</h3><p>Periksa koneksi internet, lalu muat ulang halaman.</p></div>';
  });

  if (MODE === 'mati') {
    $('[data-tulis-wadah]').innerHTML = kartuMati();
  } else {
    pasangKota();
    ambilPengaturan().then((a) => {
      const produk = (a.produk || []).map((p) => `<option>${esc(p)}</option>`).join('');
      const layanan = LAYANAN_BOOKING.filter((l) => l.kunci !== 'lainnya').map((l) => `<option>${esc(l.nama)}</option>`).join('');
      $('[data-tentang]').innerHTML = `<option value="">Pilih</option>${produk ? `<optgroup label="Produk">${produk}</optgroup>` : ''}<optgroup label="Layanan">${layanan}</optgroup><option value="__lain__">Lainnya, tulis sendiri</option>`;
    });
    $('[data-tentang]').addEventListener('change', (e) => {
      const lain = e.target.value === '__lain__';
      f.elements.tentangLain.hidden = !lain;
      if (lain) f.elements.tentangLain.focus();
    });

    // Peringatan halus saat tulisan terbaca sebagai janji sembuh.
    const isi = f.elements.isi;
    const hitung = $('[data-hitung]', f);
    const saran = $('[data-saran]', f);
    isi.addEventListener('input', () => {
      hitung.textContent = `${isi.value.length.toLocaleString('id-ID')} / 1.200`;
      saran.hidden = !kataKlaim(isi.value).length;
    });

    const pratinjau = $('[data-foto-pratinjau]', f);
    $('[data-foto]', f).addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      pratinjau.innerHTML = `${ikon('loader-circle', 'ikon berputar')}<p>Memperkecil foto…</p>`;
      try {
        foto = await kompres(file, { maks: 900, mutu: 0.72 });
        pratinjau.innerHTML = `<img src="${foto}" alt=""><p>Klik untuk mengganti foto</p>`;
      } catch {
        foto = '';
        pratinjau.innerHTML = `${ikon('image')}<p>Foto tidak bisa dibaca. Coba foto lain.</p>`;
      }
    });

    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const galat = $('[data-galat]', f);
      const E = f.elements;
      const t = E.tentang.value === '__lain__' ? E.tentangLain.value.trim() : E.tentang.value;
      const wa = E.wa.value.replace(/[\s-]/g, '');
      const masalah = [
        E.nama.value.trim().length < 2 && 'Tulis nama Anda.',
        t.length < 2 && 'Pilih layanan atau produk yang Anda ceritakan.',
        !E.bintang.value && 'Beri nilai bintang.',
        E.isi.value.trim().length < 20 && 'Ceritakan minimal 20 huruf.',
        wa && !/^(\+?62|0)8\d{7,12}$/.test(wa) && 'Nomor WhatsApp diawali 08 atau +628.',
        !E.setuju.checked && 'Centang persetujuan di bagian bawah.',
      ].filter(Boolean);
      if (masalah.length) {
        galat.textContent = masalah.join(' ');
        galat.hidden = false;
        return;
      }
      galat.hidden = true;
      denganMemuat($('[type=submit]', f), async () => {
        try {
          await L.kirimTestimoni({
            nama: E.nama.value.trim(), wa, kota: E.kota.value.trim(), tentang: t.slice(0, 80), bintang: Number(E.bintang.value),
            isi: E.isi.value.trim(), foto, tampilNama: E.tampilNama.checked ? 'inisial' : 'lengkap',
          });
          $('[data-tulis-wadah]').innerHTML = `<div class="kartu hasil-kirim"><span class="hasil-ikon">${ikon('circle-check')}</span><h2>Terima kasih sudah bercerita</h2><p>Testimoni Anda sudah kami terima. Pengurus membacanya lebih dulu, lalu menampilkannya di halaman ini.</p><a class="tombol tombol-garis" href="${BASE}testimoni/">Kembali ke testimoni</a></div>`;
        } catch (err) {
          console.error(err);
          galat.textContent = pesanGalat(err);
          galat.hidden = false;
        }
      });
    });
  }
}
