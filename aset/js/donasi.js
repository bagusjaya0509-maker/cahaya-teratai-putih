// Halaman donasi: tombol salin nomor rekening dan laporan dana terbuka.
import { $, $$, esc, roti } from './inti.js';
import { ambilRingkasanKas } from './publik.js';
import { tanggalBooking } from './rujukan.js';

$$('[data-salin-rekening]').forEach((t) => {
  t.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(t.dataset.salinRekening);
      roti('Nomor rekening disalin.', 'berhasil');
    } catch {
      prompt('Salin nomor rekening ini:', t.dataset.salinRekening);
    }
  });
});

// ---------- laporan dana (dari kasPublik/ringkasan, diperbarui panel kebendaharaan) ----------
const rp = (n) => (n < 0 ? '−' : '') + 'Rp' + Math.abs(Math.round(n || 0)).toLocaleString('id-ID');
const wadah = $('[data-laporan-dana]');
if (wadah) {
  ambilRingkasanKas().then((r) => {
    if (!r || !r.jumlahTransaksi) {
      wadah.innerHTML = '<p class="catatan-kecil">Laporan dana akan tampil di sini setelah bendahara mulai mencatat transaksi.</p>';
      return;
    }
    const bidang = Object.entries(r.perBidangKeluar || {}).sort((a, b) => b[1] - a[1]);
    const maks = Math.max(1, ...bidang.map(([, v]) => v));
    wadah.innerHTML = `
      <div class="kisi-tiga laporan-angka">
        <div class="kartu"><p class="laporan-label">Total dana masuk</p><p class="laporan-nilai">${rp(r.masuk)}</p></div>
        <div class="kartu"><p class="laporan-label">Total dana tersalurkan</p><p class="laporan-nilai">${rp(r.keluar)}</p></div>
        <div class="kartu"><p class="laporan-label">Saldo yayasan</p><p class="laporan-nilai">${rp(r.saldo)}</p></div>
      </div>
      ${bidang.length ? `<h3>Penggunaan dana per bidang</h3><div class="laporan-batang">${bidang.map(([k, v]) => `<div><span>${esc(k)}</span><i style="--l:${(v / maks * 100).toFixed(1)}%"></i><b>${rp(v)}</b></div>`).join('')}</div>` : ''}
      <h3>Transaksi terakhir</h3>
      <div class="tabel-wadah"><table class="tabel laporan-tabel"><thead><tr><th>Tanggal</th><th>Uraian</th><th style="text-align:right">Jumlah</th></tr></thead><tbody>
      ${(r.terakhir || []).slice(0, 15).map((t) => `<tr><td>${esc(tanggalBooking(t.tanggal))}</td><td>${t.jenis === 'masuk' ? `Donasi dari ${esc(t.nama || 'Hamba Tuhan')}<small>${esc(t.kategori)}</small>` : `${esc(t.keterangan)}<small>${esc(t.kategori)}${t.bukti ? ' · kuitansi tersimpan' : ''}</small>`}</td><td style="text-align:right;white-space:nowrap" class="${t.jenis === 'masuk' ? 'laporan-masuk' : 'laporan-keluar'}">${t.jenis === 'masuk' ? '+' : '−'}${rp(t.jumlah)}</td></tr>`).join('')}
      </tbody></table></div>
      <p class="catatan-kecil">Dicatat oleh bendahara yayasan beserta kuitansi setiap pengeluaran. ${r.diubah ? `Diperbarui ${esc(new Date(r.diubah).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }))}.` : ''}</p>`;
  }).catch(() => { wadah.innerHTML = '<p class="catatan-kecil">Laporan dana belum dapat dimuat.</p>'; });
}
