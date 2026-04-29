import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMySchool, useJoinSchool, useLeaveSchool, useSchoolMembers, useSchoolProgress, useSchoolInfo } from '../hooks/queries';

function SchoolHub() {
  const { data: mySchool, isLoading } = useMySchool();
  const { data: schoolInfo } = useSchoolInfo();
  const { mutate: joinSchool, isPending: isJoining } = useJoinSchool();
  const { mutate: leaveSchool, isPending: isLeaving } = useLeaveSchool();

  const npsn = mySchool?.npsn;
  const { data: members } = useSchoolMembers(npsn);
  const { data: progress } = useSchoolProgress(npsn);

  const [joinNpsn, setJoinNpsn] = useState('');
  const [joinName, setJoinName] = useState('');

  const handleJoin = () => {
    if (!joinNpsn || joinNpsn.length < 8) return alert('NPSN harus minimal 8 digit');
    joinSchool(
      { npsn: joinNpsn, schoolName: joinName || undefined },
      {
        onSuccess: (data) => alert(data.message),
        onError: (err) => alert(err?.response?.data?.error || 'Gagal bergabung'),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="font-sans min-h-screen text-white flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-[3px] border-white/10 border-t-blue-500 rounded-full"></div>
      </div>
    );
  }

  // If not joined any school — show join form
  if (!mySchool) {
    return (
      <div className="font-sans overflow-x-hidden min-h-screen text-white pb-20">
        <main className="lg:ml-72 min-h-screen">
          <header className="sticky top-0 z-40 flex h-14 w-full items-center px-4 lg:px-10 glass-panel border-b border-white/5">
            <h2 className="text-lg font-bold text-white tracking-tight">School Hub</h2>
          </header>

          <div className="p-3 lg:p-10 max-w-lg mx-auto">
            <div className="glass-card rounded-2xl p-6 space-y-5 border-white/5">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl">
                  <span className="material-symbols-outlined text-4xl text-white">groups</span>
                </div>
                <h3 className="text-xl font-black text-white">Gabung Sekolah</h3>
                <p className="text-sm text-slate-400">Masukkan NPSN untuk bergabung ke hub sekolah. Jika NPSN belum terdaftar, sekolah baru akan dibuat dan Anda menjadi admin.</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NPSN (8 digit)</label>
                  <input type="text" value={joinNpsn} onChange={e => setJoinNpsn(e.target.value)} maxLength={8} placeholder="Cth: 69860123"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Sekolah (opsional, untuk sekolah baru)</label>
                  <input type="text" value={joinName} onChange={e => setJoinName(e.target.value)} placeholder="Cth: TK Mutiara Bangsa"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary shadow-inner" />
                </div>
                <button onClick={handleJoin} disabled={isJoining || joinNpsn.length < 8}
                  className="w-full py-3 bg-gradient-to-r from-secondary to-primary text-white rounded-xl text-sm font-bold active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg">login</span>
                  {isJoining ? 'Menggabungkan...' : 'Gabung Sekolah'}
                </button>
              </div>

              {schoolInfo?.npsn && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                  <p className="text-xs text-emerald-400 font-bold">💡 NPSN Anda saat ini: <span className="text-white">{schoolInfo.npsn}</span></p>
                  <button onClick={() => { setJoinNpsn(schoolInfo.npsn); setJoinName(schoolInfo.schoolName || ''); }}
                    className="mt-2 text-[10px] text-emerald-400 underline font-bold">Gunakan NPSN ini</button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Joined — show school hub dashboard
  return (
    <div className="font-sans overflow-x-hidden min-h-screen text-white pb-20">
      <main className="lg:ml-72 min-h-screen">
        <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between px-4 lg:px-10 glass-panel border-b border-white/5">
          <h2 className="text-lg font-bold text-white tracking-tight">School Hub</h2>
          <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-lg border border-primary/30">{mySchool.role === 'admin' ? '👑 Admin' : '👤 Guru'}</span>
        </header>

        <div className="p-3 lg:p-10 space-y-4 max-w-[1000px] mx-auto">
          {/* School Card */}
          <div className="glass-card rounded-2xl p-5 lg:p-8 relative overflow-hidden border-white/5">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 lg:w-20 lg:h-20 rounded-2xl overflow-hidden shadow-xl shrink-0">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain bg-gradient-to-br from-indigo-500 to-purple-600 p-2" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg lg:text-2xl font-black text-white truncate">{mySchool.schoolName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">NPSN: {mySchool.npsn}</span>
                  <span className="text-[10px] text-slate-500">{members?.length || 0} anggota</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Overview */}
          {progress && (
            <div className="glass-card rounded-2xl p-5 border-white/5 space-y-4">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">monitoring</span>
                Progress Raport
              </h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-black/20 rounded-xl p-3">
                  <span className="text-2xl font-black text-white">{progress.totalStudents}</span>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Total Siswa</p>
                </div>
                <div className="bg-black/20 rounded-xl p-3">
                  <span className="text-2xl font-black text-emerald-400">{progress.totalCompleted}</span>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Raport Selesai</p>
                </div>
                <div className="bg-black/20 rounded-xl p-3">
                  <span className="text-2xl font-black text-amber-400">
                    {progress.totalStudents > 0 ? Math.round((progress.totalCompleted / progress.totalStudents) * 100) : 0}%
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Pencapaian</p>
                </div>
              </div>

              {/* Per-member progress */}
              <div className="space-y-2">
                {progress.members?.map((m) => (
                  <div key={m.userId} className="bg-black/20 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                      {m.userName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">{m.userName}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{m.completedReports}/{m.totalStudents}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${m.percentage}%`,
                              background: m.percentage >= 80 ? '#10b981' : m.percentage >= 50 ? '#f59e0b' : '#ef4444'
                            }}></div>
                        </div>
                        <span className="text-[10px] font-bold" style={{
                          color: m.percentage >= 80 ? '#10b981' : m.percentage >= 50 ? '#f59e0b' : '#ef4444'
                        }}>{m.percentage}%</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {m.role === 'admin' && <span className="text-[9px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">Admin</span>}
                        {m.classGroup && <span className="text-[9px] text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded">Kelas {m.classGroup}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members List */}
          <div className="glass-card rounded-2xl p-5 border-white/5 space-y-4">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">group</span>
              Anggota Sekolah ({members?.length || 0})
            </h4>
            <div className="space-y-2">
              {members?.map((m) => (
                <div key={m.memberId} className="bg-black/20 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                    {m.userImage && !m.userImage.startsWith('data:') ? (
                      <img src={m.userImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-sm font-black">
                        {m.userName?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-bold text-white truncate">{m.userName}</h5>
                    <p className="text-[10px] text-slate-400">{m.userEmail}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      m.role === 'admin' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-white/5 text-slate-400 border-white/10'
                    }`}>{m.role === 'admin' ? '👑 Admin' : 'Guru'}</span>
                    {m.classGroup && <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-bold border border-cyan-500/30">Kelas {m.classGroup}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leave Button */}
          <div className="text-center pt-4">
            <button onClick={() => {
              if (window.confirm('Yakin ingin keluar dari sekolah ini?')) {
                leaveSchool(undefined, {
                  onSuccess: () => alert('Berhasil keluar dari sekolah'),
                  onError: () => alert('Gagal keluar'),
                });
              }
            }} disabled={isLeaving}
              className="text-xs text-red-400 font-bold hover:text-red-300 transition-colors">
              {isLeaving ? 'Memproses...' : 'Keluar dari Sekolah'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SchoolHub;
