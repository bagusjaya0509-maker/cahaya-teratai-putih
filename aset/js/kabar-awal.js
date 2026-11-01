// Kabar pertama, disusun dari berkas resmi yayasan: Sejarah Singkat (5 Februari 2025),
// Keputusan Menkumham AHU-0011828.AH.01.04.Tahun 2024, dan Tanda Daftar Ditjen Bimas
// Hindu Nomor 160/DJ.VI/BA.01.1/02/2025. Mode demo memakainya sebagai isi awal; di
// panel pengurus ada tombol untuk menerbitkannya ke Firebase.

const p = (teks) => [{ insert: teks }, { insert: '\n' }];
const h2 = (teks) => [{ insert: teks }, { insert: '\n', attributes: { header: 2 } }];
const li = (teks) => [{ insert: teks }, { insert: '\n', attributes: { list: 'bullet' } }];
const jadi = (...potong) => JSON.stringify(potong.flat());
const wita = (t) => Date.parse(t + 'T09:00:00+08:00');

export const KABAR_AWAL = [
  {
    slug: 'yayasan-cahaya-teratai-putih-terdaftar-di-ditjen-bimas-hindu',
    judul: 'Yayasan Cahaya Teratai Putih Terdaftar di Ditjen Bimas Hindu',
    kategori: 'Berita',
    penulis: 'Sekretariat Yayasan',
    terbitPada: wita('2025-02-05'),
    unggulan: true,
    ringkasan: 'Tanda Daftar Nomor 160/DJ.VI/BA.01.1/02/2025 menempatkan yayasan dalam binaan Direktorat Jenderal Bimbingan Masyarakat Hindu sampai 5 Februari 2028.',
    sampulKecil: 'homma',
    delta: jadi(
      p('Direktorat Jenderal Bimbingan Masyarakat Hindu Kementerian Agama mencatat Yayasan Cahaya Teratai Putih sebagai lembaga keagamaan Hindu yang terdaftar dan berada dalam binaannya. Tanda Daftar Nomor 160/DJ.VI/BA.01.1/02/2025 terbit di Jakarta pada 5 Februari 2025 dan berlaku sampai 5 Februari 2028.'),
      p('Pendaftaran ini berjalan berjenjang. Penyelenggara Bimas Hindu Kantor Kementerian Agama Kota Mataram memberikan rekomendasi pada 13 Desember 2024 sesudah memantau kegiatan pembinaan umat di Kecamatan Cakranegara. Bidang Bimas Hindu Kantor Wilayah Kementerian Agama Provinsi NTB menyusul dengan rekomendasi pada 19 Desember 2024.'),
      h2('Catatan legalitas yayasan'),
      li('Pengesahan badan hukum: Keputusan Menkumham AHU-0011828.AH.01.04.Tahun 2024, 30 Juli 2024'),
      li('Akta pendirian: Nomor 17, 27 Juli 2024, Notaris Nurlaila, S.H., M.Kn.'),
      li('Lembaga Kesejahteraan Sosial: Tanda Pendaftaran Dinas Sosial Kota Mataram Nomor 5271/010-LKS/2024, berlaku sampai 12 November 2027'),
      li('Nomor Induk Berusaha: 1109240029659'),
    ),
  },
  {
    slug: 'dari-pasraman-menjadi-yayasan',
    judul: 'Dari Pasraman Menjadi Yayasan',
    kategori: 'Kegiatan',
    penulis: 'Sekretariat Yayasan',
    terbitPada: wita('2024-07-30'),
    ringkasan: 'Sekitar sebelas tahun berjalan sebagai pasraman, Cahaya Teratai Putih disahkan sebagai yayasan oleh Kementerian Hukum dan HAM pada 30 Juli 2024.',
    sampulKecil: 'purnama',
    delta: jadi(
      p('Cahaya Teratai Putih bermula sebagai pasraman di Mataram. Selama sekitar sebelas tahun, pasraman ini menjalankan kegiatan keagamaan dan sosial, membantu masyarakat yang membutuhkan, serta merawat ajaran leluhur Betara Sakti Dang Hyang Nirartha.'),
      p('Untuk memperkuat komitmen itu, para pendiri menghadap Notaris Nurlaila, S.H., M.Kn. pada 27 Juli 2024 dan menandatangani Akta Pendirian Nomor 17. Tiga hari kemudian, Kementerian Hukum dan HAM mengesahkannya sebagai badan hukum lewat Keputusan Nomor AHU-0011828.AH.01.04.Tahun 2024.'),
      p('Yayasan berkantor di Jalan Gora Gang Markisa Nomor 3, Cakranegara Utara, Kota Mataram, dan bergerak di tiga bidang: keagamaan, sosial, dan kemanusiaan.'),
    ),
  },
];
