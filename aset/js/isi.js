// Mengubah isi kabar (format Delta milik editor Quill) menjadi HTML.
// Dipakai di peramban DAN di skrip build Node, jadi berkas ini tidak boleh
// menyentuh window/document. HTML tidak pernah disimpan mentah: teks selalu
// di-escape dan hanya format yang dikenal yang diterjemahkan.

const PETA_ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => PETA_ESC[c]);

function tautanAman(url) {
  const u = String(url || '').trim();
  if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
  if (/^[/#?]/.test(u)) return u;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(u)) return 'https://' + u;
  return '';
}

function gambarAman(src) {
  const s = String(src || '');
  if (/^data:image\/(jpeg|png|webp|gif);base64,[a-z0-9+/=]+$/i.test(s)) return s;
  if (/^(https?:)?\/\//i.test(s) || s.startsWith('/')) return s;
  return '';
}

function inline(teks, a = {}) {
  let h = esc(teks);
  if (a.bold) h = `<strong>${h}</strong>`;
  if (a.italic) h = `<em>${h}</em>`;
  if (a.underline) h = `<u>${h}</u>`;
  if (a.strike) h = `<s>${h}</s>`;
  if (a.link) {
    const url = tautanAman(a.link);
    if (url) {
      const luar = /^https?:/i.test(url);
      h = `<a href="${esc(url)}"${luar ? ' target="_blank" rel="noopener"' : ''}>${h}</a>`;
    }
  }
  return h;
}

/** Ubah daftar ops Delta (atau string JSON-nya) menjadi baris-baris berformat. */
export function deltaKeBaris(delta) {
  let ops = delta;
  if (typeof ops === 'string') {
    try { ops = JSON.parse(ops); } catch { ops = []; }
  }
  if (ops && !Array.isArray(ops) && Array.isArray(ops.ops)) ops = ops.ops;
  if (!Array.isArray(ops)) ops = [];
  const baris = [];
  let isi = [];
  for (const op of ops) {
    if (typeof op.insert === 'string') {
      const potong = op.insert.split('\n');
      potong.forEach((teks, i) => {
        if (teks) isi.push({ teks, a: op.attributes || {} });
        if (i < potong.length - 1) {
          baris.push({ isi, blok: op.attributes || {} });
          isi = [];
        }
      });
    } else if (op.insert && typeof op.insert === 'object' && op.insert.image) {
      isi.push({ gambar: op.insert.image, a: op.attributes || {} });
    }
  }
  if (isi.length) baris.push({ isi, blok: {} });
  return baris;
}

/**
 * Render Delta menjadi HTML.
 * opsi.gantiGambar(src, urutan) -> src baru (dipakai build untuk memindah data URL ke berkas)
 */
export function deltaKeHtml(delta, opsi = {}) {
  const baris = deltaKeBaris(delta);
  const keluar = [];
  let daftar = null; // { tag, item: [] }
  let kutipan = null;
  let nomorGambar = 0;
  const tutupDaftar = () => {
    if (daftar) keluar.push(`<${daftar.tag}>${daftar.item.join('')}</${daftar.tag}>`);
    daftar = null;
  };
  const tutupKutipan = () => {
    if (kutipan) keluar.push(`<blockquote>${kutipan.join('')}</blockquote>`);
    kutipan = null;
  };

  for (const b of baris) {
    const hanyaGambar = b.isi.length === 1 && b.isi[0].gambar;
    const html = b.isi
      .map((s) => {
        if (s.gambar) {
          let src = gambarAman(s.gambar);
          if (opsi.gantiGambar && src) src = opsi.gantiGambar(src, nomorGambar);
          nomorGambar++;
          return src ? `<img src="${esc(src)}" alt="${esc(s.a.alt || '')}" loading="lazy" decoding="async">` : '';
        }
        return inline(s.teks, s.a);
      })
      .join('');
    const blok = b.blok;
    const jenisDaftar = blok.list === 'ordered' ? 'ol' : blok.list ? 'ul' : null;

    if (!jenisDaftar) tutupDaftar();
    if (!blok.blockquote) tutupKutipan();

    if (jenisDaftar) {
      if (daftar && daftar.tag !== jenisDaftar) tutupDaftar();
      if (!daftar) daftar = { tag: jenisDaftar, item: [] };
      daftar.item.push(`<li>${html}</li>`);
    } else if (blok.blockquote) {
      if (!kutipan) kutipan = [];
      if (html) kutipan.push(`<p>${html}</p>`);
    } else if (blok.header === 2 || blok.header === 1) {
      if (html) keluar.push(`<h2>${html}</h2>`);
    } else if (blok.header === 3) {
      if (html) keluar.push(`<h3>${html}</h3>`);
    } else if (hanyaGambar) {
      keluar.push(`<figure>${html}</figure>`);
    } else if (html.trim()) {
      keluar.push(`<p>${html}</p>`);
    }
  }
  tutupDaftar();
  tutupKutipan();
  return keluar.join('\n');
}

/** Teks polos dari Delta, untuk ringkasan otomatis dan pencarian. */
export function deltaKeTeks(delta) {
  return deltaKeBaris(delta)
    .map((b) => b.isi.map((s) => s.teks || '').join(''))
    .filter(Boolean)
    .join('\n');
}

/** Hitung perkiraan waktu baca (menit). */
export function lamaBaca(delta) {
  const kata = deltaKeTeks(delta).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(kata / 200));
}

export const KATEGORI_KABAR = ['Kegiatan', 'Berita', 'Pengumuman', 'Opini', 'Dharma Sastra'];

export function buatSlug(teks) {
  return String(teks || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join('-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .replace(/-$/, '');
}

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
/** Tanggal gaya Indonesia tanpa Intl (aman dipakai di Node build). Zona WITA (NTB). */
export function tanggalPanjang(ms) {
  if (!ms) return '';
  const d = new Date(Number(ms) + 8 * 3600e3);
  return `${d.getUTCDate()} ${BULAN[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
