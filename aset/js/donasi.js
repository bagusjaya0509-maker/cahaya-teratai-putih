// Halaman donasi: tombol salin nomor rekening.
import { $$, roti } from './inti.js';

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
