# Rencana Implementasi: Aplikasi Cetak Raport TK (Pembaruan Mobile-First)

Berdasarkan diskusi terbaru dan Product Requirements Document (PRD), aplikasi ini merupakan aplikasi *single-user* (guru) yang dirancang secara **Mobile-First**. Sebagian besar aktivitas pengisian raport akan dilakukan melalui *smartphone* (HP), sementara aktivitas pengelolaan data dalam jumlah besar (upload data) dan proses cetak (PDF Batch) akan dioptimalkan untuk tampilan *Desktop*.

Berikut adalah rencana implementasi (Implementation Plan) terbaru untuk membangun aplikasi ini.

---

## 🎨 Pedoman UI/UX & Desain
Aplikasi akan menggunakan perpaduan **React, Tailwind CSS 4, dan komponen UI siap pakai**. Karena UI harus *mobile-friendly* dengan warna latar belakang yang dominan gelap, berikut penyesuaiannya:

1. **Tema & Palet Warna**:
   * **Background Utama (Body):** `#1E40AF` (Biru Tua yang memberi kesan elegan dan fokus).
   * **Surface (Card/Container):** Putih (`#FFFFFF`) atau abu-abu sangat terang untuk area konten (seperti form dan tabel) agar tulisan mudah dibaca (kontras tinggi).
   * **Teks:** Teks putih untuk elemen di atas background biru, dan teks gelap (hitam/abu tua) untuk elemen di dalam Card.
2. **Pendekatan Responsif (Mobile-First)**:
   * **Tampilan HP (Mobile):** Navigasi akan disesuaikan (misal menggunakan *bottom navigation bar* atau *hamburger menu*). Form pengisian narasi dibuat vertikal, tombol berukuran besar yang mudah disentuh jempol (*touch-friendly*), dan tabel akan diubah menjadi *card list* untuk murid.
   * **Tampilan Desktop (PC/Laptop):** Layout meluas dengan sidebar permanen. Diperuntukkan khusus untuk fitur *Setup Data*, *Cetak Batch PDF*, dan tabel data murid yang kompleks.

---

## 💡 Ide & Rekomendasi Teknis

### 1. Engine Pembuat PDF
Tetap direkomendasikan menggunakan **`@react-pdf/renderer`** atau **native browser print**. Karena cetak dilakukan di Desktop, `@react-pdf/renderer` sangat sempurna untuk *Batch Processing* tanpa membebani memori HP guru.

### 2. Penyimpanan Data Lokal
Gunakan **IndexedDB** (terintegrasi dengan Zustand `persist`). Hal ini penting karena guru akan mengetik narasi di HP, dan data harus tersimpan aman secara otomatis sebelum mereka memindahkannya/mencetaknya. Jika guru pindah perangkat (dari HP ke Laptop), diperlukan fitur **Sinkronisasi Manual (Export/Import JSON)**.

---

## 🛠️ Implementation Plan (Langkah demi Langkah)

Proyek ini dibagi ke dalam 5 Fase:

### Fase 1: Setup Proyek & Integrasi Desain Kustom (Sekarang)
Fokus pada integrasi kode HTML dari Anda dan menyusun arsitektur dasar.
1. **Setup Awal**: Proyek `Vite + React + Tailwind CSS 4` telah diinisialisasi.
2. **Konversi UI**: Mengubah desain dan kode HTML milik Anda (yang dominan background `#1E40AF`) menjadi komponen React (`.jsx`).
3. **Penyelarasan Mobile & Desktop**: Memastikan elemen HTML bawaan Anda responsif. Memisahkan *view* khusus cetak/upload agar lebih optimal di layar besar.

### Fase 2: State Management & Manajemen Data Pokok
Fokus pada logika penyimpanan data secara *offline*.
1. **Zustand Store**: Setup penyimpanan (Sekolah, Guru, Murid, Template) menggunakan IndexedDB.
2. **Halaman Setup & Murid (Desktop & Mobile)**: 
   * Form Setup Sekolah & Guru.
   * Fitur *Upload Data Siswa* (direkomendasikan via Desktop).
   * Daftar Murid: Di HP berupa daftar kartu (*card-based list*), di Desktop berupa tabel.

### Fase 3: Editor Raport Mobile-Friendly (5 Section)
Fokus pada kenyamanan guru mengetik narasi lewat HP.
1. **UI Pengisian Form (HP)**: Form akan memanjang ke bawah (vertikal) per section atau menggunakan sistem *swipe/stepper*. Area `textarea` akan otomatis melebar seiring guru mengetik.
2. **Fitur Bank Template & Auto-Replace**: Tombol-tombol template di HP akan dibuat seperti "chip" yang mudah diklik untuk menyisipkan teks `[nama]`. Auto-save otomatis berjalan tiap perubahan.
3. **Input Kehadiran**: Tombol `+ / -` atau input angka berukuran besar untuk kemudahan *tapping* jari di HP.

### Fase 4: Engine PDF & Desktop Preview A4
Fokus membuat output dokumen raport secara presisi.
1. **Layout Cetak**: Desain PDF A4 2 halaman murni menggunakan ukuran baku cetak (Fokus Desktop).
2. **Preview PDF**: Menampilkan hasil A4 di layar.
3. **Single Export**: Mengunduh raport PDF secara satuan.

### Fase 5: Fitur Desktop Khusus & Finalisasi
1. **Batch Cetak (ZIP)**: Dijalankan lewat Laptop/PC. Logic untuk menghasilkan puluhan PDF sekaligus.
2. **Backup/Restore Data**: Fitur Export/Import JSON. Karena HP dan Laptop adalah 2 *device* berbeda (sedangkan database ada di lokal), guru harus bisa men-download file JSON dari HP dan meng-uploadnya ke Laptop untuk dicetak.
3. **Final Polish**: Testing di layar *mobile* sebenarnya dan *Desktop browser*.

---

**Plan telah di-update!** Anda bisa melihat dokumen selengkapnya di panel artifak.
Silakan bagikan desain visual dan **kode HTML** Anda agar kita dapat langsung memulai eksekusi **Fase 1** untuk mengonversi tampilan UI!
