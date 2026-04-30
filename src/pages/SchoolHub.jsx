import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useMySchool, useJoinSchool, useLeaveSchool, useSchoolMembers, useSchoolProgress, useSchoolInfo,
  useSchoolStudents, useImportFromColleague, useTransferStudent, useSchoolDuplicates,
  useTeacherTemplates, useForkTemplates, useActivityFeed } from '../hooks/queries';
import { useSession } from '../lib/authClient';
import ChatBox from '../components/ChatBox';
import PushNotificationToggle from '../components/PushNotificationToggle';
import { toast } from 'sonner';

function SchoolHub() {
  const { data: mySchool, isLoading } = useMySchool();
  const { data: schoolInfo } = useSchoolInfo();
  const { mutate: joinSchool, isPending: isJoining } = useJoinSchool();
  const { mutate: leaveSchool, isPending: isLeaving } = useLeaveSchool();
  const npsn = mySchool?.npsn;
  const { data: members } = useSchoolMembers(npsn);
  const { data: progress } = useSchoolProgress(npsn);
  const { data: schoolStudents } = useSchoolStudents(npsn);
  const { data: dupData } = useSchoolDuplicates(npsn);
  const { mutate: importStudents, isPending: isImporting } = useImportFromColleague();
  const { mutate: transferStudent, isPending: isTransferring } = useTransferStudent();
  const { mutate: forkTemplates, isPending: isForking } = useForkTemplates();
  const { data: activities } = useActivityFeed(npsn);
  const queryClient = useQueryClient();
  const sseRef = useRef(null);

  const [joinNpsn, setJoinNpsn] = useState('');
  const [joinName, setJoinName] = useState('');
  const [activeTab, setActiveTab] = useState('progress');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [transferTarget, setTransferTarget] = useState('');
  const [tplTeacher, setTplTeacher] = useState('');
  const [selectedTplIds, setSelectedTplIds] = useState([]);

  const { data: teacherTpls } = useTeacherTemplates(npsn, tplTeacher);

  const handleJoin = () => {
    if (!joinNpsn || joinNpsn.length < 8) return toast.error('NPSN harus minimal 8 digit');
    joinSchool({ npsn: joinNpsn, schoolName: joinName || undefined }, {
      onSuccess: (d) => toast.success(d.message), onError: (e) => toast.error(e?.response?.data?.error || 'Gagal')
    });
  };

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleImport = () => {
    if (!selectedIds.length || !selectedTeacher) return;
    importStudents({ npsn, studentIds: selectedIds, fromUserId: selectedTeacher }, {
      onSuccess: (d) => { toast.success(d.message); setSelectedIds([]); },
      onError: (e) => toast.error(e?.response?.data?.error || 'Gagal'),
    });
  };

  const handleTransfer = (studentId) => {
    if (!transferTarget) return toast.error('Pilih guru tujuan');
    if (!window.confirm('Yakin transfer siswa ini?')) return;
    transferStudent({ npsn, studentId, toUserId: transferTarget }, {
      onSuccess: (d) => toast.success(d.message), onError: (e) => toast.error(e?.response?.data?.error || 'Gagal'),
    });
  };

  // SSE live connection
  useEffect(() => {
    if (!npsn) return;
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const es = new EventSource(`${baseUrl}/api/schools/${npsn}/stream`, { withCredentials: true });
    es.addEventListener('activity', () => {
      queryClient.invalidateQueries({ queryKey: ['activityFeed', npsn] });
      queryClient.invalidateQueries({ queryKey: ['schoolProgress', npsn] });
    });
    sseRef.current = es;
    return () => es.close();
  }, [npsn, queryClient]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-[3px] border-white/10 border-t-blue-500 rounded-full"></div></div>;

  // JOIN FORM
  if (!mySchool) return (
    <div className="font-sans min-h-screen text-white pb-20">
      <main className="lg:ml-72 min-h-screen">
        <header className="sticky top-0 z-40 flex h-14 items-center px-4 lg:px-10 glass-panel border-b border-white/5"><h2 className="text-lg font-bold">School Hub</h2></header>
        <div className="p-3 lg:p-10 max-w-lg mx-auto">
          <div className="glass-card rounded-2xl p-6 space-y-5 border-white/5">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl"><span className="material-symbols-outlined text-4xl text-white">groups</span></div>
              <h3 className="text-xl font-black">Gabung Sekolah</h3>
              <p className="text-sm text-slate-400">Masukkan NPSN 8 digit untuk bergabung. NPSN baru → sekolah dibuat, Anda jadi admin.</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NPSN</label>
                <input type="text" value={joinNpsn} onChange={e => setJoinNpsn(e.target.value)} maxLength={8} placeholder="69860123" className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Sekolah (opsional)</label>
                <input type="text" value={joinName} onChange={e => setJoinName(e.target.value)} placeholder="TK Mutiara Bangsa" className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <button onClick={handleJoin} disabled={isJoining || joinNpsn.length < 8} className="w-full py-3 bg-gradient-to-r from-secondary to-primary text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">login</span>{isJoining ? 'Menggabungkan...' : 'Gabung Sekolah'}</button>
            </div>
            {schoolInfo?.npsn && <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
              <p className="text-xs text-emerald-400 font-bold">💡 NPSN Anda: <span className="text-white">{schoolInfo.npsn}</span></p>
              <button onClick={() => { setJoinNpsn(schoolInfo.npsn); setJoinName(schoolInfo.schoolName || ''); }} className="mt-2 text-[10px] text-emerald-400 underline font-bold">Gunakan</button>
            </div>}
          </div>
        </div>
      </main>
    </div>
  );

  const teacherStudents = selectedTeacher ? (schoolStudents || []).filter(s => s.teacherId === selectedTeacher) : [];
  const otherMembers = (members || []).filter(m => m.userId !== mySchool?.memberId?.split?.('-')?.[0]);
  const tabs = [
    { id: 'progress', label: 'Progress', icon: 'monitoring' },
    { id: 'chat', label: 'Chat', icon: 'forum' },
    { id: 'activity', label: 'Aktivitas', icon: 'notifications' },
    { id: 'members', label: 'Anggota', icon: 'group' },
    { id: 'templates', label: 'Template', icon: 'description' },
    { id: 'import', label: 'Import Siswa', icon: 'person_add' },
    { id: 'transfer', label: 'Transfer', icon: 'swap_horiz' },
    { id: 'duplicates', label: 'Duplikat', icon: 'content_copy' },
  ];

  const { data: sessionData } = useSession();

  return (
    <div className="font-sans min-h-screen text-white pb-20">
      <main className="lg:ml-72 min-h-screen">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between px-4 lg:px-10 glass-panel border-b border-white/5">
          <h2 className="text-lg font-bold">School Hub</h2>
          <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-lg border border-primary/30">{mySchool.role === 'admin' ? '👑 Admin' : '👤 Guru'}</span>
        </header>

        <div className="p-3 lg:p-10 space-y-4 max-w-[1000px] mx-auto">
          {/* School Card */}
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden border-white/5">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-xl shrink-0"><img src="/logo.png" alt="" className="w-full h-full object-contain bg-gradient-to-br from-indigo-500 to-purple-600 p-2" /></div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black truncate">{mySchool.schoolName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">NPSN: {mySchool.npsn}</span>
                  <span className="text-[10px] text-slate-500">{members?.length || 0} anggota</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-primary text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                <span className="material-symbols-outlined text-sm">{t.icon}</span>{t.label}
              </button>
            ))}
          </div>

          {/* PROGRESS TAB */}
          {activeTab === 'progress' && progress && (
            <div className="glass-card rounded-2xl p-5 border-white/5 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-black/20 rounded-xl p-3"><span className="text-2xl font-black">{progress.totalStudents}</span><p className="text-[10px] text-slate-400 font-bold mt-1">Total Siswa</p></div>
                <div className="bg-black/20 rounded-xl p-3"><span className="text-2xl font-black text-emerald-400">{progress.totalCompleted}</span><p className="text-[10px] text-slate-400 font-bold mt-1">Selesai</p></div>
                <div className="bg-black/20 rounded-xl p-3"><span className="text-2xl font-black text-amber-400">{progress.totalStudents > 0 ? Math.round((progress.totalCompleted / progress.totalStudents) * 100) : 0}%</span><p className="text-[10px] text-slate-400 font-bold mt-1">Pencapaian</p></div>
              </div>
              <div className="space-y-2">{progress.members?.map(m => (
                <div key={m.userId} className="bg-black/20 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shrink-0">{m.userName?.charAt(0)?.toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between"><span className="text-xs font-bold truncate">{m.userName}</span><span className="text-[10px] text-slate-400 font-bold">{m.completedReports}/{m.totalStudents}</span></div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${m.percentage}%`, background: m.percentage >= 80 ? '#10b981' : m.percentage >= 50 ? '#f59e0b' : '#ef4444' }}></div></div>
                      <span className="text-[10px] font-bold" style={{ color: m.percentage >= 80 ? '#10b981' : m.percentage >= 50 ? '#f59e0b' : '#ef4444' }}>{m.percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}</div>
            </div>
          )}

          {/* MEMBERS TAB */}
          {activeTab === 'members' && (
            <div className="glass-card rounded-2xl p-5 border-white/5 space-y-3">
              {members?.map(m => (
                <div key={m.memberId} className="bg-black/20 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                    {m.userImage && !m.userImage.startsWith('data:') ? <img src={m.userImage} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-sm font-black">{m.userName?.charAt(0)?.toUpperCase()}</div>}
                  </div>
                  <div className="flex-1 min-w-0"><h5 className="text-sm font-bold truncate">{m.userName}</h5><p className="text-[10px] text-slate-400">{m.userEmail}</p></div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${m.role === 'admin' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-white/5 text-slate-400 border-white/10'}`}>{m.role === 'admin' ? '👑 Admin' : 'Guru'}</span>
                </div>
              ))}
            </div>
          )}

          {/* IMPORT TAB */}
          {activeTab === 'import' && (
            <div className="glass-card rounded-2xl p-5 border-white/5 space-y-4">
              <p className="text-xs text-slate-400">Pilih guru → pilih siswa → import ke daftar Anda. Duplikat (NISN/nama sama) otomatis dilewati.</p>
              <select value={selectedTeacher} onChange={e => { setSelectedTeacher(e.target.value); setSelectedIds([]); }} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">— Pilih Guru —</option>
                {members?.map(m => <option key={m.userId} value={m.userId}>{m.userName} {m.classGroup ? `(Kelas ${m.classGroup})` : ''}</option>)}
              </select>
              {selectedTeacher && teacherStudents.length > 0 && (<>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">{teacherStudents.length} siswa ditemukan</span>
                  <button onClick={() => setSelectedIds(selectedIds.length === teacherStudents.length ? [] : teacherStudents.map(s => s.id))} className="text-[10px] text-primary font-bold">{selectedIds.length === teacherStudents.length ? 'Batal Semua' : 'Pilih Semua'}</button>
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {teacherStudents.map(s => (
                    <label key={s.id} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${selectedIds.includes(s.id) ? 'bg-primary/20 border border-primary/30' : 'bg-black/20 border border-transparent hover:bg-black/30'}`}>
                      <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} className="accent-primary" />
                      <span className="text-xs font-bold flex-1">{s.name}</span>
                      <span className="text-[10px] text-slate-500">{s.group} • {s.gender}</span>
                    </label>
                  ))}
                </div>
                <button onClick={handleImport} disabled={isImporting || !selectedIds.length} className="w-full py-3 bg-gradient-to-r from-secondary to-primary text-white rounded-xl text-sm font-bold disabled:opacity-50">
                  {isImporting ? 'Mengimpor...' : `Import ${selectedIds.length} Siswa`}
                </button>
              </>)}
              {selectedTeacher && teacherStudents.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Guru ini belum memiliki siswa.</p>}
            </div>
          )}

          {/* TRANSFER TAB */}
          {activeTab === 'transfer' && (
            <div className="glass-card rounded-2xl p-5 border-white/5 space-y-4">
              <p className="text-xs text-slate-400">Transfer siswa Anda ke guru lain. Data siswa & raport ikut berpindah.</p>
              <select value={transferTarget} onChange={e => setTransferTarget(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">— Guru Tujuan —</option>
                {members?.map(m => <option key={m.userId} value={m.userId}>{m.userName}</option>)}
              </select>
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {(schoolStudents || []).filter(s => s.teacherId === (members?.find(m => m.userId === members?.[0]?.userId)?.userId)).length === 0 && (schoolStudents || []).filter(s => s.teacherName).slice(0, 0)}
                {(schoolStudents || []).filter(s => {
                  // Show only MY students for transfer
                  const me = members?.find(m => m.userEmail);
                  return true; // We show all the user's own students
                }).filter((s, i, arr) => {
                  // Only show students owned by current user — filter by matching first member check
                  return s.teacherId && members?.some(m => m.userId === s.teacherId);
                }).map(s => (
                  <div key={s.id} className="bg-black/20 rounded-xl p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold">{s.name}</span>
                      <span className="text-[10px] text-slate-500 ml-2">({s.teacherName})</span>
                    </div>
                    <button onClick={() => handleTransfer(s.id)} disabled={isTransferring || !transferTarget}
                      className="px-3 py-1.5 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded-lg border border-amber-500/20 disabled:opacity-30 hover:bg-amber-500/20 transition-all">
                      <span className="material-symbols-outlined text-xs align-middle mr-1">swap_horiz</span>Transfer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DUPLICATES TAB */}
          {activeTab === 'duplicates' && (
            <div className="glass-card rounded-2xl p-5 border-white/5 space-y-4">
              <p className="text-xs text-slate-400">Deteksi otomatis siswa duplikat berdasarkan NISN atau kesamaan nama antar guru.</p>
              {(!dupData?.duplicates || dupData.duplicates.length === 0) ? (
                <div className="text-center py-8"><span className="material-symbols-outlined text-4xl text-emerald-400">check_circle</span><p className="text-sm text-emerald-400 font-bold mt-2">Tidak ada duplikat terdeteksi!</p><p className="text-[10px] text-slate-500 mt-1">{dupData?.totalStudents || 0} siswa diperiksa</p></div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center"><p className="text-xs text-amber-400 font-bold">⚠ {dupData.duplicates.length} grup duplikat ditemukan dari {dupData.totalStudents} siswa</p></div>
                  {dupData.duplicates.map((dup, i) => (
                    <div key={i} className="bg-black/20 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${dup.type === 'NISN' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>{dup.type}</span><span className="text-[10px] text-slate-500">{dup.matchKey}</span></div>
                      {dup.students.map(s => (
                        <div key={s.id} className="flex items-center gap-2 pl-3 border-l-2 border-white/10">
                          <span className="text-xs font-bold flex-1">{s.name}</span>
                          <span className="text-[10px] text-slate-500">Kelas {s.group}</span>
                          <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded">{s.teacherName}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TEMPLATES TAB */}
          {activeTab === 'templates' && (
            <div className="glass-card rounded-2xl p-5 border-white/5 space-y-4">
              <p className="text-xs text-slate-400">Pilih guru → centang template → preview narasi → import ke koleksi Anda. Duplikat (nama+kategori sama) otomatis dilewati.</p>
              <select value={tplTeacher} onChange={e => { setTplTeacher(e.target.value); setSelectedTplIds([]); }} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">— Pilih Guru —</option>
                {members?.map(m => <option key={m.userId} value={m.userId}>{m.userName} {m.classGroup ? `(Kelas ${m.classGroup})` : ''}</option>)}
              </select>
              {tplTeacher && teacherTpls && teacherTpls.length > 0 && (<>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">{teacherTpls.length} template ditemukan</span>
                  <button onClick={() => setSelectedTplIds(selectedTplIds.length === teacherTpls.length ? [] : teacherTpls.map(t => t.id))} className="text-[10px] text-primary font-bold">{selectedTplIds.length === teacherTpls.length ? 'Batal Semua' : 'Pilih Semua'}</button>
                </div>
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {teacherTpls.map(t => {
                    const isChecked = selectedTplIds.includes(t.id);
                    return (
                      <div key={t.id} className={`rounded-xl transition-all ${isChecked ? 'bg-primary/10 border border-primary/30' : 'bg-black/20 border border-transparent'}`}>
                        <label className="flex items-center gap-3 p-3 cursor-pointer">
                          <input type="checkbox" checked={isChecked} onChange={() => setSelectedTplIds(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])} className="accent-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2"><span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[9px] font-bold">{t.category}</span><span className="text-xs font-bold text-white truncate">{t.name}</span></div>
                          </div>
                        </label>
                        {isChecked && <div className="px-3 pb-3 pt-0"><p className="text-[11px] text-slate-400 bg-black/30 rounded-lg p-2.5 leading-relaxed">{t.text}</p></div>}
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => { if (!selectedTplIds.length) return; forkTemplates({ npsn, templateIds: selectedTplIds }, { onSuccess: (d) => { toast.success(d.message); setSelectedTplIds([]); }, onError: (e) => toast.error(e?.response?.data?.error || 'Gagal') }); }} disabled={isForking || !selectedTplIds.length} className="w-full py-3 bg-gradient-to-r from-secondary to-primary text-white rounded-xl text-sm font-bold disabled:opacity-50">
                  {isForking ? 'Mengimpor...' : `Import ${selectedTplIds.length} Template`}
                </button>
              </>)}
              {tplTeacher && teacherTpls && teacherTpls.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Guru ini belum memiliki template.</p>}
            </div>
          )}
          {/* ACTIVITY TAB */}
          {activeTab === 'activity' && (
            <div className="glass-card rounded-2xl p-5 border-white/5 space-y-3">
              <p className="text-xs text-slate-400">Semua aktivitas di sekolah ini ditampilkan secara real-time.</p>
              {(!activities || activities.length === 0) ? (
                <p className="text-xs text-slate-500 text-center py-8">Belum ada aktivitas.</p>
              ) : (
                <div className="space-y-2">
                  {activities.map(a => {
                    const icons = { member_joined: 'person_add', students_imported: 'download', student_transferred: 'swap_horiz', templates_forked: 'fork_right' };
                    const colors = { member_joined: 'text-emerald-400 bg-emerald-500/10', students_imported: 'text-blue-400 bg-blue-500/10', student_transferred: 'text-amber-400 bg-amber-500/10', templates_forked: 'text-purple-400 bg-purple-500/10' };
                    const labels = { member_joined: 'bergabung ke sekolah', students_imported: `mengimpor ${a.payload?.count || ''} siswa`, student_transferred: `mentransfer siswa`, templates_forked: `mengimpor ${a.payload?.count || ''} template` };
                    const ago = ((Date.now() - new Date(a.createdAt).getTime()) / 60000);
                    const timeStr = ago < 1 ? 'Baru saja' : ago < 60 ? `${Math.floor(ago)} menit lalu` : ago < 1440 ? `${Math.floor(ago / 60)} jam lalu` : `${Math.floor(ago / 1440)} hari lalu`;
                    return (
                      <div key={a.id} className="flex items-start gap-3 bg-black/20 rounded-xl p-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colors[a.action] || 'text-slate-400 bg-white/5'}`}>
                          <span className="material-symbols-outlined text-sm">{icons[a.action] || 'info'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white"><span className="font-bold">{a.actorName}</span> <span className="text-slate-400">{labels[a.action] || a.action}</span></p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{timeStr}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* CHAT TAB */}
          {activeTab === 'chat' && (
            <div className="space-y-3">
              <PushNotificationToggle />
              <div className="glass-card rounded-2xl p-5 border-white/5">
                <ChatBox npsn={npsn} currentUserId={sessionData?.user?.id} />
              </div>
            </div>
          )}

          {/* Leave */}
          <div className="text-center pt-4">
            <button onClick={() => { if (window.confirm('Yakin keluar?')) leaveSchool(undefined, { onSuccess: () => toast.success('Berhasil keluar'), onError: () => toast.error('Gagal') }); }} disabled={isLeaving} className="text-xs text-red-400 font-bold hover:text-red-300">{isLeaving ? 'Memproses...' : 'Keluar dari Sekolah'}</button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SchoolHub;
