import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useStudents, useCreateStudent, useDeleteStudent, useImportExcel } from '../hooks/queries';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('siswa');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    phase: 'Fondasi',
    group: 'A',
    height: '',
    weight: '',
    gender: 'L',
    nisn: '',
    nik: ''
  });
  
  const fileInputRef = useRef(null);
  
  const { data: studentsData, isLoading } = useStudents();
  const { mutate: addStudentMutate } = useCreateStudent();
  const { mutate: deleteStudentMutate } = useDeleteStudent();
  const { mutate: importExcelMutate, isPending: isImporting } = useImportExcel();

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if(window.confirm(`Yakin ingin mengimpor data dari ${file.name}?`)) {
      importExcelMutate(file, {
        onSuccess: (data) => {
          alert(`Berhasil mengimpor ${data.count} murid!`);
          e.target.value = null; // reset input
        },
        onError: () => {
          alert('Gagal mengimpor data. Pastikan format Excel sesuai template.');
          e.target.value = null; // reset input
        }
      });
    } else {
      e.target.value = null;
    }
  };

  const students = studentsData || [];

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="font-sans overflow-x-hidden min-h-screen text-white pb-32">
      {/* NavigationDrawer (Desktop) */}
      <aside className="hidden lg:flex flex-col h-screen p-4 gap-4 fixed left-0 top-0 w-72 border-r border-white/10 glass-panel z-50">
        <div className="flex flex-col gap-1 px-4 py-8">
          <div className="w-12 h-12 rounded-2xl overflow-hidden mb-4 shadow-lg shadow-primary/30">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">CetakRaport</h1>
          <p className="text-sm text-slate-400 font-medium">TK Modern Dashboard</p>
        </div>
        <nav className="flex flex-col gap-2 mt-4">
          <Link className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all" to="/">
            <span className="material-symbols-outlined text-[22px]" data-icon="space_dashboard">space_dashboard</span>
            <span className="text-[15px] font-medium">Dashboard</span>
          </Link>
          <Link className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all" to="/setup">
            <span className="material-symbols-outlined text-[22px]" data-icon="settings">settings</span>
            <span className="text-[15px] font-medium">Pengaturan</span>
          </Link>
          <div className="flex items-center gap-4 rounded-2xl bg-white/10 px-4 py-3 text-white font-bold backdrop-blur-md border border-white/5 shadow-lg">
            <span className="material-symbols-outlined text-primary text-[22px]" data-icon="database">database</span>
            <span className="text-[15px]">Data Master</span>
          </div>
          <Link className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all" to="/editor">
            <span className="material-symbols-outlined text-[22px]" data-icon="edit_note">edit_note</span>
            <span className="text-[15px] font-medium">Input Nilai</span>
          </Link>
          <Link className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all" to="/print">
            <span className="material-symbols-outlined text-[22px]" data-icon="print">print</span>
            <span className="text-[15px] font-medium">Cetak Raport</span>
          </Link>
        </nav>
        <div className="mt-auto p-4 flex items-center gap-4 glass-card rounded-3xl">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-secondary to-primary flex items-center justify-center text-white font-black text-lg shadow-inner">
            G
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-tight">Bu Guru Siti</span>
            <span className="text-xs text-slate-400">Wali Kelas A</span>
          </div>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="lg:ml-72 min-h-screen">
        {/* TopAppBar */}
        <header className="sticky top-0 z-40 flex h-20 w-full items-center justify-between px-6 lg:px-10 glass-panel border-b border-white/5">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-white bg-white/5 rounded-full backdrop-blur-md">
              <span className="material-symbols-outlined" data-icon="menu">menu</span>
            </button>
            <h2 className="text-xl font-bold text-white tracking-tight hidden sm:block">Data Master</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full glass-card text-slate-200 text-xs font-bold tracking-wider">
              2025/2026 - Gasal
            </div>
            <button className="w-10 h-10 flex items-center justify-center text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors relative">
              <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 lg:p-10 space-y-8 max-w-[1440px] mx-auto">
          {/* Header Action / Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-card p-6 rounded-[2rem] border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-20">
              <div className="w-32 h-32 bg-primary rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                <span className="material-symbols-outlined text-3xl" data-icon="database">database</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Data Entitas Sekolah</h3>
                <p className="text-slate-400 text-sm mt-1">Kelola data murid, kelas, dan penempatan wali kelas</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-white/10 pb-4">
            <button 
              onClick={() => setActiveTab('siswa')}
              className={`px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 ${activeTab === 'siswa' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <span className="material-symbols-outlined text-[20px]" data-icon="group">group</span>
              Data Siswa
            </button>
            <button 
              onClick={() => setActiveTab('kelas')}
              className={`px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 ${activeTab === 'kelas' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <span className="material-symbols-outlined text-[20px]" data-icon="meeting_room">meeting_room</span>
              Data Kelas & Guru
            </button>
          </div>

          {activeTab === 'siswa' && (
            <div className="space-y-6">
              {/* Toolbar Data Siswa */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white/5 p-4 rounded-[1.5rem] border border-white/10">
                <div className="flex gap-4 w-full md:w-auto">
                  <input 
                    type="file" 
                    accept=".csv" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleImport}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="flex items-center gap-2 px-5 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full transition-all text-sm font-bold shadow-inner"
                  >
                    <span className="material-symbols-outlined text-lg">{isImporting ? 'sync' : 'upload_file'}</span>
                    {isImporting ? 'Mengimpor...' : 'Import Excel'}
                  </button>
                  <div className="relative flex-1 md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-slate-400" data-icon="search">search</span>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Cari murid..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-full pl-12 pr-4 py-3.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-black/40 transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* List Kartu Murid Modern */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
            {filteredStudents.map((student) => (
              <div key={student.id} className="glass-card rounded-[2rem] p-6 flex flex-col gap-5 group hover:bg-white/5 transition-all relative overflow-hidden border-white/5 hover:border-primary/30 cursor-pointer hover:-translate-y-1">
                <div className="absolute top-0 right-0 p-6 flex gap-2 z-20">
                  <Link to={`/print/${student.id}`} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center text-slate-300 transition-colors backdrop-blur-md">
                    <span className="material-symbols-outlined text-[18px]" data-icon="print">print</span>
                  </Link>
                  <button onClick={(e) => {
                      e.preventDefault();
                      if(window.confirm('PERINGATAN: Apakah Anda yakin ingin menghapus murid ini?')) {
                        if(window.confirm('KONFIRMASI TERAKHIR: Seluruh data nilai raport akan hilang dan tidak dapat dikembalikan. Lanjutkan hapus?')) {
                          deleteStudentMutate(student.id);
                        }
                      }
                    }} className="w-10 h-10 rounded-full bg-accent/10 hover:bg-accent flex items-center justify-center text-accent hover:text-white transition-colors backdrop-blur-md">
                    <span className="material-symbols-outlined text-[18px]" data-icon="delete">delete</span>
                  </button>
                </div>
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xl font-black shadow-lg">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white tracking-tight truncate max-w-[140px]">{student.name}</h4>
                    <p className="text-xs text-slate-400 mt-1 flex gap-2 items-center">
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-300 border border-white/5">Fase {student.phase}</span>
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-300 border border-white/5">Kelas {student.group}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2 relative z-10">
                  <div className="bg-black/20 rounded-2xl p-3 flex flex-col justify-center items-center shadow-inner">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Tinggi</span>
                    <span className="font-bold text-secondary text-lg leading-none">{student.height || '--'} <span className="text-[10px] text-slate-500">cm</span></span>
                  </div>
                  <div className="bg-black/20 rounded-2xl p-3 flex flex-col justify-center items-center shadow-inner">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Berat</span>
                    <span className="font-bold text-secondary text-lg leading-none">{student.weight || '--'} <span className="text-[10px] text-slate-500">kg</span></span>
                  </div>
                </div>

                <Link to={`/editor/${student.id}`} className="w-full py-3.5 bg-white/10 hover:bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all mt-2 group-hover:shadow-[0_0_20px_rgba(79,70,229,0.3)] relative z-10">
                  <span className="material-symbols-outlined text-[18px]" data-icon="edit_document">edit_document</span>
                  Isi Raport
                </Link>
              </div>
            ))}
            
            {filteredStudents.length === 0 && (
              <div className="xl:col-span-3 py-20 flex flex-col items-center justify-center text-center glass-card rounded-[2rem]">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-slate-500 text-4xl" data-icon="search_off">search_off</span>
                </div>
                <p className="text-xl font-bold text-white mb-2">Tidak ada murid ditemukan</p>
                <p className="text-slate-400">Coba ubah kata kunci pencarian Anda atau tambahkan murid baru.</p>
              </div>
            )}
          </div>
        </div>
      )}

          {activeTab === 'kelas' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-[1.5rem] border border-white/10">
                <h4 className="text-xl font-bold text-white px-2">Manajemen Kelas & Wali Kelas</h4>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-secondary to-primary hover:from-primary hover:to-secondary text-white rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95">
                  <span className="material-symbols-outlined text-[18px]">add_circle</span> Tambah Kelas Baru
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-[2rem] border-white/5">
                  <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xl font-black shadow-lg">
                        A
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white tracking-tight">Kelompok A</h4>
                        <p className="text-xs text-slate-400">Fase Fondasi</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button className="w-8 h-8 rounded-full bg-accent/10 hover:bg-accent text-accent hover:text-white flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Wali Kelas:</span>
                      <span className="font-bold text-white">Bu Guru Siti</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Jumlah Siswa:</span>
                      <span className="font-bold text-emerald-400">12 Siswa</span>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-[2rem] border-white/5">
                  <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-xl font-black shadow-lg">
                        B
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white tracking-tight">Kelompok B</h4>
                        <p className="text-xs text-slate-400">Fase Fondasi</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button className="w-8 h-8 rounded-full bg-accent/10 hover:bg-accent text-accent hover:text-white flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Wali Kelas:</span>
                      <span className="font-bold text-white">Pak Guru Budi</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Jumlah Siswa:</span>
                      <span className="font-bold text-amber-400">15 Siswa</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {activeTab === 'siswa' && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="fixed bottom-24 lg:bottom-10 right-6 lg:right-10 w-16 h-16 bg-gradient-to-r from-secondary to-primary rounded-full shadow-[0_10px_25px_rgba(79,70,229,0.5)] flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all z-50 group border border-white/20"
          >
            <span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform duration-300" data-icon="person_add">person_add</span>
          </button>
        )}
      </main>

      {/* Modern Glass Modal Tambah Murid */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="glass-card rounded-[2.5rem] w-full max-w-md p-8 relative animate-in fade-in zoom-in duration-300 border border-white/20 shadow-2xl">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/20 text-white transition-colors backdrop-blur-md"
            >
              <span className="material-symbols-outlined text-[20px]" data-icon="close">close</span>
            </button>
            <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-lg mb-6">
              <span className="material-symbols-outlined text-2xl" data-icon="person_add">person_add</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-8 tracking-tight">Tambah Murid Baru</h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest pl-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={newStudent.name} 
                  onChange={e => setNewStudent({...newStudent, name: e.target.value})} 
                  className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner placeholder-slate-500" 
                  placeholder="Cth: Budi Santoso" 
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest pl-1">Fase</label>
                  <select 
                    value={newStudent.phase} 
                    onChange={e => setNewStudent({...newStudent, phase: e.target.value})} 
                    className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner appearance-none"
                  >
                    <option className="bg-slate-900" value="Fondasi">Fondasi</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest pl-1">Kelompok</label>
                  <select 
                    value={newStudent.group} 
                    onChange={e => setNewStudent({...newStudent, group: e.target.value})} 
                    className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner appearance-none"
                  >
                    <option className="bg-slate-900" value="A">A</option>
                    <option className="bg-slate-900" value="B">B</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest pl-1">Jenis Kelamin</label>
                  <select 
                    value={newStudent.gender} 
                    onChange={e => setNewStudent({...newStudent, gender: e.target.value})} 
                    className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner appearance-none"
                  >
                    <option className="bg-slate-900" value="L">Laki-laki (L)</option>
                    <option className="bg-slate-900" value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest pl-1">NISN</label>
                  <input 
                    type="text" 
                    value={newStudent.nisn} 
                    onChange={e => setNewStudent({...newStudent, nisn: e.target.value})} 
                    className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner placeholder-slate-500" 
                    placeholder="NISN (Opsional)" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest pl-1">Tinggi (cm)</label>
                  <input 
                    type="number" 
                    value={newStudent.height} 
                    onChange={e => setNewStudent({...newStudent, height: e.target.value})} 
                    className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner placeholder-slate-500" 
                    placeholder="110" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest pl-1">Berat (kg)</label>
                  <input 
                    type="number" 
                    value={newStudent.weight} 
                    onChange={e => setNewStudent({...newStudent, weight: e.target.value})} 
                    className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner placeholder-slate-500" 
                    placeholder="20" 
                  />
                </div>
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 px-4 rounded-2xl font-bold text-slate-300 hover:bg-white/10 transition-colors">Batal</button>
              <button 
                onClick={() => {
                  if (newStudent.name.trim() === '') return alert('Nama harus diisi');
                  addStudentMutate({...newStudent});
                  setShowAddModal(false);
                  setNewStudent({ name: '', phase: 'Fondasi', group: 'A', height: '', weight: '', gender: 'L', nisn: '', nik: '' });
                }} 
                className="flex-[2] py-4 px-4 rounded-2xl font-bold text-white bg-gradient-to-r from-primary to-indigo-500 hover:from-indigo-500 hover:to-primary shadow-lg shadow-primary/30 transition-all active:scale-95"
              >
                Simpan Murid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
