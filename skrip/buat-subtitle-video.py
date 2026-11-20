# Subtitle terjemahan untuk video Dharma Wacana (20 Nov 2026).
# Video sudah memuat subtitle Indonesia tertanam; pengunjung yang memilih bahasa lain di situs
# melihat terjemahan di bawah pemutar (aset/js/subtitle-video.js), seirama dengan video YouTube.
# Sumber: transkrip proyek edit (kata.json), timeline video = pembuka + waktu jawaban.
# Pakai: python skrip/buat-subtitle-video.py   -> aset/subtitle/<idYouTube>.json
import json, os, re, time, urllib.parse, urllib.request

PROYEK = r'D:\Edit Video Yayasan\Proyek Konten'
KELUAR = os.path.join(os.path.dirname(__file__), '..', 'aset', 'subtitle')
BAHASA = ['en', 'de', 'fr', 'es', 'nl', 'ru', 'ja', 'ko', 'zh-CN']
VIDEO = {   # id YouTube -> folder proyek edit
    'DVCFYLU7G0Y': '03-tanya-2', 'm9IAaGf4hbQ': '03-tanya-3', 'ZM0gEG0JHdc': '03-tanya-4',
    'b8r6XS8Lm5s': '04-biru-1', 'WzBvXJ5jgys': '04-biru-2', 'Ha4if9kLQyw': '04-biru-3',
}

def cue_dari(proyek):
    d = json.load(open(os.path.join(PROYEK, proyek, 'kata.json'), encoding='utf-8'))
    r = json.load(open(os.path.join(PROYEK, proyek, 'rencana.json'), encoding='utf-8'))
    awal = float(r.get('pembuka', 4.6))
    kata = []
    for t, a, b in d['kata']:
        if t.startswith('-') and kata: kata[-1][0] += t; kata[-1][2] = b; continue
        if t.strip(): kata.append([t, a, b])
    cue, cur = [], []
    for w in kata:
        cur.append(w)
        teks = ' '.join(x[0] for x in cur)
        if re.search(r'[.?!]$', w[0]) or len(teks) > 80 or (w[0].endswith(',') and len(teks) > 50):
            cue.append(cur); cur = []
    if cur: cue.append(cur)
    hasil = []
    # pertanyaan di sampul pembuka
    tanya = ' '.join(r['judul'].split()) + (' ' + r['sub'] if r.get('sub') and '?' not in r['judul'] else '')
    hasil.append([0.3, round(awal - 0.1, 2), tanya])
    for i, c in enumerate(cue):
        a = c[0][1] + awal
        b = c[-1][2] + awal + 0.4
        if i + 1 < len(cue): b = min(b, cue[i + 1][0][1] + awal)
        teks = ' '.join(x[0] for x in c)
        hasil.append([round(a, 2), round(b, 2), teks[0].upper() + teks[1:]])
    return hasil

# Nama diri & istilah agama tidak diterjemahkan: diganti penanda dulu, dikembalikan sesudahnya.
KUNCI_ISTILAH = ['Cahaya Teratai Putih', 'Pasraman', 'Hyang Widhi', 'Ida Bagus Wiradharma', 'Kitab Wariga', 'Wariga',
                 'Satwika', 'Rajasika', 'Tamasika', 'yadnya', 'Yadnya', 'upakara', 'sedharma', 'Purnama', 'purnama',
                 'Galungan', 'Kuningan', 'kawitan', 'jnana', 'niskala', 'sekala', 'pelukatan']
def tutup(t):
    for n, k in enumerate(KUNCI_ISTILAH):
        t = re.sub(r'\b' + re.escape(k) + r'\b', f'ZQ{n}Q', t)
    return t
def buka(t):
    return re.sub(r'ZQ\s?(\d+)\s?Q', lambda m: KUNCI_ISTILAH[int(m.group(1))], t)

def terjemahkan(baris, tl):
    """Google Translate (layanan yang juga dipakai penerjemah situs); baris dipisah baris baru agar urutan terjaga."""
    baris = [tutup(b) for b in baris]
    return [buka(x) for x in _terjemahkan(baris, tl)]

def _terjemahkan(baris, tl):
    keluar = []
    for i in range(0, len(baris), 25):
        potong = baris[i:i + 25]
        q = '\n'.join(potong)
        url = 'https://translate.googleapis.com/translate_a/single?' + urllib.parse.urlencode(
            {'client': 'gtx', 'sl': 'id', 'tl': tl, 'dt': 't', 'q': q})
        d = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=60))
        teks = ''.join(s[0] for s in d[0] if s[0])
        hasil = [x.strip() for x in teks.split('\n')]
        if len(hasil) != len(potong):   # cadangan: satu per satu
            hasil = []
            for b in potong:
                u = 'https://translate.googleapis.com/translate_a/single?' + urllib.parse.urlencode({'client': 'gtx', 'sl': 'id', 'tl': tl, 'dt': 't', 'q': b})
                dd = json.load(urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=60))
                hasil.append(''.join(s[0] for s in dd[0] if s[0]).strip()); time.sleep(0.3)
        keluar += hasil
        time.sleep(0.5)
    return keluar

os.makedirs(KELUAR, exist_ok=True)
for vid, proyek in VIDEO.items():
    tujuan = os.path.join(KELUAR, f'{vid}.json')
    if os.path.exists(tujuan):
        print('sudah ada', vid); continue
    cue = cue_dari(proyek)
    data = {'waktu': [[a, b] for a, b, _ in cue], 'id': [t for _, _, t in cue]}
    for tl in BAHASA:
        data[tl] = terjemahkan(data['id'], tl)
    json.dump(data, open(tujuan, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(vid, proyek, len(cue), 'baris')
