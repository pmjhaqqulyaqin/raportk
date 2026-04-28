import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStudents, useSchoolInfo } from '../hooks/queries';
import { useSession, authClient } from '../lib/authClient';

function Home() {
  const { data: session } = useSession();
  const { data: studentsData } = useStudents();
  const { data: schoolInfoData } = useSchoolInfo();

  const students = studentsData || [];
  const schoolInfo = schoolInfoData || { academicYear: '-', semester: '-', teacher: 'Guru', schoolName: 'TK Modern', location: 'Kota' };

  // Hitung Rekapitulasi
  const totalStudents = students.length;
  const totalL = students.filter(s => s.gender === 'L').length;
  const totalP = students.filter(s => s.gender === 'P').length;
  const totalKelas = new Set(students.map(s => s.group)).size || 0;
  const totalGuru = 2;
  const navigate = useNavigate();

  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showUploadPhoto, setShowUploadPhoto] = useState(false);
  const [editName, setEditName] = useState(session?.user?.name || '');

  const handleLogout = async () => {
    await authClient.signOut();
    navigate('/login');
  };

  return (
    <div className="font-sans overflow-x-hidden min-h-screen text-white pb-20">
      {/* Navigation Drawer (Desktop) */}
      <aside className="hidden lg:flex flex-col h-screen p-4 gap-4 fixed left-0 top-0 w-72 border-r border-white/10 glass-panel z-50">
        <div className="flex flex-col gap-1 px-4 py-8">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 rounded-2xl object-contain mb-4 shadow-lg" />
          <h1 className="text-2xl font-black text-white tracking-tight">CetakRaport</h1>
          <p className="text-sm text-slate-400 font-medium">TK Modern Dashboard</p>
        </div>
        <nav className="flex flex-col gap-2 mt-4">
          <Link className="flex items-center gap-4 rounded-2xl bg-white/10 px-4 py-3 text-white font-bold backdrop-blur-md border border-white/5 shadow-lg" to="/">
            <span className="material-symbols-outlined text-primary" data-icon="space_dashboard">space_dashboard</span>
            <span className="text-[15px]">Dashboard</span>
          </Link>
          <Link className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all" to="/setup">
            <span className="material-symbols-outlined" data-icon="settings">settings</span>
            <span className="text-[15px] font-medium">Pengaturan</span>
          </Link>
          <Link className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all" to="/editor">
            <span className="material-symbols-outlined" data-icon="edit_note">edit_note</span>
            <span className="text-[15px] font-medium">Input Nilai</span>
          </Link>
          <Link className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all" to="/print">
            <span className="material-symbols-outlined" data-icon="print">print</span>
            <span className="text-[15px] font-medium">Cetak Raport</span>
          </Link>
        </nav>
        <div className="mt-auto p-4 flex items-center gap-4 glass-card rounded-3xl">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-secondary to-primary flex items-center justify-center text-white font-black text-lg shadow-inner">
            {session?.user?.name?.charAt(0).toUpperCase() || 'G'}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-tight">{session?.user?.name || 'Guru'}</span>
            <span className="text-xs text-slate-400">Guru Kelas</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:ml-72 min-h-screen">
        {/* Top App Bar */}
        <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between px-4 lg:px-10 glass-panel border-b border-white/5">
          <div className="flex flex-col justify-center">
            <h2 className="text-xs lg:text-sm font-bold text-slate-400 leading-tight">
              {(() => { const h = new Date().getHours(); if (h < 11) return '☀️ Selamat Pagi'; if (h < 15) return '🌤️ Selamat Siang'; if (h < 18) return '🌅 Selamat Sore'; return '🌙 Selamat Malam'; })()}
            </h2>
            <p className="text-sm lg:text-base font-black text-white leading-tight truncate max-w-[180px] lg:max-w-none">{session?.user?.name || 'Guru'}</p>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full glass-card text-slate-200 text-[10px] lg:text-xs font-bold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_#06B6D4]"></span>
              {schoolInfo.academicYear} - {schoolInfo.semester}
            </div>
            <button onClick={() => setShowNotif(!showNotif)} className="w-8 h-8 flex items-center justify-center text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors relative">
              <span className="material-symbols-outlined text-lg">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full"></span>
            </button>
            <button onClick={() => setShowProfile(!showProfile)} className="w-8 h-8 rounded-full bg-gradient-to-r from-secondary to-primary flex items-center justify-center text-white font-black text-xs shadow-inner hover:scale-110 transition-all">
              {session?.user?.name?.charAt(0).toUpperCase() || 'G'}
            </button>
          </div>

          {/* Notification Dropdown */}
          {showNotif && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)}></div>
              <div className="absolute top-14 right-12 lg:right-20 w-72 glass-card rounded-2xl p-4 border border-white/10 shadow-2xl z-50 space-y-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-base">notifications</span> Notifikasi
                </h4>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-xs font-bold text-white">📅 Tahun Ajaran Aktif</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{schoolInfo.academicYear} - Semester {schoolInfo.semester}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-xs font-bold text-white">👥 Total Murid</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{totalStudents} siswa terdaftar ({totalL} L, {totalP} P)</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-xs font-bold text-white">✅ Raport TK v1.0</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Aplikasi sudah versi terbaru.</p>
                </div>
              </div>
            </>
          )}

          {/* Profile Dropdown */}
          {showProfile && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)}></div>
              <div className="absolute top-14 right-4 lg:right-10 w-64 glass-card rounded-2xl p-4 border border-white/10 shadow-2xl z-50 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-secondary to-primary flex items-center justify-center text-white font-black text-sm shadow-lg">
                    {session?.user?.name?.charAt(0).toUpperCase() || 'G'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{session?.user?.name || 'Guru'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{session?.user?.email || ''}</p>
                  </div>
                </div>
                <button onClick={() => { setShowProfile(false); setShowEditProfile(true); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left">
                  <span className="material-symbols-outlined text-base text-slate-300">edit</span>
                  <span className="text-xs font-bold text-slate-200">Edit Profil</span>
                </button>
                <button onClick={() => { setShowProfile(false); setShowUploadPhoto(true); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left">
                  <span className="material-symbols-outlined text-base text-slate-300">photo_camera</span>
                  <span className="text-xs font-bold text-slate-200">Upload Foto Profil</span>
                </button>
                <div className="border-t border-white/10 pt-2">
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/10 transition-colors text-left">
                    <span className="material-symbols-outlined text-base text-accent">logout</span>
                    <span className="text-xs font-bold text-accent">Keluar</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </header>

        {/* Content Canvas */}
        <div className="p-3 lg:p-10 space-y-3 lg:space-y-8 max-w-[1440px] mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-6 mt-2">
            {/* Profil TK/PAUD */}
            <div className="lg:col-span-8 glass-card rounded-2xl lg:rounded-[2rem] p-4 lg:p-8 relative overflow-hidden flex flex-col justify-center shadow-lg border-white/5">
              <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
              <div className="flex items-center gap-4 lg:gap-6 relative z-10">
                <div className="w-16 h-16 lg:w-24 lg:h-24 rounded-2xl lg:rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 shrink-0">
                  <span className="material-symbols-outlined text-3xl lg:text-5xl" data-icon="school">school</span>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg lg:text-3xl font-black text-white tracking-tight">{schoolInfo.schoolName}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">Akreditasi A</span>
                  </div>
                  <p className="text-slate-400 font-medium text-xs lg:text-sm flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {schoolInfo.location}
                  </p>
                  <p className="text-slate-400 font-medium text-xs lg:text-sm flex items-center gap-1.5 mt-0.5">
                    <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                    Tahun Ajaran {schoolInfo.academicYear} - Semester {schoolInfo.semester}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Siswa Recap Mini */}
            <div className="lg:col-span-4 bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl lg:rounded-[2rem] p-4 lg:p-8 relative overflow-hidden shadow-lg border border-white/10 flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-6 opacity-30">
                <span className="material-symbols-outlined text-4xl lg:text-6xl" data-icon="group">group</span>
              </div>
              <div className="relative z-10">
                <p className="text-slate-300 font-bold uppercase tracking-widest text-[10px] lg:text-xs mb-0.5">Total Peserta Didik</p>
                <div className="flex items-end gap-3">
                  <span className="text-4xl lg:text-6xl font-black text-white leading-none">{totalStudents}</span>
                  <span className="text-indigo-300 font-bold text-sm mb-1">Siswa</span>
                </div>
                <div className="flex items-center gap-3 mt-3 lg:mt-6">
                  <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    <span className="text-sm font-bold text-white">{totalL} L</span>
                  </div>
                  <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                    <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                    <span className="text-sm font-bold text-white">{totalP} P</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rekapitulasi Data Tambahan (Guru & Kelas) */}
          <div className="grid grid-cols-2 gap-3 lg:gap-6">
            <div className="glass-card rounded-2xl lg:rounded-[2rem] p-3 lg:p-6 flex items-center gap-3 lg:gap-5 border-white/5">
              <div className="w-10 h-10 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
                <span className="material-symbols-outlined text-xl lg:text-3xl" data-icon="badge">badge</span>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-1">Tenaga Pendidik</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl lg:text-3xl font-black text-white leading-none">{totalGuru}</span>
                  <span className="text-slate-500 font-bold text-xs lg:text-sm">Guru Aktif</span>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl lg:rounded-[2rem] p-3 lg:p-6 flex items-center gap-3 lg:gap-5 border-white/5">
              <div className="w-10 h-10 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 shrink-0">
                <span className="material-symbols-outlined text-xl lg:text-3xl" data-icon="meeting_room">meeting_room</span>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-1">Rombongan Belajar</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl lg:text-3xl font-black text-white leading-none">{totalKelas}</span>
                  <span className="text-slate-500 font-bold text-xs lg:text-sm">Kelas</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modern List Section */}
          <section className="mt-4 lg:mt-12">
            <div className="flex items-center justify-between mb-3 lg:mb-6">
              <h3 className="text-base lg:text-2xl font-bold tracking-tight">Murid Terakhir Diedit</h3>
              <Link to="/setup" className="text-secondary font-semibold hover:text-white transition-colors text-sm">Lihat Semua</Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
              {students.slice(0, 6).map((student) => (
                <div key={student.id} className="glass-card rounded-2xl lg:rounded-[2rem] p-4 lg:p-6 flex flex-col gap-3 lg:gap-5 relative overflow-hidden group hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-3 lg:gap-4">
                    <div className="w-11 h-11 lg:w-14 lg:h-14 rounded-xl lg:rounded-[1.5rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-base lg:text-xl font-black shadow-lg">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm lg:text-base font-bold text-white tracking-tight truncate max-w-[140px]">{student.name}</h4>
                      <p className="text-[10px] lg:text-xs text-slate-400 mt-0.5">Fase {student.phase} - Kelas {student.group}</p>
                    </div>
                  </div>
                  <Link to={`/editor/${student.id}`} className="w-full py-2 lg:py-3 bg-white/10 hover:bg-primary text-white rounded-xl text-xs lg:text-sm font-bold text-center transition-all flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px]">edit_document</span> Isi Raport
                  </Link>
                </div>
              ))}

              {students.length === 0 && (
                <div className="sm:col-span-2 lg:col-span-3 py-10 flex flex-col items-center justify-center text-center glass-card rounded-2xl">
                  <span className="material-symbols-outlined text-slate-500 text-4xl mb-3">group_add</span>
                  <p className="text-sm font-bold text-white mb-1">Belum ada data murid</p>
                  <p className="text-xs text-slate-400 mb-4">Tambahkan murid di halaman Pengaturan.</p>
                  <Link to="/setup" className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/80 transition-all">
                    Tambah Murid
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowEditProfile(false)}>
          <div className="w-full max-w-sm bg-[#1a1f3d] border border-white/10 rounded-t-2xl sm:rounded-2xl p-5 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-black text-white">Edit Profil</h3>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Lengkap</label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</label>
              <input type="email" value={session?.user?.email || ''} disabled
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-400 shadow-inner opacity-60" />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowEditProfile(false)} className="flex-1 py-3 bg-white/5 text-slate-300 rounded-xl text-sm font-bold">Batal</button>
              <button onClick={async () => {
                try { await authClient.updateUser({ name: editName }); setShowEditProfile(false); window.location.reload(); } catch {}
              }} className="flex-[2] py-3 bg-gradient-to-r from-secondary to-primary text-white rounded-xl text-sm font-bold active:scale-95 transition-all">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Photo Modal */}
      {showUploadPhoto && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowUploadPhoto(false)}>
          <div className="w-full max-w-sm bg-[#1a1f3d] border border-white/10 rounded-t-2xl sm:rounded-2xl p-5 space-y-4 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-black text-white">Upload Foto Profil</h3>
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-secondary to-primary flex items-center justify-center text-white text-3xl font-black shadow-lg">
              {session?.user?.name?.charAt(0).toUpperCase() || 'G'}
            </div>
            <p className="text-xs text-slate-400">Fitur upload foto profil akan segera tersedia.</p>
            <button onClick={() => setShowUploadPhoto(false)} className="w-full py-3 bg-white/5 text-slate-300 rounded-xl text-sm font-bold hover:bg-white/10 transition-all">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
