// Layanan yang menyimpan data: booking, testimoni, akun, dan seluruh pekerjaan
// panel pengurus.
//
// Dua mesin dengan antarmuka yang sama:
//   - firebase : Firebase Authentication + Cloud Firestore (dimuat saat perlu)
//   - demo     : localStorage, untuk mencoba di komputer sendiri
// Halaman cukup memanggil fungsi di bawah tanpa peduli mesin mana yang aktif.
//
// Pengunjung boleh booking dan menulis testimoni tanpa membuat akun: mesin firebase
// memberi sesi tamu (Anonymous Auth), jadi aturan Firestore tetap bisa mengenali
// pemilik data dan booking bisa dipantau dari perangkat yang sama.
import { KONFIG, MODE, ASAL, sesiLokal } from './inti.js';
import { nomorBooking, namaLayanan, tanggalBooking } from './rujukan.js';

const VERSI_FB = '12.19.0';
const ADMIN_UTAMA = (KONFIG.adminUtama || []).map((e) => e.toLowerCase());
const galat = (code, pesan) => Object.assign(new Error(pesan || code), { code });

// ======================================================================
// Sesi
// ======================================================================
let penggunaKini; // undefined = belum diketahui, null = belum ada sesi
const pendengar = new Set();
let siapSelesai;
const sesiSiap = new Promise((r) => (siapSelesai = r));

function umumkan(p) {
  penggunaKini = p;
  sesiLokal.simpan(p);
  siapSelesai(p);
  pendengar.forEach((fn) => fn(p));
}

/** Panggil fn setiap status masuk berubah. Mengembalikan fungsi berhenti. */
export function pantauSesi(fn) {
  pendengar.add(fn);
  if (penggunaKini !== undefined) fn(penggunaKini);
  mulai();
  return () => pendengar.delete(fn);
}
export const tungguSesi = () => (mulai(), sesiSiap);
export const pengguna = () => penggunaKini || null;
function wajibMasuk() {
  if (!penggunaKini) throw galat('BELUM_MASUK');
  return penggunaKini;
}
function wajibAdmin() {
  const p = wajibMasuk();
  if (!p.admin) throw galat('permission-denied');
  return p;
}

let sudahMulai = false;
function mulai() {
  if (sudahMulai) return;
  sudahMulai = true;
  if (MODE === 'firebase') fbMulai();
  else if (MODE === 'demo') demoMulai();
  else umumkan(null);
}

// ======================================================================
// MESIN FIREBASE
// ======================================================================
let fbJanji;
function fb() {
  fbJanji ??= (async () => {
    const akar = `https://www.gstatic.com/firebasejs/${VERSI_FB}`;
    const [app, A, F] = await Promise.all([import(`${akar}/firebase-app.js`), import(`${akar}/firebase-auth.js`), import(`${akar}/firebase-firestore.js`)]);
    const aplikasi = app.initializeApp(KONFIG.firebase);
    const auth = A.getAuth(aplikasi);
    auth.languageCode = 'id';
    const db = F.getFirestore(aplikasi);
    return { A, F, auth, db };
  })();
  return fbJanji;
}

const keMs = (v) => (v && typeof v.toMillis === 'function' ? v.toMillis() : v);
function rapikan(snap) {
  const o = { id: snap.id };
  for (const [k, v] of Object.entries(snap.data() || {})) o[k] = keMs(v);
  return o;
}

async function fbMulai() {
  const { A, auth } = await fb();
  A.onAuthStateChanged(auth, (u) => fbMuatProfil(u));
}

async function fbMuatProfil(u) {
  const { F, db } = await fb();
  if (!u) return umumkan(null);
  if (u.isAnonymous) {
    const diblokir = (await F.getDoc(F.doc(db, 'blokir', u.uid)).catch(() => null))?.exists() || false;
    return umumkan({ uid: u.uid, tamu: true, email: '', nama: 'Tamu', wa: '', kota: '', terverifikasi: false, penyedia: 'tamu', admin: false, diblokir });
  }
  try {
    const email = (u.email || '').toLowerCase();
    let admin = ADMIN_UTAMA.includes(email) && u.emailVerified;
    if (!admin) admin = (await F.getDoc(F.doc(db, 'admin', u.uid)).catch(() => null))?.exists() || false;
    const ref = F.doc(db, 'pengguna', u.uid);
    let profil = await F.getDoc(ref).catch(() => null);
    if (profil && !profil.exists() && !sedangDaftar) {
      await F.setDoc(ref, {
        nama: u.displayName || email.split('@')[0], email, wa: '', kota: '',
        dibuat: F.serverTimestamp(), diubah: F.serverTimestamp(),
      }).catch(() => {});
      profil = await F.getDoc(ref).catch(() => null);
    }
    const data = profil?.exists() ? profil.data() : {};
    const diblokir = (await F.getDoc(F.doc(db, 'blokir', u.uid)).catch(() => null))?.exists() || false;
    umumkan({
      uid: u.uid, email, nama: data.nama || u.displayName || email, wa: data.wa || '', kota: data.kota || '', foto: u.photoURL || '',
      terverifikasi: u.emailVerified, penyedia: u.providerData[0]?.providerId || 'password', admin, diblokir,
    });
  } catch (e) {
    console.error(e);
    umumkan({ uid: u.uid, email: u.email, nama: u.displayName || u.email, foto: u.photoURL || '', terverifikasi: u.emailVerified, admin: false });
  }
}

let sedangDaftar = false;

const fbMesin = {
  /** Pastikan ada sesi sebelum menyimpan. Tanpa akun, pengunjung menjadi tamu. */
  async pastikanSesi() {
    if (penggunaKini) return penggunaKini;
    const { A, auth } = await fb();
    const { user } = await A.signInAnonymously(auth);
    await fbMuatProfil(user);
    return penggunaKini;
  },
  async masuk(email, sandi) {
    const { A, auth } = await fb();
    await A.signInWithEmailAndPassword(auth, email.trim(), sandi);
  },
  async daftar({ nama, email, sandi, wa, kota }) {
    const { A, F, auth, db } = await fb();
    sedangDaftar = true;
    try {
      const { user } = await A.createUserWithEmailAndPassword(auth, email.trim(), sandi);
      await A.updateProfile(user, { displayName: nama });
      await F.setDoc(F.doc(db, 'pengguna', user.uid), {
        nama, email: email.trim().toLowerCase(), wa: wa || '', kota: kota || '',
        dibuat: F.serverTimestamp(), diubah: F.serverTimestamp(),
      });
      A.sendEmailVerification(user).catch(() => {});
    } finally {
      sedangDaftar = false;
    }
    await fbMuatProfil(auth.currentUser);
  },
  async masukGoogle() {
    const { A, auth } = await fb();
    const p = new A.GoogleAuthProvider();
    p.setCustomParameters({ prompt: 'select_account' });
    await A.signInWithPopup(auth, p);
  },
  async keluar() {
    const { A, auth } = await fb();
    await A.signOut(auth);
  },
  async lupaSandi(email) {
    const { A, auth } = await fb();
    await A.sendPasswordResetEmail(auth, email.trim(), { url: ASAL + 'masuk/' });
  },
  async kirimUlangVerifikasi() {
    const { A, auth } = await fb();
    if (auth.currentUser) await A.sendEmailVerification(auth.currentUser, { url: ASAL + 'akun/' });
  },
  async muatUlangSesi() {
    const { auth } = await fb();
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    await fbMuatProfil(auth.currentUser);
  },
  async simpanProfil({ nama, wa, kota }) {
    const p = wajibMasuk();
    const { A, F, auth, db } = await fb();
    await F.setDoc(F.doc(db, 'pengguna', p.uid), { nama, wa, kota, diubah: F.serverTimestamp() }, { merge: true });
    if (auth.currentUser && nama !== auth.currentUser.displayName) await A.updateProfile(auth.currentUser, { displayName: nama });
    umumkan({ ...p, nama, wa, kota });
  },

  // ---------- booking ----------
  async kirimBooking(data) {
    const p = await this.pastikanSesi();
    if (p.diblokir) throw galat('DIBLOKIR');
    const { F, db } = await fb();
    const ref = F.doc(F.collection(db, 'booking'));
    const nomor = nomorBooking(ref.id);
    await F.setDoc(ref, {
      ...data, nomor, uid: p.uid, email: p.email || '', status: 'baru', jadwalTanggal: '', jadwalJam: '',
      dibuat: F.serverTimestamp(), diubah: F.serverTimestamp(), balasanTamu: null, dibacaAdmin: null,
    });
    kabariPengurus({ ...data, id: ref.id, nomor });
    return { id: ref.id, nomor };
  },
  async bookingSaya() {
    const p = wajibMasuk();
    const { F, db } = await fb();
    const s = await F.getDocs(F.query(F.collection(db, 'booking'), F.where('uid', '==', p.uid)));
    return s.docs.map(rapikan).sort((a, b) => (b.dibuat || 0) - (a.dibuat || 0));
  },
  async ambilBooking(id) {
    wajibMasuk();
    const { F, db } = await fb();
    const s = await F.getDoc(F.doc(db, 'booking', id));
    return s.exists() ? rapikan(s) : null;
  },
  async batalkanBooking(id) {
    wajibMasuk();
    const { F, db } = await fb();
    await F.updateDoc(F.doc(db, 'booking', id), { status: 'batal', diubah: F.serverTimestamp() });
  },
  async tanggapan(id) {
    const { F, db } = await fb();
    const s = await F.getDocs(F.query(F.collection(db, 'booking', id, 'tanggapan'), F.orderBy('dibuat', 'asc')));
    return s.docs.map(rapikan);
  },
  async kirimTanggapan(id, pesan, { sebagaiAdmin = false } = {}) {
    const p = wajibMasuk();
    const { F, db } = await fb();
    await F.addDoc(F.collection(db, 'booking', id, 'tanggapan'), {
      oleh: sebagaiAdmin ? 'admin' : 'tamu', uid: p.uid, nama: sebagaiAdmin ? `${p.nama} (Pengurus)` : p.nama,
      pesan, dibuat: F.serverTimestamp(),
    });
    const ref = F.doc(db, 'booking', id);
    if (sebagaiAdmin) await F.updateDoc(ref, { diubah: F.serverTimestamp(), dibacaAdmin: F.serverTimestamp(), ditangani: p.nama });
    else await F.updateDoc(ref, { balasanTamu: F.serverTimestamp() });
  },

  // ---------- testimoni ----------
  async kirimTestimoni(data) {
    const p = await this.pastikanSesi();
    if (p.diblokir) throw galat('DIBLOKIR');
    const { F, db } = await fb();
    await F.addDoc(F.collection(db, 'testimoni'), { ...data, uid: p.uid, status: 'menunggu', dibuat: F.serverTimestamp() });
  },

  // ---------- panel pengurus ----------
  async semuaBooking() {
    wajibAdmin();
    const { F, db } = await fb();
    const s = await F.getDocs(F.query(F.collection(db, 'booking'), F.orderBy('dibuat', 'desc'), F.limit(2000)));
    return s.docs.map(rapikan);
  },
  async ubahBooking(id, patch) {
    const p = wajibAdmin();
    const { F, db } = await fb();
    await F.updateDoc(F.doc(db, 'booking', id), { ...patch, diubah: F.serverTimestamp(), dibacaAdmin: F.serverTimestamp(), ditangani: p.nama });
  },
  async catatanInternal(id) {
    wajibAdmin();
    const { F, db } = await fb();
    const s = await F.getDocs(F.query(F.collection(db, 'booking', id, 'internal'), F.orderBy('dibuat', 'asc')));
    return s.docs.map(rapikan);
  },
  async tambahCatatan(id, teks) {
    const p = wajibAdmin();
    const { F, db } = await fb();
    await F.addDoc(F.collection(db, 'booking', id, 'internal'), { teks, oleh: p.nama, uid: p.uid, dibuat: F.serverTimestamp() });
  },
  async semuaTestimoni() {
    wajibAdmin();
    const { F, db } = await fb();
    const s = await F.getDocs(F.query(F.collection(db, 'testimoni'), F.orderBy('dibuat', 'desc'), F.limit(1000)));
    return s.docs.map(rapikan);
  },
  /** Salinan tanpa data kontak masuk ke testimoniPublik; aslinya tetap privat. */
  async tampilkanTestimoni(t, isi) {
    const p = wajibAdmin();
    const { F, db } = await fb();
    const b = F.writeBatch(db);
    b.update(F.doc(db, 'testimoni', t.id), { status: 'tampil', isi, diputuskan: F.serverTimestamp(), oleh: p.nama });
    b.set(F.doc(db, 'testimoniPublik', t.id), { ...potongTestimoni({ ...t, isi }), tampilPada: F.serverTimestamp() });
    await b.commit();
  },
  async tolakTestimoni(id) {
    const p = wajibAdmin();
    const { F, db } = await fb();
    const b = F.writeBatch(db);
    b.update(F.doc(db, 'testimoni', id), { status: 'ditolak', diputuskan: F.serverTimestamp(), oleh: p.nama });
    b.delete(F.doc(db, 'testimoniPublik', id));
    await b.commit();
  },
  async simpanPengaturan(d) {
    wajibAdmin();
    const { F, db } = await fb();
    await F.setDoc(F.doc(db, 'pengaturan', 'umum'), { ...d, diubah: F.serverTimestamp() });
  },
  async semuaPengguna() {
    wajibAdmin();
    const { F, db } = await fb();
    const [pg, bl, ad] = await Promise.all([
      F.getDocs(F.query(F.collection(db, 'pengguna'), F.orderBy('dibuat', 'desc'), F.limit(2000))),
      F.getDocs(F.collection(db, 'blokir')),
      F.getDocs(F.collection(db, 'admin')),
    ]);
    const blokir = new Set(bl.docs.map((d) => d.id));
    const admin = new Set(ad.docs.map((d) => d.id));
    return pg.docs.map(rapikan).map((u) => ({ ...u, diblokir: blokir.has(u.id), admin: admin.has(u.id) || ADMIN_UTAMA.includes(u.email) }));
  },
  async aturBlokir(uid, blokir) {
    const p = wajibAdmin();
    const { F, db } = await fb();
    const ref = F.doc(db, 'blokir', uid);
    if (blokir) await F.setDoc(ref, { oleh: p.email, dibuat: F.serverTimestamp() });
    else await F.deleteDoc(ref);
  },
  async daftarAdmin() {
    wajibAdmin();
    const { F, db } = await fb();
    const s = await F.getDocs(F.collection(db, 'admin'));
    return s.docs.map(rapikan);
  },
  async tambahAdmin(email) {
    const p = wajibAdmin();
    const { F, db } = await fb();
    const s = await F.getDocs(F.query(F.collection(db, 'pengguna'), F.where('email', '==', email.trim().toLowerCase())));
    if (s.empty) throw galat('TIDAK_ADA', 'Belum ada akun dengan email itu. Minta yang bersangkutan mendaftar di situs dulu, lalu tambahkan lagi.');
    const u = s.docs[0];
    await F.setDoc(F.doc(db, 'admin', u.id), { email: u.data().email, nama: u.data().nama, oleh: p.email, ditambahkan: F.serverTimestamp() });
  },
  async hapusAdmin(uid) {
    wajibAdmin();
    const { F, db } = await fb();
    await F.deleteDoc(F.doc(db, 'admin', uid));
  },

  // ---------- kabar ----------
  async trafikHarian(n = 30) {
    wajibAdmin();
    const { F, db } = await fb();
    const awal = new Date(Date.now() - (n - 1) * 864e5).toISOString().slice(0, 10);
    const s = await F.getDocs(F.query(F.collection(db, 'trafik'), F.where(F.documentId(), '>=', awal)));
    return s.docs.map(rapikan).reverse();
  },
  async semuaKabarAdmin() {
    wajibAdmin();
    const { F, db } = await fb();
    const [terbit, draf] = await Promise.all([F.getDocs(F.collection(db, 'kabar')), F.getDocs(F.collection(db, 'draf'))]);
    return gabungKabar(terbit.docs.map(rapikan), draf.docs.map(rapikan));
  },
  async ambilKabarEdit(slug) {
    wajibAdmin();
    const { F, db } = await fb();
    const [d, k, i] = await Promise.all([F.getDoc(F.doc(db, 'draf', slug)), F.getDoc(F.doc(db, 'kabar', slug)), F.getDoc(F.doc(db, 'kabarIsi', slug))]);
    const terbit = k.exists();
    if (d.exists()) return { ...rapikan(d), slug, terbit };
    if (terbit) return { ...rapikan(k), ...(i.exists() ? rapikan(i) : {}), slug, terbit };
    return null;
  },
  async slugTerpakai(slug) {
    const { F, db } = await fb();
    const [a, b] = await Promise.all([F.getDoc(F.doc(db, 'kabar', slug)), F.getDoc(F.doc(db, 'draf', slug))]);
    return a.exists() || b.exists();
  },
  async simpanDraf(k) {
    wajibAdmin();
    const { F, db } = await fb();
    await F.setDoc(F.doc(db, 'draf', k.slug), { ...potongKabar(k), terbitPada: k.terbitPada ? F.Timestamp.fromMillis(k.terbitPada) : null, diubah: F.serverTimestamp() });
  },
  async terbitkan(k) {
    wajibAdmin();
    const { F, db } = await fb();
    const b = F.writeBatch(db);
    const m = potongKabar(k);
    b.set(F.doc(db, 'kabar', k.slug), {
      judul: m.judul, kategori: m.kategori, ringkasan: m.ringkasan, penulis: m.penulis, sampulKecil: m.sampulKecil, unggulan: m.unggulan,
      terbitPada: F.Timestamp.fromMillis(k.terbitPada || Date.now()), diubah: F.serverTimestamp(),
    });
    b.set(F.doc(db, 'kabarIsi', k.slug), { delta: m.delta, sampul: m.sampul, keteranganSampul: m.keteranganSampul, diubah: F.serverTimestamp() });
    b.delete(F.doc(db, 'draf', k.slug));
    await b.commit();
  },
  async tarikKabar(slug) {
    wajibAdmin();
    const k = await this.ambilKabarEdit(slug);
    const { F, db } = await fb();
    const b = F.writeBatch(db);
    b.set(F.doc(db, 'draf', slug), { ...potongKabar(k), terbitPada: k.terbitPada ? F.Timestamp.fromMillis(k.terbitPada) : null, diubah: F.serverTimestamp() });
    b.delete(F.doc(db, 'kabar', slug));
    b.delete(F.doc(db, 'kabarIsi', slug));
    await b.commit();
  },
  async hapusKabar(slug) {
    wajibAdmin();
    const { F, db } = await fb();
    const b = F.writeBatch(db);
    ['kabar', 'kabarIsi', 'draf'].forEach((c) => b.delete(F.doc(db, c, slug)));
    await b.commit();
  },
};

// Pemberitahuan surel untuk pengurus lewat FormSubmit (gratis, tanpa server).
// Hanya nomor, layanan, dan tanggal yang dikirim; cerita tamu tetap di Firestore.
function kabariPengurus(b) {
  const tujuan = KONFIG.notifikasi?.emailBookingBaru;
  if (!tujuan || MODE !== 'firebase' || ['localhost', '127.0.0.1'].includes(location.hostname)) return;
  fetch(`https://formsubmit.co/ajax/${encodeURIComponent(tujuan)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      _subject: `[Cahaya Teratai Putih] Booking baru ${b.nomor}`,
      _template: 'table',
      _captcha: 'false',
      Nomor: b.nomor,
      Layanan: namaLayanan(b.layanan),
      'Tanggal diinginkan': tanggalBooking(b.tanggal),
      'Buka di panel': `${ASAL}admin/#booking/${b.id}`,
    }),
  }).catch(() => {});
}

// ======================================================================
// MESIN DEMO
// ======================================================================
let D; // modul demo.js
async function demo() {
  D ??= await import('./demo.js');
  return D;
}

async function demoMulai() {
  const d = await demo();
  const s = d.bacaDemo();
  umumkan(s.sesi ? profilDemo(s, s.sesi) : null);
}
function profilDemo(s, uid) {
  const u = s.pengguna[uid];
  if (!u) return null;
  if (u.tamu) return { uid, tamu: true, email: '', nama: 'Tamu', wa: '', kota: '', terverifikasi: false, penyedia: 'tamu', admin: false, diblokir: Boolean(s.blokir[uid]) };
  return {
    uid, email: u.email, nama: u.nama, wa: u.wa || '', kota: u.kota || '',
    terverifikasi: true, penyedia: u.penyedia || 'password',
    admin: ADMIN_UTAMA.includes(u.email) || Boolean(s.admin[uid]), diblokir: Boolean(s.blokir[uid]),
  };
}
function segarkanSesi() {
  const s = D.bacaDemo();
  umumkan(s.sesi ? profilDemo(s, s.sesi) : null);
}

const demoMesin = {
  async pastikanSesi() {
    if (penggunaKini) return penggunaKini;
    const d = await demo();
    const uid = d.idAcak(16);
    d.ubahDemo((s) => { s.pengguna[uid] = { tamu: true, nama: 'Tamu', dibuat: Date.now() }; s.sesi = uid; });
    segarkanSesi();
    return penggunaKini;
  },
  async masuk(email, sandi) {
    const d = await demo();
    await d.tunda();
    const e = email.trim().toLowerCase();
    const s = d.bacaDemo();
    const akun = s.akun[e];
    if (!akun || akun.sandi !== sandi) throw galat('auth/invalid-credential');
    d.ubahDemo((s) => (s.sesi = akun.uid));
    segarkanSesi();
  },
  async daftar({ nama, email, sandi, wa, kota }) {
    const d = await demo();
    await d.tunda();
    const e = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(e)) throw galat('auth/invalid-email');
    if ((sandi || '').length < 8) throw galat('auth/weak-password');
    if (d.bacaDemo().akun[e]) throw galat('auth/email-already-in-use');
    const uid = d.idAcak(16);
    d.ubahDemo((s) => {
      s.akun[e] = { uid, sandi };
      s.pengguna[uid] = { nama, email: e, wa: wa || '', kota: kota || '', dibuat: Date.now(), diubah: Date.now() };
      s.sesi = uid;
    });
    segarkanSesi();
  },
  async masukGoogle() {
    const d = await demo();
    await d.tunda();
    const e = 'pengguna.google@contoh.id';
    d.ubahDemo((s) => {
      if (!s.akun[e]) {
        const uid = d.idAcak(16);
        s.akun[e] = { uid, sandi: d.idAcak(12) };
        s.pengguna[uid] = { nama: 'Pengguna Google (demo)', email: e, wa: '', kota: '', penyedia: 'google.com', dibuat: Date.now(), diubah: Date.now() };
      }
      s.sesi = s.akun[e].uid;
    });
    segarkanSesi();
  },
  /** Khusus demo: masuk sebagai pengurus untuk mencoba panel. */
  async masukPengurusDemo() {
    const d = await demo();
    const e = ADMIN_UTAMA[0] || 'pengurus@contoh.id';
    d.ubahDemo((s) => {
      if (!s.akun[e]) {
        const uid = d.idAcak(16);
        s.akun[e] = { uid, sandi: d.idAcak(12) };
        s.pengguna[uid] = { nama: 'Sekretariat Yayasan', email: e, wa: '081234567890', kota: 'Kota Mataram', dibuat: Date.now(), diubah: Date.now() };
      }
      s.admin[s.akun[e].uid] = { email: e, nama: 'Sekretariat Yayasan', ditambahkan: Date.now() };
      s.sesi = s.akun[e].uid;
    });
    segarkanSesi();
  },
  async keluar() {
    const d = await demo();
    d.ubahDemo((s) => (s.sesi = null));
    segarkanSesi();
  },
  async lupaSandi(email) {
    const d = await demo();
    await d.tunda();
    if (!d.bacaDemo().akun[email.trim().toLowerCase()]) throw galat('auth/user-not-found');
  },
  async kirimUlangVerifikasi() {},
  async muatUlangSesi() {
    await demo();
    segarkanSesi();
  },
  async simpanProfil({ nama, wa, kota }) {
    const p = wajibMasuk();
    const d = await demo();
    d.ubahDemo((s) => Object.assign(s.pengguna[p.uid], { nama, wa, kota, diubah: Date.now() }));
    segarkanSesi();
  },

  async kirimBooking(data) {
    const p = await this.pastikanSesi();
    if (p.diblokir) throw galat('DIBLOKIR');
    const d = await demo();
    await d.tunda(400);
    const id = d.idAcak(20);
    const nomor = nomorBooking(id);
    d.ubahDemo((s) => {
      s.booking[id] = { ...data, nomor, uid: p.uid, email: p.email || '', status: 'baru', jadwalTanggal: '', jadwalJam: '', dibuat: Date.now(), diubah: Date.now(), balasanTamu: null, dibacaAdmin: null };
    });
    return { id, nomor };
  },
  async bookingSaya() {
    const p = wajibMasuk();
    const d = await demo();
    await d.tunda(150);
    return Object.entries(d.bacaDemo().booking).filter(([, b]) => b.uid === p.uid).map(([id, b]) => ({ id, ...b })).sort((a, b) => b.dibuat - a.dibuat);
  },
  async ambilBooking(id) {
    const p = wajibMasuk();
    const d = await demo();
    const b = d.bacaDemo().booking[id];
    if (!b || (b.uid !== p.uid && !p.admin)) return null;
    return { id, ...b };
  },
  async batalkanBooking(id) {
    const d = await demo();
    d.ubahDemo((s) => Object.assign(s.booking[id], { status: 'batal', diubah: Date.now() }));
  },
  async tanggapan(id) {
    const d = await demo();
    return (d.bacaDemo().tanggapan[id] || []).slice();
  },
  async kirimTanggapan(id, pesan, { sebagaiAdmin = false } = {}) {
    const p = wajibMasuk();
    const d = await demo();
    await d.tunda(200);
    d.ubahDemo((s) => {
      (s.tanggapan[id] ||= []).push({ id: d.idAcak(10), oleh: sebagaiAdmin ? 'admin' : 'tamu', uid: p.uid, nama: sebagaiAdmin ? `${p.nama} (Pengurus)` : p.nama, pesan, dibuat: Date.now() });
      const b = s.booking[id];
      if (sebagaiAdmin) Object.assign(b, { diubah: Date.now(), dibacaAdmin: Date.now(), ditangani: p.nama });
      else b.balasanTamu = Date.now();
    });
  },

  async kirimTestimoni(data) {
    const p = await this.pastikanSesi();
    if (p.diblokir) throw galat('DIBLOKIR');
    const d = await demo();
    await d.tunda(300);
    d.ubahDemo((s) => (s.testimoni[d.idAcak(20)] = { ...data, uid: p.uid, status: 'menunggu', dibuat: Date.now() }));
  },

  async semuaBooking() {
    wajibAdmin();
    const d = await demo();
    await d.tunda(150);
    return Object.entries(d.bacaDemo().booking).map(([id, b]) => ({ id, ...b })).sort((a, b) => b.dibuat - a.dibuat);
  },
  async ubahBooking(id, patch) {
    const p = wajibAdmin();
    const d = await demo();
    d.ubahDemo((s) => Object.assign(s.booking[id], patch, { diubah: Date.now(), dibacaAdmin: Date.now(), ditangani: p.nama }));
  },
  async catatanInternal(id) {
    wajibAdmin();
    const d = await demo();
    return (d.bacaDemo().internal[id] || []).slice();
  },
  async tambahCatatan(id, teks) {
    const p = wajibAdmin();
    const d = await demo();
    d.ubahDemo((s) => (s.internal[id] ||= []).push({ id: d.idAcak(10), teks, oleh: p.nama, uid: p.uid, dibuat: Date.now() }));
  },
  async semuaTestimoni() {
    wajibAdmin();
    const d = await demo();
    return Object.entries(d.bacaDemo().testimoni).map(([id, t]) => ({ id, ...t })).sort((a, b) => b.dibuat - a.dibuat);
  },
  async tampilkanTestimoni(t, isi) {
    const p = wajibAdmin();
    const d = await demo();
    d.ubahDemo((s) => {
      Object.assign(s.testimoni[t.id], { status: 'tampil', isi, diputuskan: Date.now(), oleh: p.nama });
      s.testimoniPublik[t.id] = { ...potongTestimoni({ ...t, isi }), tampilPada: Date.now() };
    });
  },
  async tolakTestimoni(id) {
    const p = wajibAdmin();
    const d = await demo();
    d.ubahDemo((s) => {
      Object.assign(s.testimoni[id], { status: 'ditolak', diputuskan: Date.now(), oleh: p.nama });
      delete s.testimoniPublik[id];
    });
  },
  async simpanPengaturan(data) {
    wajibAdmin();
    const d = await demo();
    d.ubahDemo((s) => (s.pengaturan = data));
  },
  async semuaPengguna() {
    wajibAdmin();
    const d = await demo();
    const s = d.bacaDemo();
    return Object.entries(s.pengguna)
      .filter(([, u]) => !u.tamu)
      .map(([id, u]) => ({ id, ...u, diblokir: Boolean(s.blokir[id]), admin: Boolean(s.admin[id]) || ADMIN_UTAMA.includes(u.email) }))
      .sort((a, b) => b.dibuat - a.dibuat);
  },
  async aturBlokir(uid, blokir) {
    const p = wajibAdmin();
    const d = await demo();
    d.ubahDemo((s) => { if (blokir) s.blokir[uid] = { oleh: p.email, dibuat: Date.now() }; else delete s.blokir[uid]; });
  },
  async daftarAdmin() {
    wajibAdmin();
    const d = await demo();
    return Object.entries(d.bacaDemo().admin).map(([id, a]) => ({ id, ...a }));
  },
  async tambahAdmin(email) {
    const p = wajibAdmin();
    const d = await demo();
    const e = email.trim().toLowerCase();
    const s = d.bacaDemo();
    const uid = s.akun[e]?.uid;
    if (!uid) throw galat('TIDAK_ADA', 'Belum ada akun dengan email itu. Minta yang bersangkutan mendaftar di situs dulu, lalu tambahkan lagi.');
    d.ubahDemo((s) => (s.admin[uid] = { email: e, nama: s.pengguna[uid].nama, oleh: p.email, ditambahkan: Date.now() }));
  },
  async hapusAdmin(uid) {
    wajibAdmin();
    const d = await demo();
    d.ubahDemo((s) => delete s.admin[uid]);
  },

  async trafikHarian() {
    return [];
  },
  async semuaKabarAdmin() {
    wajibAdmin();
    const d = await demo();
    const s = d.bacaDemo();
    return gabungKabar(
      Object.entries(s.kabar).map(([id, k]) => ({ id, ...k })),
      Object.entries(s.draf).map(([id, k]) => ({ id, ...k })),
    );
  },
  async ambilKabarEdit(slug) {
    wajibAdmin();
    const d = await demo();
    const s = d.bacaDemo();
    const terbit = Boolean(s.kabar[slug]);
    if (s.draf[slug]) return { ...s.draf[slug], slug, terbit };
    if (terbit) return { ...s.kabar[slug], ...s.kabarIsi[slug], slug, terbit };
    return null;
  },
  async slugTerpakai(slug) {
    const d = await demo();
    const s = d.bacaDemo();
    return Boolean(s.kabar[slug] || s.draf[slug]);
  },
  async simpanDraf(k) {
    wajibAdmin();
    const d = await demo();
    d.ubahDemo((s) => (s.draf[k.slug] = { ...potongKabar(k), terbitPada: k.terbitPada || null, diubah: Date.now() }));
  },
  async terbitkan(k) {
    wajibAdmin();
    const d = await demo();
    const m = potongKabar(k);
    d.ubahDemo((s) => {
      s.kabar[k.slug] = { slug: k.slug, judul: m.judul, kategori: m.kategori, ringkasan: m.ringkasan, penulis: m.penulis, sampulKecil: m.sampulKecil, unggulan: m.unggulan, terbitPada: k.terbitPada || Date.now(), diubah: Date.now() };
      s.kabarIsi[k.slug] = { delta: m.delta, sampul: m.sampul, keteranganSampul: m.keteranganSampul, diubah: Date.now() };
      delete s.draf[k.slug];
    });
  },
  async tarikKabar(slug) {
    wajibAdmin();
    const k = await this.ambilKabarEdit(slug);
    D.ubahDemo((s) => {
      s.draf[slug] = { ...potongKabar(k), terbitPada: k.terbitPada || null, diubah: Date.now() };
      delete s.kabar[slug];
      delete s.kabarIsi[slug];
    });
  },
  async hapusKabar(slug) {
    wajibAdmin();
    const d = await demo();
    d.ubahDemo((s) => { delete s.kabar[slug]; delete s.kabarIsi[slug]; delete s.draf[slug]; });
  },
};

// ======================================================================
// bersama
// ======================================================================
function potongKabar(k) {
  return {
    slug: k.slug, judul: k.judul || '', kategori: k.kategori || 'Kegiatan', ringkasan: k.ringkasan || '', penulis: k.penulis || '',
    unggulan: Boolean(k.unggulan), sampul: k.sampul || '', sampulKecil: k.sampulKecil || '', keteranganSampul: k.keteranganSampul || '',
    delta: typeof k.delta === 'string' ? k.delta : JSON.stringify(k.delta || []),
  };
}
function gabungKabar(terbit, draf) {
  const peta = new Map();
  for (const k of terbit) peta.set(k.id, { ...k, slug: k.id, terbit: true, adaDraf: false });
  for (const k of draf) {
    const ada = peta.get(k.id);
    if (ada) ada.adaDraf = true;
    else peta.set(k.id, { ...k, slug: k.id, terbit: false, adaDraf: true });
  }
  return [...peta.values()].sort((a, b) => (b.diubah || 0) - (a.diubah || 0));
}
const inisialNama = (nama) => String(nama).trim().split(/\s+/).map((k, i) => (i === 0 ? k : `${k[0]}.`)).join(' ');
function potongTestimoni(t) {
  return {
    nama: t.tampilNama === 'inisial' ? inisialNama(t.nama) : t.nama, kota: t.kota || '', tentang: t.tentang,
    bintang: t.bintang, isi: t.isi, foto: t.foto || '',
  };
}

const MATI = new Proxy({}, { get: () => async () => { throw galat('LAYANAN_MATI'); } });
const mesin = MODE === 'firebase' ? fbMesin : MODE === 'demo' ? demoMesin : MATI;

export const L = new Proxy(mesin, {
  get(target, nama) {
    const fn = target[nama];
    if (typeof fn !== 'function') return fn;
    return async (...arg) => {
      mulai();
      if (nama !== 'masuk' && nama !== 'daftar' && nama !== 'masukGoogle' && nama !== 'lupaSandi' && nama !== 'masukPengurusDemo') await sesiSiap;
      return fn.apply(target, arg);
    };
  },
});
