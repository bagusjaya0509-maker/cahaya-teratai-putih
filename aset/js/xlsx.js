// Penulis berkas Excel (.xlsx) kecil tanpa pustaka luar.
// XLSX = arsip ZIP berisi beberapa XML; arsip di sini memakai metode
// "stored" (tanpa kompresi) yang tetap dibaca Excel, LibreOffice, dan Sheets.

const enc = new TextEncoder();
const TABEL_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(b) {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = TABEL_CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zip(berkas) {
  const bagian = [];
  const pusat = [];
  let offset = 0;
  for (const { nama, isi } of berkas) {
    const n = enc.encode(nama);
    const d = typeof isi === 'string' ? enc.encode(isi) : isi;
    const crc = crc32(d);
    const lokal = new DataView(new ArrayBuffer(30));
    lokal.setUint32(0, 0x04034b50, true);
    lokal.setUint16(4, 20, true);
    lokal.setUint16(6, 0x0800, true); // UTF-8
    lokal.setUint16(8, 0, true);
    lokal.setUint32(14, crc, true);
    lokal.setUint32(18, d.length, true);
    lokal.setUint32(22, d.length, true);
    lokal.setUint16(26, n.length, true);
    bagian.push(new Uint8Array(lokal.buffer), n, d);
    const p = new DataView(new ArrayBuffer(46));
    p.setUint32(0, 0x02014b50, true);
    p.setUint16(4, 20, true);
    p.setUint16(6, 20, true);
    p.setUint16(8, 0x0800, true);
    p.setUint32(16, crc, true);
    p.setUint32(20, d.length, true);
    p.setUint32(24, d.length, true);
    p.setUint16(28, n.length, true);
    p.setUint32(42, offset, true);
    pusat.push(new Uint8Array(p.buffer), n);
    offset += 30 + n.length + d.length;
  }
  const ukuranPusat = pusat.reduce((s, b) => s + b.length, 0);
  const akhir = new DataView(new ArrayBuffer(22));
  akhir.setUint32(0, 0x06054b50, true);
  akhir.setUint16(8, berkas.length, true);
  akhir.setUint16(10, berkas.length, true);
  akhir.setUint32(12, ukuranPusat, true);
  akhir.setUint32(16, offset, true);
  return new Blob([...bagian, ...pusat, new Uint8Array(akhir.buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

const x = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
function kolom(i) {
  let s = '';
  for (i += 1; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
  return s;
}

/**
 * Buat .xlsx dari beberapa lembar.
 * lembar: [{ nama, kolom: [{judul, lebar}], baris: [[...nilai]] }]
 */
export function buatXlsx(lembar) {
  const sheets = lembar.map((l, si) => {
    const semua = [l.kolom.map((k) => k.judul), ...l.baris];
    const rows = semua
      .map((baris, r) => `<row r="${r + 1}">${baris
        .map((v, c) => {
          const ref = `${kolom(c)}${r + 1}`;
          const gaya = r === 0 ? ' s="1"' : ' s="2"';
          if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}"${gaya}><v>${v}</v></c>`;
          return `<c r="${ref}" t="inlineStr"${gaya}><is><t xml:space="preserve">${x(v)}</t></is></c>`;
        })
        .join('')}</row>`)
      .join('');
    const cols = `<cols>${l.kolom.map((k, i) => `<col min="${i + 1}" max="${i + 1}" width="${k.lebar || 18}" customWidth="1"/>`).join('')}</cols>`;
    return {
      nama: `xl/worksheets/sheet${si + 1}.xml`,
      isi: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>${cols}<sheetData>${rows}</sheetData><autoFilter ref="A1:${kolom(l.kolom.length - 1)}${semua.length}"/></worksheet>`,
    };
  });
  const berkas = [
    { nama: '[Content_Types].xml', isi: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((s) => `<Override PartName="/${s.nama}" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>` },
    { nama: '_rels/.rels', isi: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { nama: 'xl/workbook.xml', isi: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${lembar.map((l, i) => `<sheet name="${x(l.nama).slice(0, 31)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>` },
    { nama: 'xl/_rels/workbook.xml.rels', isi: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${lembar.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${lembar.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { nama: 'xl/styles.xml', isi: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF8F1D21"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>' },
    ...sheets,
  ];
  return zip(berkas);
}

export function unduhBlob(blob, nama) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nama;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
