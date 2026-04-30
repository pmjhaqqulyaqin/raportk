import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Legal() {
  const [activeTab, setActiveTab] = useState('terms');

  return (
    <div className="font-sans overflow-x-hidden min-h-screen text-white pb-20">
      <main className="max-w-3xl mx-auto px-4 py-8 lg:py-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-300 hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight">Informasi Legal</h1>
            <p className="text-xs text-slate-400 mt-0.5">Syarat, Ketentuan, & Kebijakan Privasi</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-3">
          <button onClick={() => setActiveTab('terms')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${activeTab === 'terms' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            Syarat & Ketentuan
          </button>
          <button onClick={() => setActiveTab('privacy')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${activeTab === 'privacy' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            Kebijakan Privasi
          </button>
        </div>

        {/* Content */}
        <div className="glass-card rounded-2xl p-5 lg:p-8 border-white/5 prose prose-invert prose-sm max-w-none">
          {activeTab === 'terms' && (
            <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
              <h2 className="text-lg font-black text-white !mt-0">Syarat & Ketentuan Penggunaan</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Terakhir diperbarui: 30 April 2026</p>

              <section>
                <h3 className="text-sm font-bold text-white mb-2">1. Penerimaan Ketentuan</h3>
                <p>Dengan mengakses dan menggunakan aplikasi RaportK ("Layanan"), Anda menyetujui untuk terikat oleh Syarat & Ketentuan ini. Jika Anda tidak menyetujui ketentuan ini, mohon untuk tidak menggunakan Layanan.</p>
              </section>

              <section>
                <h3 className="text-sm font-bold text-white mb-2">2. Deskripsi Layanan</h3>
                <p>RaportK adalah aplikasi berbasis web untuk membantu guru Taman Kanak-kanak (TK) dan Pendidikan Anak Usia Dini (PAUD) dalam menyusun laporan capaian pembelajaran (raport) sesuai Kurikulum Merdeka. Layanan ini mencakup:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Pengelolaan data siswa dan sekolah</li>
                  <li>Input dan penyusunan narasi capaian pembelajaran</li>
                  <li>Pencetakan raport dalam format standar Kurikulum Merdeka</li>
                  <li>Kolaborasi antar guru dalam satu sekolah (School Hub)</li>
                  <li>Fitur AI untuk membantu penyusunan narasi</li>
                </ul>
              </section>

              <section>
                <h3 className="text-sm font-bold text-white mb-2">3. Akun Pengguna</h3>
                <p>Anda bertanggung jawab untuk menjaga kerahasiaan informasi akun Anda dan untuk semua aktivitas yang terjadi dalam akun Anda. Anda setuju untuk memberikan informasi yang akurat, terkini, dan lengkap saat mendaftar.</p>
              </section>

              <section>
                <h3 className="text-sm font-bold text-white mb-2">4. Penggunaan yang Diperbolehkan</h3>
                <p>Anda setuju untuk menggunakan Layanan hanya untuk tujuan pendidikan yang sah. Anda tidak diperkenankan untuk:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Menyalahgunakan layanan untuk tujuan ilegal</li>
                  <li>Mengunggah konten yang melanggar hak pihak lain</li>
                  <li>Mencoba mengakses sistem secara tidak sah</li>
                  <li>Mendistribusikan data siswa kepada pihak yang tidak berwenang</li>
                </ul>
              </section>

              <section>
                <h3 className="text-sm font-bold text-white mb-2">5. Kepemilikan Data</h3>
                <p>Seluruh data yang Anda masukkan ke dalam Layanan (data siswa, narasi, pengaturan sekolah) tetap menjadi milik Anda sepenuhnya. Kami tidak mengklaim kepemilikan atas konten yang Anda buat.</p>
              </section>

              <section>
                <h3 className="text-sm font-bold text-white mb-2">6. Batasan Tanggung Jawab</h3>
                <p>Layanan disediakan "sebagaimana adanya" tanpa jaminan apapun. Kami tidak bertanggung jawab atas kerugian yang timbul akibat penggunaan atau ketidakmampuan menggunakan Layanan, termasuk namun tidak terbatas pada kehilangan data.</p>
              </section>

              <section>
                <h3 className="text-sm font-bold text-white mb-2">7. Perubahan Ketentuan</h3>
                <p>Kami berhak untuk mengubah Syarat & Ketentuan ini kapan saja. Perubahan akan berlaku efektif segera setelah dipublikasikan. Penggunaan berkelanjutan atas Layanan merupakan persetujuan Anda terhadap perubahan tersebut.</p>
              </section>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
              <h2 className="text-lg font-black text-white !mt-0">Kebijakan Privasi</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Terakhir diperbarui: 30 April 2026</p>

              <section>
                <h3 className="text-sm font-bold text-white mb-2">1. Informasi yang Kami Kumpulkan</h3>
                <p>Kami mengumpulkan informasi berikut saat Anda menggunakan Layanan:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li><strong>Informasi Akun:</strong> Nama, email, dan foto profil yang Anda berikan saat mendaftar</li>
                  <li><strong>Data Sekolah:</strong> Nama sekolah, NPSN, nama kepala sekolah, dan informasi guru</li>
                  <li><strong>Data Siswa:</strong> Nama, NISN, NIK, tanggal lahir, dan data terkait lainnya yang Anda masukkan</li>
                  <li><strong>Data Nilai:</strong> Narasi capaian pembelajaran dan data kehadiran siswa</li>
                  <li><strong>Data Teknis:</strong> Alamat IP, jenis browser, dan data log server untuk keamanan</li>
                </ul>
              </section>

              <section>
                <h3 className="text-sm font-bold text-white mb-2">2. Penggunaan Informasi</h3>
                <p>Informasi yang dikumpulkan digunakan untuk:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Menyediakan dan memelihara fungsi Layanan</li>
                  <li>Menghasilkan dokumen raport sesuai permintaan Anda</li>
                  <li>Memfasilitasi kolaborasi antar guru dalam satu sekolah</li>
                  <li>Meningkatkan keamanan dan mencegah penyalahgunaan</li>
                  <li>Mengirim notifikasi terkait aktivitas di School Hub (jika diaktifkan)</li>
                </ul>
              </section>

              <section>
                <h3 className="text-sm font-bold text-white mb-2">3. Penyimpanan & Keamanan Data</h3>
                <p>Data Anda disimpan pada server yang diamankan dengan enkripsi. Kami menerapkan langkah-langkah keamanan teknis dan organisasional yang wajar untuk melindungi data Anda dari akses tidak sah, perubahan, pengungkapan, atau penghancuran.</p>
              </section>

              <section>
                <h3 className="text-sm font-bold text-white mb-2">4. Berbagi Data</h3>
                <p>Kami <strong>tidak menjual</strong> atau menyewakan data pribadi Anda kepada pihak ketiga. Data hanya dibagikan dalam konteks:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Kolaborasi School Hub: Data siswa dan template dapat dilihat oleh guru lain dalam sekolah yang sama (NPSN yang sama)</li>
                  <li>Fitur AI: Narasi yang Anda minta untuk di-generate dikirim ke penyedia AI (Google Gemini) untuk diproses, tanpa menyertakan identitas siswa</li>
                  <li>Kewajiban hukum: Jika diwajibkan oleh undang-undang yang berlaku</li>
                </ul>
              </section>

              <section>
                <h3 className="text-sm font-bold text-white mb-2">5. Hak Anda</h3>
                <p>Anda memiliki hak untuk:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Mengakses dan mengunduh data Anda (melalui fitur Backup)</li>
                  <li>Memperbarui atau memperbaiki informasi akun Anda</li>
                  <li>Menghapus akun dan seluruh data terkait</li>
                  <li>Menonaktifkan notifikasi push</li>
                </ul>
              </section>

              <section>
                <h3 className="text-sm font-bold text-white mb-2">6. Cookie & Penyimpanan Lokal</h3>
                <p>Kami menggunakan cookie dan localStorage untuk menyimpan sesi login Anda dan preferensi antarmuka. Anda dapat menghapus cookie melalui pengaturan browser Anda kapan saja.</p>
              </section>

              <section>
                <h3 className="text-sm font-bold text-white mb-2">7. Kontak</h3>
                <p>Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi kami melalui email yang tertera pada halaman kontak aplikasi.</p>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-slate-500">© 2026 RaportK — Aplikasi Raport Kurikulum Merdeka untuk TK/PAUD</p>
        </div>
      </main>
    </div>
  );
}

export default Legal;
