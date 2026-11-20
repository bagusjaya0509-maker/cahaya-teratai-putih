// Subtitle terjemahan video Dharma Wacana. Videonya sudah bersubtitle Indonesia (tertanam);
// pengunjung yang memilih bahasa lain melihat terjemahan di bawah pemutar, seirama dengan video.
// Data: aset/subtitle/<idYouTube>.json (dibuat skrip/buat-subtitle-video.py).
import { BASE, lokalBaca } from './inti.js';

export function bahasaSitus() {
  const simpan = lokalBaca('ctp.bahasa');
  if (simpan) return simpan;
  const m = /(?:^|;\s*)googtrans=\/id\/([\w-]+)/.exec(document.cookie);
  return m ? m[1] : 'id';
}

let apiSiap;
function muatApi() {
  if (window.YT?.Player) return Promise.resolve();
  if (apiSiap) return apiSiap;
  apiSiap = new Promise((r) => {
    const lama = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { lama?.(); r(); };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.append(s);
  });
  return apiSiap;
}

const cache = new Map();
async function ambil(id) {
  if (!cache.has(id)) cache.set(id, fetch(`${BASE}aset/subtitle/${id}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null));
  return cache.get(id);
}

/** Pasang subtitle terjemahan pada setiap pemutar di dalam `akar`. */
export async function pasangSubtitle(akar = document) {
  const bahasa = bahasaSitus();
  if (!bahasa || bahasa === 'id') return;
  for (const wadah of akar.querySelectorAll('[data-sub-video]')) {
    if (wadah.dataset.subPasang) continue;
    wadah.dataset.subPasang = '1';
    const id = wadah.dataset.subVideo;
    const data = await ambil(id);
    const baris = data?.[bahasa] || data?.[bahasa.split('-')[0]];
    if (!baris) continue;
    const iframe = wadah.closest('.pemutar-wadah')?.querySelector('iframe');
    if (!iframe) continue;
    await muatApi();
    const teks = wadah;
    teks.hidden = false;
    let pemutar, jam;
    const tulis = () => {
      const t = pemutar?.getCurrentTime?.() ?? 0;
      const i = data.waktu.findIndex(([a, b]) => t >= a && t < b);
      const isi = i >= 0 ? baris[i] : '';
      if (teks.textContent !== isi) teks.textContent = isi;
    };
    pemutar = new window.YT.Player(iframe, {
      events: {
        onReady: () => { clearInterval(jam); jam = setInterval(tulis, 200); },
      },
    });
    // jendela pemutar ditutup -> berhenti
    const dlg = wadah.closest('dialog');
    dlg?.addEventListener('close', () => clearInterval(jam), { once: true });
  }
}
