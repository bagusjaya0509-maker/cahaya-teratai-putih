# Menggambar motif garis melingkar untuk halaman masuk (aset/img/motif-batik.webp).
# Hasilnya hanya alfa: warnanya mengikuti currentColor lewat CSS mask.
# Jalankan dari akar proyek: python skrip/motif-batik.py
import numpy as np
from PIL import Image

SISI = 1400       # ukuran akhir
SKALA = 1.5       # digambar lebih besar lalu dikecilkan supaya tepinya halus
JARAK = 19        # jarak antargaris
TEBAL = 2.1       # tebal garis
JUMLAH = 170      # jumlah gumpalan
BENIH = 11

n = int(SISI * SKALA)
acak = np.random.default_rng(BENIH)
y, x = np.mgrid[0:n, 0:n].astype(np.float32) / SKALA

# Pelengkungan ruang supaya bentuknya mengalir, tidak bulat sempurna.
u = x + 46 * np.sin(y / 170 + 0.7) + 28 * np.sin((x + y) / 95 + 2.1) + 14 * np.sin(x / 48 - y / 61)
v = y + 46 * np.sin(x / 190 + 1.9) + 26 * np.sin((x - y) / 110 + 0.4) + 14 * np.sin(y / 52 + x / 67)

# Dasar: lingkaran besar dari titik di luar bidang.
d = np.hypot(u + 300, v - SISI * 0.4)
pemilik = np.zeros((n, n), dtype=np.int16)

# Gumpalan besar digambar lebih dulu, lingkaran kecil belakangan supaya berada di atas.
jari = np.sort(acak.choice([48.0, 75.0, 120.0, 175.0, 240.0], JUMLAH, p=[0.26, 0.3, 0.26, 0.13, 0.05]) * acak.uniform(0.85, 1.15, JUMLAH))[::-1]
for i, r in enumerate(jari.tolist(), 1):
    cx, cy = acak.uniform(-90, SISI + 90, 2)
    lonjong = acak.uniform(1.0, 1.25) if r < 90 else acak.uniform(1.0, 1.6)
    arah = acak.uniform(0, np.pi)
    f1, f2 = acak.uniform(0, 6.28, 2)
    ukur = r * lonjong * 1.4
    x0, x1 = max(0, int((cx - ukur - 110) * SKALA)), min(n, int((cx + ukur + 110) * SKALA))
    y0, y1 = max(0, int((cy - ukur - 110) * SKALA)), min(n, int((cy + ukur + 110) * SKALA))
    if x0 >= x1 or y0 >= y1:
        continue
    du, dv = u[y0:y1, x0:x1] - cx, v[y0:y1, x0:x1] - cy
    a = du * np.cos(arah) + dv * np.sin(arah)
    b = -du * np.sin(arah) + dv * np.cos(arah)
    sudut = np.arctan2(b, a)
    tepi = 1 + 0.07 * np.sin(2 * sudut + f1) + 0.05 * np.sin(3 * sudut + f2)
    rho = np.hypot(a / lonjong, b) / (r * tepi)
    kena = rho <= 1
    d[y0:y1, x0:x1][kena] = ((1 - rho[kena]) * r)
    pemilik[y0:y1, x0:x1][kena] = i

# Garis cincin.
# Dibagi kemiringan medan supaya tebal garis rata di bagian rapat maupun renggang.
gy, gx = np.gradient(d)
miring = np.clip(np.hypot(gx, gy) * SKALA, 0.45, 2.2)
jarak_ke_garis = np.abs(((d + JARAK / 2) % JARAK) - JARAK / 2) / miring
alfa = np.clip((TEBAL * SKALA / 2 + 0.6 - jarak_ke_garis * SKALA) / 1.2, 0, 1)

# Garis tepi tiap gumpalan.
batas = np.zeros((n, n), dtype=bool)
batas[:, 1:] |= pemilik[:, 1:] != pemilik[:, :-1]
batas[1:, :] |= pemilik[1:, :] != pemilik[:-1, :]
tebal = int(round(TEBAL * SKALA / 2))
for g in range(1, tebal + 1):
    batas[:, g:] |= batas[:, :-g]
    batas[g:, :] |= batas[:-g, :]
alfa = np.maximum(alfa, batas.astype(np.float32))

hasil = Image.fromarray((alfa * 255).astype(np.uint8), 'L').resize((SISI, SISI), Image.LANCZOS)
rgba = Image.merge('RGBA', (Image.new('L', hasil.size, 255),) * 3 + (hasil,))
rgba.save('aset/img/motif-batik.webp', quality=60, alpha_quality=70, method=6)
print('selesai', rgba.size)
