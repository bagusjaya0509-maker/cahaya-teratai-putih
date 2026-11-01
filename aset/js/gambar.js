// Kompres gambar di peramban sebelum disimpan. Firestore membatasi satu
// dokumen 1 MB, jadi foto kamera ponsel (3–8 MB) wajib diperkecil dulu.

async function bukaGambar(berkas) {
  if ('createImageBitmap' in window) {
    try { return await createImageBitmap(berkas); } catch { /* jatuh ke <img> */ }
  }
  const url = URL.createObjectURL(berkas);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/** Kembalikan data URL JPEG dengan sisi terpanjang <= maks piksel. */
export async function kompres(berkas, { maks = 1600, mutu = 0.78, rasio = null } = {}) {
  const g = await bukaGambar(berkas);
  let sw = g.width, sh = g.height, sx = 0, sy = 0;
  if (rasio) {
    // potong ke tengah mengikuti rasio (lebar / tinggi)
    if (sw / sh > rasio) { const w = sh * rasio; sx = (sw - w) / 2; sw = w; }
    else { const h = sw / rasio; sy = (sh - h) / 2; sh = h; }
  }
  const skala = Math.min(1, maks / Math.max(sw, sh));
  const w = Math.round(sw * skala), h = Math.round(sh * skala);
  const kanvas = document.createElement('canvas');
  kanvas.width = w;
  kanvas.height = h;
  const ctx = kanvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(g, sx, sy, sw, sh, 0, 0, w, h);
  let hasil = kanvas.toDataURL('image/jpeg', mutu);
  // Masih terlalu besar? turunkan mutu bertahap.
  for (let q = mutu - 0.1; ukuranDataUrl(hasil) > 700_000 && q > 0.4; q -= 0.1) hasil = kanvas.toDataURL('image/jpeg', q);
  return hasil;
}

export const ukuranDataUrl = (d) => Math.round(((d?.length || 0) - (d?.indexOf(',') + 1 || 0)) * 0.75);

export function bacaDataUrl(berkas) {
  return new Promise((ok, gagal) => {
    const r = new FileReader();
    r.onload = () => ok(r.result);
    r.onerror = () => gagal(r.error);
    r.readAsDataURL(berkas);
  });
}

export const formatUkuran = (b) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);
