import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate, useSeedTemplates, useExportTemplates, useImportTemplates } from '../hooks/queries';

const CATEGORIES = [
  { id: 'Nilai Agama & Budi Pekerti', icon: 'auto_awesome', color: 'from-amber-400 to-orange-500' },
  { id: 'Jati Diri', icon: 'face', color: 'from-pink-400 to-rose-500' },
  { id: 'Dasar Literasi & STEAM', icon: 'menu_book', color: 'from-cyan-400 to-blue-500' },
  { id: 'Projek / Kokurikuler', icon: 'star', color: 'from-emerald-400 to-green-500' },
];

function TemplateManager() {
  const { data: templates, isLoading } = useTemplates();
  const { mutate: createTemplate, isPending: isCreating } = useCreateTemplate();
  const { mutate: updateTemplate, isPending: isUpdating } = useUpdateTemplate();
  const { mutate: deleteTemplate } = useDeleteTemplate();
  const { mutate: seedTemplates, isPending: isSeeding } = useSeedTemplates();
  const { mutate: exportTemplates } = useExportTemplates();
  const { mutate: importTemplates, isPending: isImporting } = useImportTemplates();
  const fileInputRef = useRef(null);

  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({ name: '', text: '', category: CATEGORIES[0].id, phase: '', groupName: '', semester: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filteredTemplates = (templates || []).filter(t => t.category === activeCategory);
  const totalCount = (templates || []).length;

  const openAddModal = () => {
    setEditingTemplate(null);
    setFormData({ name: '', text: '', category: activeCategory, phase: '', groupName: '', semester: '' });
    setShowModal(true);
  };

  const openEditModal = (template) => {
    setEditingTemplate(template);
    setFormData({ name: template.name, text: template.text, category: template.category, phase: template.phase || '', groupName: template.groupName || '', semester: template.semester || '' });
    setShowModal(true);
  };

  const handleDuplicate = (template) => {
    createTemplate({
      name: `${template.name} (Copy)`,
      text: template.text,
      category: template.category,
      phase: template.phase,
      groupName: template.groupName,
      semester: template.semester,
    });
  };

  const handleExport = () => {
    exportTemplates(undefined, {
      onSuccess: (data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `template_narasi_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const tpls = data.templates || data;
        if (!Array.isArray(tpls)) return alert('Format file tidak valid');
        importTemplates({ templates: tpls, mode: 'merge' });
      } catch { alert('Gagal membaca file JSON'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || formData.text.trim().length < 20) return;
    if (editingTemplate) {
      updateTemplate({ id: editingTemplate.id, ...formData }, { onSuccess: () => setShowModal(false) });
    } else {
      createTemplate(formData, { onSuccess: () => setShowModal(false) });
    }
  };

  const handleDelete = (id) => {
    deleteTemplate(id, { onSuccess: () => setDeleteConfirm(null) });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
          <p className="font-bold">Memuat template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans overflow-x-hidden min-h-screen text-white pb-20">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col h-screen p-4 gap-4 fixed left-0 top-0 w-72 border-r border-white/10 glass-panel z-50">
        <div className="flex flex-col gap-1 px-4 py-8">
          <img src="/logo.png" alt="Logo" className="w-12 h-12 rounded-2xl object-contain mb-4 shadow-lg" />
          <h1 className="text-2xl font-black text-white tracking-tight">CetakRaport</h1>
          <p className="text-sm text-slate-400 font-medium">TK Modern Dashboard</p>
        </div>
        <nav className="flex flex-col gap-2 mt-4">
          <Link className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all" to="/">
            <span className="material-symbols-outlined text-[22px]">space_dashboard</span>
            <span className="text-[15px] font-medium">Dashboard</span>
          </Link>
          <Link className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all" to="/setup">
            <span className="material-symbols-outlined text-[22px]">settings</span>
            <span className="text-[15px] font-medium">Pengaturan</span>
          </Link>
          <div className="flex items-center gap-4 rounded-2xl bg-white/10 px-4 py-3 text-white font-bold backdrop-blur-md border border-white/5 shadow-lg">
            <span className="material-symbols-outlined text-primary text-[22px]">description</span>
            <span className="text-[15px]">Template Narasi</span>
          </div>
          <Link className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all" to="/editor">
            <span className="material-symbols-outlined text-[22px]">edit_note</span>
            <span className="text-[15px] font-medium">Input Nilai</span>
          </Link>
          <Link className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all" to="/print">
            <span className="material-symbols-outlined text-[22px]">print</span>
            <span className="text-[15px] font-medium">Cetak Raport</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen">
        <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between px-4 lg:px-10 glass-panel border-b border-white/5">
          <h2 className="text-base lg:text-xl font-bold text-white tracking-tight hidden sm:block">Template Narasi</h2>
        </header>

        <div className="p-3 lg:p-10 space-y-3 lg:space-y-8 max-w-[1200px] mx-auto">
          {/* Hero Card */}
          <div className="glass-card rounded-2xl lg:rounded-[2rem] p-4 sm:p-5 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-3 lg:gap-6 border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 p-8 opacity-20">
              <div className="w-32 h-32 bg-secondary rounded-full blur-3xl"></div>
            </div>
            <div className="flex items-center gap-3 lg:gap-5 relative z-10">
              <div className="h-10 w-10 lg:h-16 lg:w-16 rounded-xl lg:rounded-[1.5rem] bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white shadow-lg">
                <span className="material-symbols-outlined text-xl lg:text-3xl">description</span>
              </div>
              <div>
                <h3 className="text-base lg:text-2xl font-black text-white tracking-tight">Bank Template Narasi</h3>
                <p className="text-slate-400 text-xs lg:text-sm mt-0.5">{totalCount} template tersimpan · Kurikulum Merdeka</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 relative z-10">
              {totalCount === 0 && (
                <button onClick={() => seedTemplates()} disabled={isSeeding} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-60">
                  <span className="material-symbols-outlined text-[16px]">{isSeeding ? 'sync' : 'download'}</span>
                  {isSeeding ? 'Memuat...' : 'Muat Bawaan'}
                </button>
              )}
              <button onClick={handleExport} className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/20 active:scale-95 transition-all border border-white/10">
                <span className="material-symbols-outlined text-[16px]">upload</span>Export
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/20 active:scale-95 transition-all border border-white/10 disabled:opacity-60">
                <span className="material-symbols-outlined text-[16px]">download</span>{isImporting ? 'Mengimpor...' : 'Import'}
              </button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-3 snap-x">
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.id;
              const count = (templates || []).filter(t => t.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 lg:gap-2.5 px-3 lg:px-5 py-2 lg:py-3.5 rounded-xl lg:rounded-2xl transition-all text-xs lg:text-base font-bold snap-center ${
                    isActive
                      ? `bg-gradient-to-r ${cat.color} text-white scale-105 shadow-lg`
                      : 'bg-black/20 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] lg:text-[20px]">{cat.icon}</span>
                  <span className="text-[11px] lg:text-[14px] hidden sm:inline">{cat.id}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-white/5'}`}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Template Cards */}
          {filteredTemplates.length === 0 ? (
            <div className="glass-card rounded-2xl lg:rounded-[2rem] p-6 lg:p-12 text-center border-white/5">
              <span className="material-symbols-outlined text-5xl text-slate-500 mb-4">inbox</span>
              <h4 className="text-lg font-bold text-slate-300 mb-2">Belum ada template</h4>
              <p className="text-sm text-slate-500 mb-6">Buat template narasi baru untuk kategori ini.</p>
              <button onClick={openAddModal} className="px-6 py-3 bg-gradient-to-r from-secondary to-primary text-white rounded-xl font-bold active:scale-95 transition-all shadow-lg">
                <span className="material-symbols-outlined text-[16px] align-middle mr-1">add</span>
                Buat Template Pertama
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map(t => (
                <div key={t.id} className="glass-card rounded-2xl lg:rounded-[1.5rem] p-4 lg:p-6 border-white/5 hover:border-white/15 transition-all group relative">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${CATEGORIES.find(c => c.id === t.category)?.color || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white text-[14px] shadow-sm`}>
                        <span className="material-symbols-outlined text-[16px]">{CATEGORIES.find(c => c.id === t.category)?.icon || 'description'}</span>
                      </div>
                      <h4 className="text-[15px] font-black text-white">{t.name}</h4>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditModal(t)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-primary/30 flex items-center justify-center text-slate-400 hover:text-primary transition-all" title="Edit">
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                      </button>
                      <button onClick={() => setDeleteConfirm(t.id)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-accent/30 flex items-center justify-center text-slate-400 hover:text-accent transition-all" title="Hapus">
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    </div>
                  </div>
                  {/* Body */}
                  <p className="text-[13px] text-slate-300 leading-relaxed line-clamp-4">{t.text}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t border-white/5">
                    <span className="text-[10px] text-slate-500 font-bold bg-black/30 px-2 py-1 rounded-md">{t.text.length} kar</span>
                    {t.phase && <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-2 py-1 rounded-md">{t.phase}</span>}
                    {t.groupName && <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-md">Kelas {t.groupName}</span>}
                    {t.semester && <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-1 rounded-md">{t.semester}</span>}
                    {!t.phase && !t.groupName && !t.semester && <span className="text-[10px] text-slate-500 font-bold bg-white/5 px-2 py-1 rounded-md">Semua</span>}
                  </div>

                  {/* Delete Confirmation Overlay */}
                  {deleteConfirm === t.id && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-[1.5rem] flex flex-col items-center justify-center gap-4 z-10">
                      <p className="text-sm font-bold text-white">Hapus template "{t.name}"?</p>
                      <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 bg-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/20 transition-all">Batal</button>
                        <button onClick={() => handleDelete(t.id)} className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all">Hapus</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-sm bg-[#151a30] border border-white/10 rounded-xl p-4 space-y-3 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white">
                {editingTemplate ? 'Edit Template' : 'Buat Template Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nama Template</label>
                <input
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Cth: Sangat Baik, Mulai Berkembang..."
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Kategori</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[10px] font-bold transition-all ${
                        formData.category === cat.id
                          ? `bg-gradient-to-r ${cat.color} text-white shadow-md`
                          : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>
                      {cat.id.length > 20 ? cat.id.substring(0, 18) + '...' : cat.id}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Target (Opsional)</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <select value={formData.phase} onChange={e => setFormData(prev => ({ ...prev, phase: e.target.value }))} className="bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-white text-[10px] focus:outline-none focus:ring-2 focus:ring-secondary">
                    <option value="">Semua Fase</option>
                    <option value="Fondasi">Fondasi</option>
                  </select>
                  <select value={formData.groupName} onChange={e => setFormData(prev => ({ ...prev, groupName: e.target.value }))} className="bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-white text-[10px] focus:outline-none focus:ring-2 focus:ring-secondary">
                    <option value="">Semua Kelas</option>
                    <option value="A">Kelas A</option>
                    <option value="B">Kelas B</option>
                  </select>
                  <select value={formData.semester} onChange={e => setFormData(prev => ({ ...prev, semester: e.target.value }))} className="bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-white text-[10px] focus:outline-none focus:ring-2 focus:ring-secondary">
                    <option value="">Semua Smt</option>
                    <option value="Gasal">Gasal</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Isi Narasi</label>
                  <span className="text-[9px] text-slate-500 font-bold">{formData.text.length} chr (min 20)</span>
                </div>
                <textarea
                  value={formData.text}
                  onChange={e => setFormData(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Gunakan [nama] untuk placeholder nama siswa..."
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-inner resize-none min-h-[100px] leading-relaxed"
                />
                <div className="flex flex-wrap gap-1">
                  {['[nama]'].map(ph => (
                    <button
                      key={ph}
                      onClick={() => setFormData(prev => ({ ...prev, text: prev.text + ph }))}
                      className="px-2 py-1 bg-indigo-500/15 text-indigo-300 border border-indigo-400/20 rounded-full text-[9px] font-bold hover:bg-indigo-500/30 active:scale-95 transition-all"
                    >
                      + {ph}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-white/5 text-slate-300 rounded-lg text-xs font-bold">
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.name.trim() || formData.text.trim().length < 20 || isCreating || isUpdating}
                className="flex-[2] py-2.5 bg-gradient-to-r from-secondary to-primary text-white rounded-lg text-xs font-bold active:scale-95 transition-all disabled:opacity-50"
              >
                {isCreating || isUpdating ? 'Menyimpan...' : editingTemplate ? 'Simpan' : 'Buat Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB - Buat Template */}
      <button
        onClick={openAddModal}
        className="fixed bottom-20 lg:bottom-10 right-4 lg:right-10 w-14 h-14 bg-gradient-to-r from-secondary to-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all z-50 border border-white/20"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>
    </div>
  );
}

export default TemplateManager;
