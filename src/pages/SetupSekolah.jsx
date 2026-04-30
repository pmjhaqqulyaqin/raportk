import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSchoolInfo, useUpdateSchoolInfo, useStudents, useCreateStudent, useDeleteStudent, useImportExcel } from '../hooks/queries';
import apiClient from '../lib/apiClient';
import { toast } from 'sonner';

function SetupSekolah() {
  const { data: schoolInfo, isLoading } = useSchoolInfo();
  const { mutate: updateSchoolInfo, isPending: isUpdating } = useUpdateSchoolInfo();
  
  const [formData, setFormData] = useState({
    schoolName: '',
    npsn: '',
    principal: '',
    principalNip: '',
    teacher: '',
    teacherNip: '',
    academicYear: '',
    semester: 'Gasal',
    date: '',
    location: ''
  });
  
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('sekolah');

  // Student management
  const { data: studentsData } = useStudents();
  const { mutate: addStudentMutate } = useCreateStudent();
  const { mutate: deleteStudentMutate } = useDeleteStudent();
  const { mutate: importExcelMutate, isPending: isImporting } = useImportExcel();
  const students = studentsData || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', phase: 'Fondasi', group: 'A', height: '', weight: '', gender: 'L', nisn: '', nik: '', birthPlace: '', birthDate: '' });
  const fileInputRef = useRef(null);
  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (window.confirm(`Yakin ingin mengimpor data dari ${file.name}?`)) {
      toast.loading('Mengimpor data...', { id: 'import' });
      importExcelMutate(file, {
        onSuccess: (data) => { toast.success(`Berhasil mengimpor ${data.count} murid!`, { id: 'import' }); e.target.value = null; },
        onError: () => { toast.error('Gagal mengimpor data. Pastikan format sesuai template.', { id: 'import' }); e.target.value = null; }
      });
    } else { e.target.value = null; }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await apiClient.get('/students/import-template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Template_Import_Siswa.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch { toast.error('Gagal mengunduh template.'); }
  };

  const handleBackup = async () => {
    try {
      const response = await apiClient.get('/backup', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `raportk_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      toast.error("Gagal melakukan backup data.");
    }
  };

  useEffect(() => {
    if (schoolInfo) {
      setFormData(schoolInfo);
    }
  }, [schoolInfo]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setIsSaved(false);
  };

  const handleSave = () => {
    updateSchoolInfo(formData, {
      onSuccess: () => {
        setIsSaved(true);
        toast.success("Pengaturan berhasil disimpan");
        setTimeout(() => setIsSaved(false), 3000);
      },
      onError: () => {
        toast.error("Gagal menyimpan pengaturan");
      }
    });
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-white">Memuat data sekolah...</div>;
  }

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
          <Link className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all" to="/">
            <span className="material-symbols-outlined text-[22px]" data-icon="space_dashboard">space_dashboard</span>
            <span className="text-[15px] font-medium">Dashboard</span>
          </Link>
          <div className="flex items-center gap-4 rounded-2xl bg-white/10 px-4 py-3 text-white font-bold backdrop-blur-md border border-white/5 shadow-lg">
            <span className="material-symbols-outlined text-primary text-[22px]" data-icon="settings">settings</span>
            <span className="text-[15px]">Pengaturan</span>
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
        <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between px-4 lg:px-10 glass-panel border-b border-white/5">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-1.5 text-white bg-white/5 rounded-full backdrop-blur-md">
              <span className="material-symbols-outlined text-xl" data-icon="menu">menu</span>
            </button>
            <h2 className="text-lg font-bold text-white tracking-tight hidden sm:block">Pengaturan Sistem</h2>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-3 lg:p-10 space-y-3 lg:space-y-8 max-w-[1000px] mx-auto">
          {/* Header Action / Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 lg:gap-6 glass-card p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border-secondary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-20">
              <div className="w-32 h-32 bg-secondary rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10 flex items-center gap-3 lg:gap-4">
              <div className="w-10 h-10 lg:w-16 lg:h-16 rounded-xl lg:rounded-[1.5rem] bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white shadow-lg">
                <span className="material-symbols-outlined text-xl lg:text-3xl" data-icon="settings_applications">settings_applications</span>
              </div>
              <div>
                <h3 className="text-base lg:text-2xl font-bold text-white tracking-tight">Konfigurasi Sistem</h3>
                <p className="text-slate-400 text-xs lg:text-sm mt-0.5">Data sekolah, tahun ajaran, dan tanda tangan</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 lg:gap-4 overflow-x-auto scrollbar-hide border-b border-white/10 pb-3 lg:pb-4">
            <button 
              onClick={() => setActiveTab('sekolah')}
              className={`px-4 lg:px-6 py-2 lg:py-3 rounded-full text-xs lg:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'sekolah' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              Profil Sekolah
            </button>
            <button 
              onClick={() => setActiveTab('siswa')}
              className={`px-4 lg:px-6 py-2 lg:py-3 rounded-full text-xs lg:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'siswa' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              Data Siswa
            </button>
            <button 
              onClick={() => setActiveTab('kelas')}
              className={`px-4 lg:px-6 py-2 lg:py-3 rounded-full text-xs lg:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'kelas' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              Kelas & Guru
            </button>
            <button 
              onClick={() => setActiveTab('akun')}
              className={`px-4 lg:px-6 py-2 lg:py-3 rounded-full text-xs lg:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'akun' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              Manajemen Akun
            </button>
            <button 
              onClick={() => setActiveTab('backup')}
              className={`px-4 lg:px-6 py-2 lg:py-3 rounded-full text-xs lg:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'backup' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              Backup & Restore
            </button>
          </div>

          {activeTab === 'sekolah' && (
            <div className="glass-card rounded-2xl lg:rounded-[2rem] p-4 sm:p-6 lg:p-10 space-y-6 lg:space-y-10 relative overflow-hidden border-white/5">
              <div className="space-y-4 lg:space-y-6">
                <h4 className="text-sm lg:text-lg font-black text-white tracking-tight flex items-center gap-2 border-b border-white/10 pb-3 lg:pb-4">
                  <span className="material-symbols-outlined text-secondary" data-icon="apartment">apartment</span>
                  Data Instansi & Kelas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest pl-1">Nama TK/PAUD</label>
                    <input 
                      name="schoolName" value={formData.schoolName} onChange={handleChange} 
                      className="w-full bg-black/30 border border-white/10 rounded-xl lg:rounded-2xl px-4 py-3 lg:px-5 lg:py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest pl-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">key</span> NPSN (Kode Sekolah)
                    </label>
                    <input 
                      name="npsn" value={formData.npsn} onChange={handleChange} placeholder="Cth: 69860123"
                      className="w-full bg-black/30 border border-emerald-500/20 rounded-xl lg:rounded-2xl px-4 py-3 lg:px-5 lg:py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest pl-1">Lokasi / Kota</label>
                    <input 
                      name="location" value={formData.location} onChange={handleChange} 
                      className="w-full bg-black/30 border border-white/10 rounded-xl lg:rounded-2xl px-4 py-3 lg:px-5 lg:py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest pl-1">Tahun Ajaran</label>
                    <input 
                      name="academicYear" value={formData.academicYear} onChange={handleChange} 
                      className="w-full bg-black/30 border border-white/10 rounded-xl lg:rounded-2xl px-4 py-3 lg:px-5 lg:py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest pl-1">Semester</label>
                    <select 
                      name="semester" value={formData.semester} onChange={handleChange} 
                      className="w-full bg-black/30 border border-white/10 rounded-xl lg:rounded-2xl px-4 py-3 lg:px-5 lg:py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner appearance-none"
                    >
                      <option className="bg-slate-900" value="Gasal">1 (Gasal)</option>
                      <option className="bg-slate-900" value="Genap">2 (Genap)</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest pl-1">Tanggal Raport</label>
                    <input 
                      name="date" value={formData.date} onChange={handleChange} placeholder="Contoh: 20 Juni 2025"
                      className="w-full bg-black/30 border border-white/10 rounded-xl lg:rounded-2xl px-4 py-3 lg:px-5 lg:py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-sm lg:text-lg font-black text-white tracking-tight flex items-center gap-2 border-b border-white/10 pb-3 lg:pb-4 mt-4 lg:mt-8">
                  <span className="material-symbols-outlined text-accent" data-icon="signature">signature</span>
                  Data Tanda Tangan
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-6">
                  <div className="space-y-3 lg:space-y-4 bg-black/20 p-4 lg:p-6 rounded-2xl lg:rounded-[1.5rem] border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-slate-300">
                        <span className="material-symbols-outlined" data-icon="person_4">person_4</span>
                      </div>
                      <h5 className="font-bold text-white text-sm lg:text-lg">Kepala Sekolah</h5>
                    </div>
                    <div className="space-y-2 pt-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nama Lengkap & Gelar</label>
                      <input 
                        name="principal" value={formData.principal} onChange={handleChange} 
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-primary shadow-inner" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">NIP (Opsional)</label>
                      <input 
                        name="principalNip" value={formData.principalNip} onChange={handleChange} 
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-primary shadow-inner" 
                      />
                    </div>
                  </div>

                  <div className="space-y-3 lg:space-y-4 bg-black/20 p-4 lg:p-6 rounded-2xl lg:rounded-[1.5rem] border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-slate-300">
                        <span className="material-symbols-outlined" data-icon="person">person</span>
                      </div>
                      <h5 className="font-bold text-white text-sm lg:text-lg">Guru Kelas</h5>
                    </div>
                    <div className="space-y-2 pt-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nama Lengkap & Gelar</label>
                      <input 
                        name="teacher" value={formData.teacher} onChange={handleChange} 
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-primary shadow-inner" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">NIP (Opsional)</label>
                      <input 
                        name="teacherNip" value={formData.teacherNip} onChange={handleChange} 
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-primary shadow-inner" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 lg:pt-8 border-t border-white/10 flex items-center justify-end">
                <button 
                  onClick={handleSave} 
                  disabled={isUpdating}
                  className="w-full sm:w-auto py-3 lg:py-4 px-8 lg:px-10 rounded-xl lg:rounded-2xl text-sm lg:text-base font-bold text-white bg-gradient-to-r from-secondary to-primary hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isUpdating ? 'Menyimpan...' : isSaved ? (
                    <>
                      <span className="material-symbols-outlined" data-icon="check_circle">check_circle</span>
                      Tersimpan!
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" data-icon="save">save</span>
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'siswa' && (
            <div className="space-y-3 lg:space-y-6">
              <div className="flex flex-col sm:flex-row justify-between gap-3 bg-white/5 p-3 lg:p-4 rounded-2xl border border-white/10">
                <div className="flex gap-2 lg:gap-4 w-full md:w-auto flex-wrap">
                  <input type="file" accept=".xlsx,.xls" className="hidden" ref={fileInputRef} onChange={handleImport} />
                  <button onClick={() => fileInputRef.current?.click()} disabled={isImporting}
                    className="flex items-center gap-1.5 px-3 lg:px-5 py-2 lg:py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full text-xs lg:text-sm font-bold shadow-inner">
                    <span className="material-symbols-outlined text-base">{isImporting ? 'sync' : 'upload_file'}</span>
                    {isImporting ? 'Mengimpor...' : 'Import Excel'}
                  </button>
                  <button onClick={handleDownloadTemplate}
                    className="flex items-center gap-1.5 px-3 lg:px-5 py-2 lg:py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-full text-xs lg:text-sm font-bold">
                    <span className="material-symbols-outlined text-base">download</span>
                    Download Template
                  </button>
                  <div className="relative flex-1 md:w-64 min-w-[150px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
                    </div>
                    <input type="text" placeholder="Cari murid..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-full pl-10 pr-4 py-2 lg:py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary shadow-inner" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-6">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="glass-card rounded-2xl p-4 lg:p-5 flex flex-col gap-3 group hover:bg-white/5 transition-all relative overflow-hidden border-white/5">
                    <div className="absolute top-3 right-3 flex gap-1.5 z-20">
                      <Link to={`/print/${student.id}`} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center text-slate-300 transition-colors">
                        <span className="material-symbols-outlined text-[15px]">print</span>
                      </Link>
                      <button onClick={() => { if(window.confirm('Hapus murid ini? Data nilai akan hilang.')) { deleteStudentMutate(student.id); toast.success('Murid dihapus'); } }}
                        className="w-8 h-8 rounded-full bg-accent/10 hover:bg-accent flex items-center justify-center text-accent hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-sm lg:text-base font-black shadow-lg">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm lg:text-base font-bold text-white truncate max-w-[120px]">{student.name}</h4>
                        <p className="text-[10px] lg:text-xs text-slate-400 flex gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/5">Fase {student.phase}</span>
                          <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/5">Kelas {student.group}</span>
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-black/20 rounded-xl p-2 text-center">
                        <span className="text-[9px] text-slate-400 uppercase font-bold">Tinggi</span>
                        <span className="block font-bold text-secondary text-sm">{student.height || '--'} <span className="text-[9px] text-slate-500">cm</span></span>
                      </div>
                      <div className="bg-black/20 rounded-xl p-2 text-center">
                        <span className="text-[9px] text-slate-400 uppercase font-bold">Berat</span>
                        <span className="block font-bold text-secondary text-sm">{student.weight || '--'} <span className="text-[9px] text-slate-500">kg</span></span>
                      </div>
                    </div>
                    <Link to={`/editor/${student.id}`} className="w-full py-2 bg-white/10 hover:bg-primary text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all">
                      <span className="material-symbols-outlined text-[15px]">edit_document</span> Isi Raport
                    </Link>
                  </div>
                ))}
                {filteredStudents.length === 0 && (
                  <div className="sm:col-span-2 xl:col-span-3 py-12 flex flex-col items-center justify-center text-center glass-card rounded-2xl">
                    <span className="material-symbols-outlined text-slate-500 text-4xl mb-3">search_off</span>
                    <p className="text-sm font-bold text-white mb-1">Tidak ada murid ditemukan</p>
                    <p className="text-xs text-slate-400">Coba ubah kata kunci atau tambahkan murid baru.</p>
                  </div>
                )}
              </div>

              <button onClick={() => setShowAddModal(true)}
                className="fixed bottom-20 lg:bottom-10 right-4 lg:right-10 w-14 h-14 bg-gradient-to-r from-secondary to-primary rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all z-50 border border-white/20">
                <span className="material-symbols-outlined text-2xl">person_add</span>
              </button>
            </div>
          )}

          {activeTab === 'kelas' && (
            <div className="space-y-3 lg:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-6">
                <div className="glass-card p-4 lg:p-6 rounded-2xl border-white/5">
                  <div className="flex justify-between items-start mb-4 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-base font-black shadow-lg">A</div>
                      <div>
                        <h4 className="text-sm lg:text-base font-bold text-white">Kelompok A</h4>
                        <p className="text-[10px] lg:text-xs text-slate-400">Fase Fondasi</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs lg:text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">Wali Kelas:</span><span className="font-bold text-white">{schoolInfo?.teacher || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Jumlah Siswa:</span><span className="font-bold text-emerald-400">{students.filter(s => s.group === 'A').length} Siswa</span></div>
                  </div>
                </div>
                <div className="glass-card p-4 lg:p-6 rounded-2xl border-white/5">
                  <div className="flex justify-between items-start mb-4 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-base font-black shadow-lg">B</div>
                      <div>
                        <h4 className="text-sm lg:text-base font-bold text-white">Kelompok B</h4>
                        <p className="text-[10px] lg:text-xs text-slate-400">Fase Fondasi</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs lg:text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">Wali Kelas:</span><span className="font-bold text-white">-</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Jumlah Siswa:</span><span className="font-bold text-amber-400">{students.filter(s => s.group === 'B').length} Siswa</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'akun' && (
            <div className="glass-card rounded-2xl lg:rounded-[2rem] p-4 sm:p-6 lg:p-10 space-y-4 lg:space-y-8 relative overflow-hidden border-white/5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
                <h4 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" data-icon="manage_accounts">manage_accounts</span>
                  Kelola Akun Pengguna
                </h4>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-secondary to-primary hover:from-primary hover:to-secondary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/30 transition-all active:scale-95">
                  <span className="material-symbols-outlined text-[18px]">person_add</span> Tambah Akun
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Mock User List */}
                <div className="bg-black/20 rounded-2xl p-5 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black">
                      A
                    </div>
                    <div>
                      <h5 className="font-bold text-white text-md">Admin Sekolah</h5>
                      <p className="text-xs text-slate-400">admin@sekolah.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-white/10 text-white text-xs font-bold rounded-lg border border-white/5">Admin</span>
                  </div>
                </div>

                <div className="bg-black/20 rounded-2xl p-5 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                      G
                    </div>
                    <div>
                      <h5 className="font-bold text-white text-md">Guru Kelas A</h5>
                      <p className="text-xs text-slate-400">guru@sekolah.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-white/10 text-slate-300 text-xs font-bold rounded-lg border border-white/5">Guru</span>
                    <button className="w-8 h-8 rounded-full bg-accent/10 hover:bg-accent text-accent hover:text-white flex items-center justify-center transition-colors">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="glass-card rounded-2xl lg:rounded-[2rem] p-4 sm:p-6 lg:p-10 space-y-6 lg:space-y-10 relative overflow-hidden border-white/5">
              <div className="space-y-6">
                <h4 className="text-lg font-black text-white tracking-tight flex items-center gap-2 border-b border-white/10 pb-4">
                  <span className="material-symbols-outlined text-secondary" data-icon="cloud_download">cloud_download</span>
                  Pencadangan Data
                </h4>
                <p className="text-slate-400 text-sm">
                  Unduh seluruh data aplikasi (Profil Sekolah, Data Siswa, Nilai Raport, dan Template Narasi) dalam satu file JSON untuk keamanan data Anda.
                </p>
                <button 
                  onClick={handleBackup}
                  className="py-4 px-8 rounded-2xl font-bold text-white bg-gradient-to-r from-secondary to-primary shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                  <span className="material-symbols-outlined">download</span>
                  Download Backup Data (.json)
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-xs bg-[#151a30] border border-white/10 rounded-xl p-4 space-y-3 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white">Tambah Murid</h3>
              <button onClick={() => setShowAddModal(false)} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nama Lengkap</label>
                <input type="text" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner" placeholder="Cth: Budi Santoso" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Fase</label>
                  <select value={newStudent.phase} onChange={e => setNewStudent({...newStudent, phase: e.target.value})}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner appearance-none">
                    <option className="bg-slate-900" value="Fondasi">Fondasi</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Kelompok</label>
                  <select value={newStudent.group} onChange={e => setNewStudent({...newStudent, group: e.target.value})}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner appearance-none">
                    <option className="bg-slate-900" value="A">A</option>
                    <option className="bg-slate-900" value="B">B</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Jenis Kelamin</label>
                  <select value={newStudent.gender} onChange={e => setNewStudent({...newStudent, gender: e.target.value})}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner appearance-none">
                    <option className="bg-slate-900" value="L">Laki-laki</option>
                    <option className="bg-slate-900" value="P">Perempuan</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">NISN</label>
                  <input type="text" value={newStudent.nisn} onChange={e => setNewStudent({...newStudent, nisn: e.target.value})}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner" placeholder="Opsional" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tinggi (cm)</label>
                  <input type="number" value={newStudent.height} onChange={e => setNewStudent({...newStudent, height: e.target.value})}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner" placeholder="110" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Berat (kg)</label>
                  <input type="number" value={newStudent.weight} onChange={e => setNewStudent({...newStudent, weight: e.target.value})}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner" placeholder="20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tempat Lahir</label>
                  <input type="text" value={newStudent.birthPlace} onChange={e => setNewStudent({...newStudent, birthPlace: e.target.value})}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner" placeholder="Cth: Kolaka" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tanggal Lahir</label>
                  <input type="date" value={newStudent.birthDate} onChange={e => setNewStudent({...newStudent, birthDate: e.target.value})}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 bg-white/5 text-slate-300 rounded-lg text-xs font-bold">Batal</button>
              <button onClick={() => {
                if (!newStudent.name.trim()) return toast.error('Nama harus diisi');
                addStudentMutate({...newStudent});
                toast.success('Murid berhasil ditambahkan');
                setShowAddModal(false);
                setNewStudent({ name: '', phase: 'Fondasi', group: 'A', height: '', weight: '', gender: 'L', nisn: '', nik: '', birthPlace: '', birthDate: '' });
              }} className="flex-[2] py-2.5 bg-gradient-to-r from-secondary to-primary text-white rounded-lg text-xs font-bold active:scale-95 transition-all">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SetupSekolah;
