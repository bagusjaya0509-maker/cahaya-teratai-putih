// Pembaca Firestore lewat REST, tanpa SDK. Halaman publik memakai ini supaya
// pengunjung tidak perlu mengunduh ratusan KB pustaka Firebase hanya untuk
// membaca kabar. Skrip build Node juga memakai berkas yang sama.

function nilai(v) {
  if (!v || typeof v !== 'object') return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return Date.parse(v.timestampValue);
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(nilai);
  if ('mapValue' in v) {
    const o = {};
    for (const [k, x] of Object.entries(v.mapValue.fields || {})) o[k] = nilai(x);
    return o;
  }
  return null;
}

export function dariDokumen(dok) {
  const o = { id: dok.name.split('/').pop() };
  for (const [k, v] of Object.entries(dok.fields || {})) o[k] = nilai(v);
  return o;
}

const akar = (pid) => `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents`;

export class GalatRest extends Error {
  constructor(pesan, status, tautanIndeks) {
    super(pesan);
    this.status = status;
    this.tautanIndeks = tautanIndeks || '';
  }
}

async function minta(url, init, fetchFn) {
  const r = await fetchFn(url, init);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = Array.isArray(j) ? j[0]?.error : j.error;
    const pesan = e?.message || `HTTP ${r.status}`;
    const tautan = (pesan.match(/https:\/\/console\.firebase\.google\.com\S+/) || [])[0];
    throw new GalatRest(pesan, e?.status || r.status, tautan);
  }
  return j;
}

/** Daftar kabar terbit, terbaru dulu. setelah = terbitPada (ms) item terakhir halaman sebelumnya. */
export async function kueriKabar({ projectId, apiKey, batas = 12, setelah = null, kategori = null, fetchFn = fetch }) {
  const q = {
    from: [{ collectionId: 'kabar' }],
    orderBy: [{ field: { fieldPath: 'terbitPada' }, direction: 'DESCENDING' }],
    limit: batas,
  };
  if (kategori) q.where = { fieldFilter: { field: { fieldPath: 'kategori' }, op: 'EQUAL', value: { stringValue: kategori } } };
  if (setelah) q.startAt = { values: [{ timestampValue: new Date(setelah).toISOString() }], before: false };
  const j = await minta(`${akar(projectId)}:runQuery?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery: q }),
  }, fetchFn);
  return j.filter((x) => x.document).map((x) => dariDokumen(x.document));
}

/** Testimoni yang sudah ditinjau pengurus, terbaru dulu. */
export async function kueriTestimoni({ projectId, apiKey, batas = 60, fetchFn = fetch }) {
  const q = {
    from: [{ collectionId: 'testimoniPublik' }],
    orderBy: [{ field: { fieldPath: 'tampilPada' }, direction: 'DESCENDING' }],
    limit: batas,
  };
  const j = await minta(`${akar(projectId)}:runQuery?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery: q }),
  }, fetchFn);
  return j.filter((x) => x.document).map((x) => dariDokumen(x.document));
}

/** Ambil satu dokumen; null bila tidak ada. */
export async function ambilDokumen({ projectId, apiKey, jalur, fetchFn = fetch }) {
  try {
    const j = await minta(`${akar(projectId)}/${jalur}?key=${apiKey}`, {}, fetchFn);
    return dariDokumen(j);
  } catch (e) {
    if (e.status === 'NOT_FOUND' || e.status === 404) return null;
    throw e;
  }
}
