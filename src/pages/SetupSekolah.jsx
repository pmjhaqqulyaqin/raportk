import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSchoolInfo, useUpdateSchoolInfo } from '../hooks/queries';
import apiClient from '../lib/apiClient';

function SetupSekolah() {
  const { data: schoolInfo, isLoading } = useSchoolInfo();
  const { mutate: updateSchoolInfo, isPending: isUpdating } = useUpdateSchoolInfo();
  
  const [formData, setFormData] = useState({
    schoolName: '',
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
      alert("Gagal melakukan backup data.");
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
        setTimeout(() => setIsSaved(false), 3000);
      }
    });
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-white">Memuat data sekolah...</div>;
  }

  return (
    <div className="font-sans overflow-x-hidden min-h-screen text-white pb-32">
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
          <Link className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all" to="/">
            <span className="material-symbols-outlined text-[22px]" data-icon="space_dashboard">space_dashboard</span>
            <span className="text-[15px] font-medium">Dashboard</span>
          </Link>
          <div className="flex items-center gap-4 rounded-2xl bg-white/10 px-4 py-3 text-white font-bold backdrop-blur-md border border-white/5 shadow-lg">
            <span className="material-symbols-outlined text-primary text-[22px]" data-icon="settings">settings</span>
            <span className="text-[15px]">Pengaturan</span>
          </div>
          <Link className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all" to="/master">
            <span className="material-symbols-outlined text-[22px]" data-icon="database">database</span>
            <span className="text-[15px] font-medium">Data Master</span>
          </Link>
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
            <h2 className="text-xl font-bold text-white tracking-tight hidden sm:block">Pengaturan Sistem</h2>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 lg:p-10 space-y-8 max-w-[1000px] mx-auto">
          {/* Header Action / Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-card p-6 rounded-[2rem] border-secondary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-20">
              <div className="w-32 h-32 bg-secondary rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white shadow-lg">
                <span className="material-symbols-outlined text-3xl" data-icon="settings_applications">settings_applications</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Konfigurasi Sistem</h3>
                <p className="text-slate-400 text-sm mt-1">Data sekolah, tahun ajaran, dan tanda tangan</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-white/10 pb-4">
            <button 
              onClick={() => setActiveTab('sekolah')}
              className={`px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'sekolah' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              Profil Sekolah
            </button>
            <button 
              onClick={() => setActiveTab('akun')}
              className={`px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'akun' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              Manajemen Akun
            </button>
            <button 
              onClick={() => setActiveTab('backup')}
              className={`px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'backup' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              Backup & Restore
            </button>
          </div>

          {activeTab === 'sekolah' && (
            <div className="glass-card rounded-[2rem] p-6 sm:p-10 space-y-10 relative overflow-hidden border-white/5">
              <div className="space-y-6">
                <h4 className="text-lg font-black text-white tracking-tight flex items-center gap-2 border-b border-white/10 pb-4">
                  <span className="material-symbols-outlined text-secondary" data-icon="apartment">apartment</span>
                  Data Instansi & Kelas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest pl-1">Nama TK/PAUD</label>
                    <input 
                      name="schoolName" value={formData.schoolName} onChange={handleChange} 
                      className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner" 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest pl-1">Lokasi / Kota</label>
                    <input 
                      name="location" value={formData.location} onChange={handleChange} 
                      className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest pl-1">Tahun Ajaran</label>
                    <input 
                      name="academicYear" value={formData.academicYear} onChange={handleChange} 
                      className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest pl-1">Semester</label>
                    <select 
                      name="semester" value={formData.semester} onChange={handleChange} 
                      className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner appearance-none"
                    >
                      <option className="bg-slate-900" value="Gasal">1 (Gasal)</option>
                      <option className="bg-slate-900" value="Genap">2 (Genap)</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest pl-1">Tanggal Raport</label>
                    <input 
                      name="date" value={formData.date} onChange={handleChange} placeholder="Contoh: 20 Juni 2025"
                      className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-lg font-black text-white tracking-tight flex items-center gap-2 border-b border-white/10 pb-4 mt-8">
                  <span className="material-symbols-outlined text-accent" data-icon="signature">signature</span>
                  Data Tanda Tangan
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 bg-black/20 p-6 rounded-[1.5rem] border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-slate-300">
                        <span className="material-symbols-outlined" data-icon="person_4">person_4</span>
                      </div>
                      <h5 className="font-bold text-white text-lg">Kepala Sekolah</h5>
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

                  <div className="space-y-4 bg-black/20 p-6 rounded-[1.5rem] border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-slate-300">
                        <span className="material-symbols-outlined" data-icon="person">person</span>
                      </div>
                      <h5 className="font-bold text-white text-lg">Guru Kelas</h5>
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

              <div className="pt-8 border-t border-white/10 flex items-center justify-end">
                <button 
                  onClick={handleSave} 
                  disabled={isUpdating}
                  className="w-full sm:w-auto py-4 px-10 rounded-2xl font-bold text-white bg-gradient-to-r from-secondary to-primary hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
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

          {activeTab === 'akun' && (
            <div className="glass-card rounded-[2rem] p-6 sm:p-10 space-y-8 relative overflow-hidden border-white/5">
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
            <div className="glass-card rounded-[2rem] p-6 sm:p-10 space-y-10 relative overflow-hidden border-white/5">
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
    </div>
  );
}

export default SetupSekolah;
