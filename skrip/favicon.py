# Menurunkan ikon peramban dan hasil pencarian dari lambang-512.png.
# Garis lambang dipertebal dulu supaya tidak pucat saat dikecilkan; bentuknya tetap.
# Jalankan dari akar proyek: python skrip/favicon.py
from PIL import Image, ImageFilter

ASAL = 'aset/img/lambang-512.png'
UKURAN_PNG = (48, 96, 192)        # Google menyarankan kelipatan 48 px
UKURAN_ICO = [(16, 16), (32, 32), (48, 48)]


def tegas(ukuran):
    # Makin kecil ikonnya, makin tebal garis yang dibutuhkan.
    tebal = 9 if ukuran <= 48 else 5 if ukuran <= 96 else 3
    return Image.open(ASAL).convert('RGB').filter(ImageFilter.MinFilter(tebal)).resize((ukuran, ukuran), Image.LANCZOS)


for u in UKURAN_PNG:
    tegas(u).save(f'aset/img/favicon-{u}.png', optimize=True)
tegas(48).save('aset/img/favicon.ico', sizes=UKURAN_ICO)
print('selesai')
