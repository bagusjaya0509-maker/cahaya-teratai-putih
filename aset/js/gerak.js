// Bagian halaman muncul halus saat digulir. Yang sudah terlihat ketika halaman dibuka
// tidak disembunyikan, dan bila pemantau gulir tidak berjalan semuanya tetap tampil.
const PILIHAN = [
  '.bagian-kepala', '.profil-teks', '.profil-foto', '.fakta > div', '.visi-kisi > div', '.nilai-daftar li',
  '.kisi-bidang > .bidang', '.lajur-kiri', '.daftar-layanan li', '.geser', '.purnama-isi', '.ajakan-testimoni',
  '.pita-kain-isi > *', '.legal-kisi > div', '.blok', '.kisi-tiga > .kartu', '.kisi-dua > .kartu', '.pengurus', '.tanya-jawab details',
].join(',');

const halus = !matchMedia('(prefers-reduced-motion: reduce)').matches;
if (halus && 'IntersectionObserver' in window) {
  const batas = innerHeight * 0.92;
  const daftar = [...document.querySelectorAll(PILIHAN)].filter((el) => el.getBoundingClientRect().top > batas);
  let berjalan = false;

  const tampilkan = (el) => {
    el.classList.add('tampak');
    // Kelas dilepas sesudah selesai supaya efek arahkan kursor tidak terganggu.
    setTimeout(() => el.classList.remove('m', 'tampak'), 1400);
  };

  const io = new IntersectionObserver((entri) => {
    berjalan = true;
    for (const e of entri) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      tampilkan(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  daftar.forEach((el) => {
    const saudara = [...el.parentElement.children].filter((x) => daftar.includes(x));
    el.style.setProperty('--tunda', `${Math.min(saudara.indexOf(el), 5) * 80}ms`);
    el.classList.add('m');
    io.observe(el);
  });

  setTimeout(() => {
    if (berjalan) return;
    io.disconnect();
    daftar.forEach(tampilkan);
  }, 1800);
}
