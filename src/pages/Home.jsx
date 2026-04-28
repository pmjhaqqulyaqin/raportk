import React from 'react';
import { Link } from 'react-router-dom';
import { useStudents, useSchoolInfo } from '../hooks/queries';
import { useSession } from '../lib/authClient';

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
  const totalGuru = 2; // Default (Kepala Sekolah + Guru Kelas)

  return (
    <div className="font-sans overflow-x-hidden min-h-screen text-white pb-20">
      {/* Navigation Drawer (Desktop) */}
      <aside className="hidden lg:flex flex-col h-screen p-4 gap-4 fixed left-0 top-0 w-72 border-r border-white/10 glass-panel z-50">
        <div className="flex flex-col gap-1 px-4 py-8">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <span className="material-symbols-outlined text-white text-2xl" data-icon="school">school</span>
          </div>
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
          <Link className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all" to="/master">
            <span className="material-symbols-outlined" data-icon="database">database</span>
            <span className="text-[15px] font-medium">Data Master</span>
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
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-1.5 text-white bg-white/5 rounded-full backdrop-blur-md">
              <span className="material-symbols-outlined text-xl" data-icon="menu">menu</span>
            </button>
            <h2 className="text-lg font-bold text-white tracking-tight hidden sm:block">Overview</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full glass-card text-slate-200 text-xs font-bold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_#06B6D4]"></span>
              {schoolInfo.academicYear} - {schoolInfo.semester}
            </div>
            <button className="w-8 h-8 flex items-center justify-center text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors relative">
              <span className="material-symbols-outlined text-lg" data-icon="notifications">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full"></span>
            </button>
            <div className="lg:hidden w-8 h-8 rounded-full bg-gradient-to-r from-secondary to-primary flex items-center justify-center text-white font-black text-xs shadow-inner">
              {session?.user?.name?.charAt(0).toUpperCase() || 'G'}
            </div>
          </div>
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
              <Link to="/master" className="text-secondary font-semibold hover:text-white transition-colors text-sm">Lihat Semua</Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
              {/* Modern Contact Card 1 */}
              <div className="glass-card rounded-2xl lg:rounded-[2rem] p-4 lg:p-6 flex flex-col gap-3 lg:gap-6 relative overflow-hidden group hover:bg-white/5 transition-all">
                <div className="absolute top-0 right-0 p-6">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]"></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 lg:w-16 lg:h-16 rounded-xl lg:rounded-[1.5rem] bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-base lg:text-xl font-black shadow-lg">
                    A
                  </div>
                  <div>
                    <h4 className="text-sm lg:text-lg font-bold text-white tracking-tight">Adi Putra</h4>
                    <p className="text-xs text-slate-400 mt-1">NISN: 0012345678</p>
                  </div>
                </div>
                <div className="bg-black/20 rounded-xl lg:rounded-2xl p-3 lg:p-4 flex justify-between items-center">
                  <div className="flex gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><span className="material-symbols-outlined text-[14px]">check</span></span>
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><span className="material-symbols-outlined text-[14px]">check</span></span>
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><span className="material-symbols-outlined text-[14px]">check</span></span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">100%</span>
                </div>
                <Link to="/editor/1" className="w-full py-2 lg:py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs lg:text-sm font-bold text-center transition-all">Edit Raport</Link>
              </div>

              {/* Modern Contact Card 2 */}
              <div className="glass-card rounded-2xl lg:rounded-[2rem] p-4 lg:p-6 flex flex-col gap-3 lg:gap-6 relative overflow-hidden group hover:bg-white/5 transition-all border-primary/30">
                <div className="absolute top-0 right-0 p-6">
                  <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_12px_#fbbf24] animate-pulse"></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 lg:w-16 lg:h-16 rounded-xl lg:rounded-[1.5rem] bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-base lg:text-xl font-black shadow-lg">
                    B
                  </div>
                  <div>
                    <h4 className="text-sm lg:text-lg font-bold text-white tracking-tight">Budi Santoso</h4>
                    <p className="text-xs text-slate-400 mt-1">NISN: 0012345679</p>
                  </div>
                </div>
                <div className="bg-black/20 rounded-xl lg:rounded-2xl p-3 lg:p-4 flex justify-between items-center">
                  <div className="flex gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><span className="material-symbols-outlined text-[14px]">check</span></span>
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center"><span className="material-symbols-outlined text-[14px]">edit</span></span>
                    <span className="w-6 h-6 rounded-full bg-white/5 text-slate-500 flex items-center justify-center"><span className="material-symbols-outlined text-[14px]">remove</span></span>
                  </div>
                  <span className="text-xs font-bold text-amber-400">50%</span>
                </div>
                <Link to="/editor/2" className="w-full py-2 lg:py-3 bg-primary hover:bg-primary/80 text-white rounded-xl text-xs lg:text-sm font-bold text-center transition-all shadow-lg shadow-primary/20">Lanjutkan</Link>
              </div>

              {/* Modern Contact Card 3 */}
              <div className="glass-card rounded-[2rem] p-6 flex flex-col gap-6 relative overflow-hidden group hover:bg-white/5 transition-all hidden lg:flex">
                <div className="absolute top-0 right-0 p-6">
                  <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-xl font-black shadow-lg">
                    C
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white tracking-tight">Citra Kirana</h4>
                    <p className="text-xs text-slate-400 mt-1">NISN: 0012345680</p>
                  </div>
                </div>
                <div className="bg-black/20 rounded-2xl p-4 flex justify-between items-center">
                  <div className="flex gap-2">
                    <span className="w-6 h-6 rounded-full bg-white/5 text-slate-500 flex items-center justify-center"><span className="material-symbols-outlined text-[14px]">remove</span></span>
                    <span className="w-6 h-6 rounded-full bg-white/5 text-slate-500 flex items-center justify-center"><span className="material-symbols-outlined text-[14px]">remove</span></span>
                    <span className="w-6 h-6 rounded-full bg-white/5 text-slate-500 flex items-center justify-center"><span className="material-symbols-outlined text-[14px]">remove</span></span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">0%</span>
                </div>
                <Link to="/editor/3" className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold text-center transition-all">Mulai Raport</Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Home;
