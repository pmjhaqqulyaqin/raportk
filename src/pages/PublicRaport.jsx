import React from 'react';
import { useParams } from 'react-router-dom';
import { usePublicRaport } from '../hooks/queries';

function PublicRaport() {
  const { token } = useParams();
  const { data, isLoading, isError } = usePublicRaport(token);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center gap-4"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
        <img src="/logo.png" alt="Logo" className="w-20 h-20 rounded-3xl object-contain animate-pulse" />
        <p className="text-slate-400 text-sm font-bold">Memuat raport...</p>
        <div className="w-8 h-8 border-[3px] border-white/10 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center gap-6 px-6"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
        <div className="w-20 h-20 rounded-[1.5rem] bg-red-500/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-red-400 text-4xl">link_off</span>
        </div>
        <div className="text-center">
          <h1 className="text-xl font-black text-white mb-2">Link Tidak Valid</h1>
          <p className="text-slate-400 text-sm max-w-xs">Link raport ini sudah tidak berlaku atau belum tersedia. Silakan hubungi guru kelas untuk mendapatkan link yang baru.</p>
        </div>
      </div>
    );
  }

  const { student, report, school } = data;

  return (
    <div className="font-sans min-h-screen text-white" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-white/5 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-9 h-9 rounded-xl object-contain" />
          <div>
            <h1 className="text-sm font-black text-white leading-tight">{school.schoolName}</h1>
            <p className="text-[10px] text-slate-400">{school.academicYear} — Semester {school.semester}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-20">
        {/* Student Identity Card */}
        <div className="glass-card rounded-2xl p-5 border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-20">
            <div className="w-24 h-24 bg-primary rounded-full blur-3xl" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">{student.name}</h2>
              <div className="flex gap-2 mt-1">
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 border border-white/5 text-slate-300 font-bold">Fase {student.phase}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 border border-white/5 text-slate-300 font-bold">Kelas {student.group}</span>
                {student.gender && <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 border border-white/5 text-slate-300 font-bold">{student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>}
              </div>
            </div>
          </div>
          {/* Extra student info */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/5">
            {student.nisn && (
              <div className="bg-black/20 rounded-xl p-2.5 text-center">
                <span className="text-[9px] text-slate-400 uppercase font-bold">NISN</span>
                <span className="block font-bold text-white text-xs mt-0.5">{student.nisn}</span>
              </div>
            )}
            {student.height && (
              <div className="bg-black/20 rounded-xl p-2.5 text-center">
                <span className="text-[9px] text-slate-400 uppercase font-bold">Tinggi</span>
                <span className="block font-bold text-secondary text-xs mt-0.5">{student.height} cm</span>
              </div>
            )}
            {student.weight && (
              <div className="bg-black/20 rounded-xl p-2.5 text-center">
                <span className="text-[9px] text-slate-400 uppercase font-bold">Berat</span>
                <span className="block font-bold text-secondary text-xs mt-0.5">{student.weight} kg</span>
              </div>
            )}
            {student.birthPlace && (
              <div className="bg-black/20 rounded-xl p-2.5 text-center">
                <span className="text-[9px] text-slate-400 uppercase font-bold">TTL</span>
                <span className="block font-bold text-white text-xs mt-0.5">{student.birthPlace}{student.birthDate ? `, ${student.birthDate}` : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* Narrative Sections */}
        {[
          { title: '1. Nilai Agama & Budi Pekerti', icon: 'auto_awesome', color: 'from-amber-400 to-orange-500', content: report.agama },
          { title: '2. Jati Diri', icon: 'face', color: 'from-pink-400 to-rose-500', content: report.jatiDiri },
          { title: '3. Dasar Literasi & STEAM', icon: 'menu_book', color: 'from-cyan-400 to-blue-500', content: report.literasi },
          { title: '4. Projek Penguatan Profil Pelajar Pancasila', icon: 'star', color: 'from-emerald-400 to-green-500', content: report.p5 },
        ].map((section, idx) => (
          <div key={idx} className="glass-card rounded-2xl border-white/5 overflow-hidden">
            <div className={`bg-gradient-to-r ${section.color} px-4 py-2.5 flex items-center gap-2`}>
              <span className="material-symbols-outlined text-white text-[16px]">{section.icon}</span>
              <h3 className="text-xs font-black text-white">{section.title}</h3>
            </div>
            <div className="p-4">
              {section.content ? (
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{section.content}</p>
              ) : (
                <p className="text-sm text-slate-500 italic">Belum ada narasi.</p>
              )}
            </div>
          </div>
        ))}

        {/* Attendance */}
        <div className="glass-card rounded-2xl p-5 border-white/5">
          <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px]">event_available</span>
            Ketidakhadiran
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-amber-500/10 rounded-xl p-3 text-center border border-amber-500/20">
              <span className="text-2xl font-black text-amber-400">{report.attendanceSick || 0}</span>
              <span className="block text-[9px] text-amber-300/70 font-bold uppercase mt-1">Sakit</span>
            </div>
            <div className="bg-emerald-500/10 rounded-xl p-3 text-center border border-emerald-500/20">
              <span className="text-2xl font-black text-emerald-400">{report.attendancePermission || 0}</span>
              <span className="block text-[9px] text-emerald-300/70 font-bold uppercase mt-1">Izin</span>
            </div>
            <div className="bg-slate-500/10 rounded-xl p-3 text-center border border-slate-500/20">
              <span className="text-2xl font-black text-slate-400">{report.attendanceUnexcused || 0}</span>
              <span className="block text-[9px] text-slate-300/70 font-bold uppercase mt-1">Tanpa Ket.</span>
            </div>
          </div>
        </div>

        {/* Parent Reflection */}
        {report.parentReflection && (
          <div className="glass-card rounded-2xl p-5 border-white/5">
            <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">family_restroom</span>
              Catatan Orang Tua
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap italic">{report.parentReflection}</p>
          </div>
        )}

        {/* Signature Info */}
        <div className="glass-card rounded-2xl p-5 border-white/5">
          <div className="grid grid-cols-2 gap-6 text-center text-xs">
            <div className="space-y-1">
              <p className="text-slate-400">Guru Kelas</p>
              <p className="font-bold text-white">{school.teacher || '-'}</p>
              {school.teacherNip && <p className="text-[10px] text-slate-500">NIP. {school.teacherNip}</p>}
            </div>
            <div className="space-y-1">
              <p className="text-slate-400">Kepala Sekolah</p>
              <p className="font-bold text-white">{school.principal || '-'}</p>
              {school.principalNip && <p className="text-[10px] text-slate-500">NIP. {school.principalNip}</p>}
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-500 mt-4 pt-3 border-t border-white/5">
            {school.location}, {school.date || '-'}
          </p>
        </div>

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-[10px] text-slate-600">
            Dokumen ini dihasilkan oleh <span className="font-bold text-slate-500">RaportK</span> — Aplikasi Raport Kurikulum Merdeka
          </p>
          <a href="/legal" className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">Kebijakan Privasi</a>
        </div>
      </main>
    </div>
  );
}

export default PublicRaport;
