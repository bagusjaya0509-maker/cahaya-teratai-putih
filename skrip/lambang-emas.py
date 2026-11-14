# Logo putih di atas lingkaran emas cerah (#EFB30F), dipilih pemilik 14 Nov 2026.
# Menghasilkan: aset/img/lambang-emas.svg, simbol #i-lambang-emas di lambang-sprite.svg,
# lambang-512.png, lambang-180.png, favicon-48/96/192.png, dan favicon.ico.
# Jalankan dari akar proyek: python skrip/lambang-emas.py
import io
import pathlib
import re

from PIL import Image, ImageDraw, ImageFilter
from playwright.sync_api import sync_playwright

EMAS = '#EFB30F'
SKALA_LOGO = 0.74            # lebar logo terhadap garis tengah lingkaran
IMG = pathlib.Path('aset/img')

putih = (IMG / 'lambang-putih.svg').read_text(encoding='utf-8')
isi = re.search(r'<svg[^>]*>(.*)</svg>', putih, re.S).group(1).replace('#fbfcf9', '#ffffff')
geser = f'translate(627 627) scale({SKALA_LOGO}) translate(-627 -627)'
(IMG / 'lambang-emas.svg').write_text(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1254 1254" role="img" '
    'aria-label="Lambang Yayasan Cahaya Teratai Putih">'
    f'<circle cx="627" cy="627" r="627" fill="{EMAS}"/><g transform="{geser}">{isi}</g></svg>',
    encoding='utf-8')

# Simbol sprite: warna logo dikunci putih lewat atribut color pada grup.
sprite = (IMG / 'lambang-sprite.svg').read_text(encoding='utf-8')
sprite = re.sub(r'<symbol id="i-lambang-emas".*?</symbol>\n?', '', sprite, flags=re.S)
simbol = (f'<symbol id="i-lambang-emas" viewBox="0 0 1254 1254"><circle cx="627" cy="627" r="627" fill="{EMAS}"/>'
          f'<g color="#ffffff" transform="{geser}"><use href="#i-surya"/><use href="#i-sosok"/><use href="#i-teratai"/></g></symbol>\n')
sprite = sprite.replace('</svg>', simbol + '</svg>')
(IMG / 'lambang-sprite.svg').write_text(sprite, encoding='utf-8')

# Topeng logo putih resolusi tinggi.
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=True)
    h = b.new_page(viewport={'width': 2048, 'height': 2048})
    h.set_content(f'<body style="margin:0;background:transparent"><img src="data:image/svg+xml;base64,'
                  f'{__import__("base64").b64encode(putih.encode()).decode()}" style="width:2048px;height:2048px;display:block"></body>')
    h.wait_for_timeout(300)
    topeng = Image.open(io.BytesIO(h.screenshot(omit_background=True))).getchannel('A')
    b.close()


def lencana(ukuran, tebal=0, penuh=False):
    # tebal: lebar filter penebal garis putih pada kanvas 512, untuk ikon kecil.
    kerja = 512
    m = topeng.resize((round(kerja * SKALA_LOGO),) * 2, Image.LANCZOS)
    if tebal:
        m = m.filter(ImageFilter.MaxFilter(tebal))
    besar = 2048
    dasar = Image.new('RGBA', (besar, besar), (0, 0, 0, 0))
    d = ImageDraw.Draw(dasar)
    if penuh:
        d.rectangle((0, 0, besar, besar), fill=EMAS)
    else:
        d.ellipse((0, 0, besar - 1, besar - 1), fill=EMAS)
    dasar = dasar.resize((kerja, kerja), Image.LANCZOS)
    o = (kerja - m.size[0]) // 2
    dasar.paste(Image.new('RGBA', m.size, (255, 255, 255, 255)), (o, o), m)
    return dasar.resize((ukuran, ukuran), Image.LANCZOS)


lencana(512).save(IMG / 'lambang-512.png', optimize=True)
lencana(180, penuh=True).convert('RGB').save(IMG / 'lambang-180.png', optimize=True)
for u, t in ((48, 7), (96, 5), (192, 3)):
    lencana(u, t).save(IMG / f'favicon-{u}.png', optimize=True)
lencana(256, 7).save(IMG / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
print('selesai')
