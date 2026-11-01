# Panduan pengelolaan situs

## Cara kerja singkat

- **GitHub Pages** menyajikan halaman. Setiap perubahan di cabang `main` terbit otomatis, dan situs dibangun ulang tiap jam supaya kabar baru mendapat halaman sendiri.
- **Firebase** menyimpan booking, testimoni, kabar, dan akun. Paket gratis Spark sudah cukup.
- Tanpa Firebase, formulir booking tetap jalan lewat WhatsApp. Testimoni dan panel pengurus baru aktif sesudah Firebase tersambung.

## Menyambungkan Firebase

1. Buat proyek di [console.firebase.google.com](https://console.firebase.google.com), sebaiknya dengan akun Google yayasan. Lewati Analytics.
2. **Authentication → Sign-in method**, aktifkan tiga metode:
   - **Anonymous**, supaya pengunjung bisa booking tanpa akun
   - **Email/Password**
   - **Google**
3. **Firestore Database → Create database**, pilih lokasi `asia-southeast2` (Jakarta) dan mode produksi. Lokasi tidak bisa diubah sesudahnya.
4. **Firestore → Rules**, salin seluruh isi `firestore.rules`, lalu **Publish**.
5. **Project settings → Your apps → Web**, daftarkan aplikasi lalu salin nilai `firebaseConfig` ke bagian `firebase` di `situs.config.json`.
6. **Authentication → Settings → Authorized domains**, tambahkan `bagusjaya0509-maker.github.io`.
7. Push ke `main`. Situs otomatis beralih ke mode Firebase.
8. Buka situs, tekan **Masuk**, lalu daftar atau masuk dengan email pengurus utama. Verifikasi email bila diminta, kemudian buka **Panel pengurus**.

Indeks untuk saring kabar per kategori tercantum di `firestore.indexes.json`. Bila belum dibuat, menu **Sistem → Periksa koneksi** memberi tautan untuk membuatnya.

## Pengurus

- Pengurus utama diatur di dua tempat dan harus sama: `adminUtama` di `situs.config.json`, dan fungsi `adminUtama()` di `firestore.rules`.
- Pengurus lain ditambahkan dari **Panel → Pengguna & pengurus**. Orangnya harus sudah punya akun di situs.

## Pekerjaan harian di panel

- **Booking:** baca permintaan, tetapkan tanggal dan jam, lalu tekan tombol WhatsApp yang sudah berisi pesan konfirmasi. Rekap bisa diunduh sebagai Excel.
- **Testimoni:** tidak ada yang tampil sebelum ditinjau. Lihat aturan di bawah.
- **Kabar:** tulis kegiatan beserta foto. Foto otomatis diperkecil.
- **Jadwal & produk:** atur hari buka, sesi, tanggal tutup, dan nama produk yang bisa dipilih saat menulis testimoni.

## Aturan testimoni

Permenkes 1787/2010 melarang testimoni dalam iklan layanan kesehatan. BPOM melarang testimoni kesembuhan dan klaim mengobati pada iklan obat tradisional dan suplemen. Situs ini bisa terbaca sebagai promosi, jadi:

- Tampilkan cerita pengalaman, misalnya "pikiran saya lebih tenang". Jangan tampilkan janji sembuh, nama penyakit, atau jaminan hasil.
- Panel menandai kata berisiko dengan warna kuning. Daftar katanya ada di `KATA_KLAIM` pada `aset/js/rujukan.js`.
- Perbaikan ejaan boleh. Jangan menambah kalimat yang tidak ditulis pengirim, dan jangan membuat testimoni sendiri.
- Produk obat tradisional atau suplemen yang dijual perlu izin edar BPOM. Pastikan sebelum menyebutnya di situs.

Peraturan ini bisa berubah. Tanyakan ke dinas kesehatan atau BPOM setempat bila ragu.

## Terjemahan otomatis

Pemilih bahasa di kepala situs memakai widget Google Translate, gratis dan tanpa kunci. Skripnya hanya dimuat bila bahasanya bukan Indonesia. Tamu dari luar Indonesia diterjemahkan otomatis sesuai bahasa perambannya, sedangkan pengunjung di zona waktu Indonesia tetap berbahasa Indonesia kecuali memilih sendiri. Halaman akun, masuk, dan panel tidak diterjemahkan. Tambah `translate="no"` pada teks yang tidak boleh ikut diterjemahkan.

Google tidak lagi membuka widget ini untuk pendaftar baru, tetapi yang sudah ada masih berjalan. Bila suatu saat berhenti, situs tetap tampil normal dalam bahasa Indonesia.

## Domain sendiri

Kop surat yayasan mencantumkan `cahayaterataiputih.org`, tetapi domain ini belum terdaftar per 1 November 2026, sehingga email `Info@cahayaterataiputih.org` belum bisa menerima pesan.

Sesudah membeli domain:

1. GitHub → Settings → Pages → Custom domain, isi nama domainnya.
2. Di penyedia domain, arahkan DNS sesuai panduan GitHub Pages, lalu aktifkan **Enforce HTTPS**.
3. Ubah `situs.url` di `situs.config.json`.
4. Tambahkan domain itu di Firebase **Authorized domains**.
5. Bila email bisnis sudah aktif, ganti `kontak.email` dan `notifikasi.emailBookingBaru`.

## Pemberitahuan email

Situs mengirim pemberitahuan booking baru lewat FormSubmit, berisi nomor, keperluan, dan tanggal saja. Pada booking pertama, FormSubmit mengirim email aktivasi ke alamat `notifikasi.emailBookingBaru`. Klik tautannya sekali.

## Yang tidak boleh masuk repositori

Repositori ini publik. Berkas legal asli, NIK, dan alamat pribadi pengurus disimpan di `administrasi/`, yang tidak ikut terunggah.
