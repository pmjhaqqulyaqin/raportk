import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStudents, useSchoolInfo, useTemplates, useReport, useUpdateReport, useSeedTemplates, useCreateTemplate, useGenerateNarasi } from '../hooks/queries';
import { replacePlaceholders } from '../lib/templateEngine';
import { SkeletonReportEditor, SkeletonStudentPicker, EmptyState } from '../components/Skeletons';
import { toast } from 'sonner';

const tabToDbField = {
  'Nilai Agama & Budi Pekerti': 'agama',
  'Jati Diri': 'jatiDiri',
  'Dasar Literasi & STEAM': 'literasi',
  'Projek / Kokurikuler': 'p5'
};

function ReportEditor() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('Nilai Agama & Budi Pekerti');

  const { data: studentsData, isLoading: isStudentsLoading } = useStudents();
  const students = studentsData || [];
  const student = students.find(s => s.id === id); // student.id is UUID string now

  const { data: reportData } = useReport(id);
  const { mutate: updateReportMutate } = useUpdateReport();

  const [localReport, setLocalReport] = useState({});
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const textareaRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (reportData) {
      setLocalReport(reportData);
    }
  }, [reportData]);

  // Debounced auto-save on every change
  const debouncedSave = useCallback((field, value) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus('saving');
    debounceRef.current = setTimeout(() => {
      updateReportMutate(
        { studentId: id, updateData: { [field]: value } },
        { onSuccess: () => { setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 2000); },
          onError: () => setSaveStatus('idle') }
      );
    }, 800);
  }, [id, updateReportMutate]);

  // Insert text at cursor position in textarea
  const insertAtCursor = useCallback((text) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const field = tabToDbField[activeTab];
    const current = localReport[field] || '';
    const newVal = current.substring(0, start) + text + current.substring(end);
    setLocalReport(prev => ({ ...prev, [field]: newVal }));
    debouncedSave(field, newVal);
    // Restore cursor position after React re-render
    setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + text.length; }, 0);
  }, [activeTab, localReport, debouncedSave]);

  const { data: schoolInfoData, isLoading: isSchoolLoading } = useSchoolInfo();
  const schoolInfo = schoolInfoData || {};
  const { data: templates } = useTemplates();
  const { mutate: seedTemplates, isPending: isSeeding } = useSeedTemplates();
  const { mutate: createTemplate } = useCreateTemplate();

  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiKeywords, setAiKeywords] = useState('');
  const { mutate: generateNarasi, isPending: isGenerating, data: aiResult, error: aiError } = useGenerateNarasi();

  const handleSaveAsTemplate = () => {
    const field = tabToDbField[activeTab];
    const text = localReport[field] || '';
    if (!text.trim() || !saveTemplateName.trim()) return;
    // Reverse-replace student name back to [nama]
    const templateText = student ? text.replace(new RegExp(student.name, 'g'), '[nama]') : text;
    createTemplate(
      { name: saveTemplateName, text: templateText, category: activeTab },
      { onSuccess: () => { setShowSaveAsTemplate(false); setSaveTemplateName(''); } }
    );
  };

  const applyTemplate = (templateText) => {
    if (!student) return;
    const field = tabToDbField[activeTab];
    const current = localReport[field] || '';
    const separator = current.trim() ? '\n\n' : '';
    const personalizedText = templateText.replace(/\[nama\]/g, student.name);
    const newVal = current + separator + personalizedText;
    setLocalReport(prev => ({ ...prev, [field]: newVal }));
    debouncedSave(field, newVal);
  };

  // Available placeholder chips
  const placeholderChips = [
    { label: '[nama]', value: '[nama]', icon: 'person' },
  ];

  const tabs = [
    { id: 'Nilai Agama & Budi Pekerti', icon: 'auto_awesome' },
    { id: 'Jati Diri', icon: 'face' },
    { id: 'Dasar Literasi & STEAM', icon: 'menu_book' },
    { id: 'Projek / Kokurikuler', icon: 'star' },
    { id: 'Kehadiran & Catatan', icon: 'assignment' }
  ];

  const handleContentChange = (e) => {
    e.target.style.height = 'inherit';
    e.target.style.height = `${Math.max(e.target.scrollHeight, 160)}px`;
    const field = tabToDbField[activeTab];
    const val = e.target.value;
    setLocalReport(prev => ({ ...prev, [field]: val }));
    debouncedSave(field, val);
  };

  const handleBlur = (field) => {
    updateReportMutate({ studentId: id, updateData: { [field]: localReport[field] } });
  };

  const handleAttendanceChange = (field, value) => {
    const dbField = field === 'sick' ? 'attendanceSick' : field === 'permission' ? 'attendancePermission' : 'attendanceUnexcused';
    const numValue = parseInt(value) || 0;
    setLocalReport(prev => ({ ...prev, [dbField]: numValue }));
    updateReportMutate({ studentId: id, updateData: { [dbField]: numValue } });
  };

  const handleReflectionChange = (e) => {
    e.target.style.height = 'inherit';
    e.target.style.height = `${Math.max(e.target.scrollHeight, 160)}px`;
    const val = e.target.value;
    setLocalReport(prev => ({ ...prev, parentReflection: val }));
    debouncedSave('parentReflection', val);
  };

  const AttendanceInput = ({ label, field, colorClass }) => {
    const dbField = field === 'sick' ? 'attendanceSick' : field === 'permission' ? 'attendancePermission' : 'attendanceUnexcused';
    const value = localReport[dbField] || 0;
    
    const handleIncrement = () => handleAttendanceChange(field, value + 1);
    const handleDecrement = () => { if (value > 0) handleAttendanceChange(field, value - 1); };

    return (
      <div className="space-y-2">
        <label className="block text-[14px] font-semibold text-gray-700 text-center">{label}</label>
        <div className={`flex items-center justify-between ${colorClass} rounded-xl p-2 shadow-inner`}>
          <button onClick={handleDecrement} className="w-10 h-10 rounded-lg bg-black/10 flex items-center justify-center hover:bg-black/20 active:scale-95 transition-all text-xl font-bold">
            -
          </button>
          <div className="flex flex-col items-center justify-center flex-1">
            <span className="text-[24px] font-bold leading-none">{value}</span>
            <span className="text-[10px] font-bold opacity-60 mt-1">HARI</span>
          </div>
          <button onClick={handleIncrement} className="w-10 h-10 rounded-lg bg-black/10 flex items-center justify-center hover:bg-black/20 active:scale-95 transition-all text-xl font-bold">
            +
          </button>
        </div>
      </div>
    );
  };

  if (isStudentsLoading || isSchoolLoading) {
    return (
      <div className="font-sans overflow-x-hidden min-h-screen text-white pb-20">
        <main className="lg:ml-72 min-h-screen">
          <header className="sticky top-0 z-40 flex h-14 w-full items-center px-4 lg:px-10 glass-panel border-b border-white/5">
            <div className="w-32 h-4 bg-white/10 rounded animate-pulse" />
          </header>
          <div className="p-3 lg:p-10 max-w-[1440px] mx-auto">
            <SkeletonReportEditor />
          </div>
        </main>
      </div>
    );
  }

  // Jika tidak ada ID murid yang dipilih, tampilkan halaman pilih murid
  if (!id || !student) {
    return (
      <div className="font-sans min-h-screen text-white pb-20 overflow-x-hidden flex flex-col lg:flex-row">
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
            <Link className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all" to="/setup">
              <span className="material-symbols-outlined text-[22px]" data-icon="settings">settings</span>
              <span className="text-[15px] font-medium">Pengaturan</span>
            </Link>
            <div className="flex items-center gap-4 rounded-2xl bg-white/10 px-4 py-3 text-white font-bold backdrop-blur-md border border-white/5 shadow-lg">
              <span className="material-symbols-outlined text-primary text-[22px]" data-icon="edit_note">edit_note</span>
              <span className="text-[15px]">Input Nilai</span>
            </div>
            <Link className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all" to="/print">
              <span className="material-symbols-outlined text-[22px]" data-icon="print">print</span>
              <span className="text-[15px] font-medium">Cetak Raport</span>
            </Link>
          </nav>
        </aside>

        <main className="lg:ml-72 flex-1 flex flex-col relative z-10 w-full">
          <header className="sticky top-0 z-40 flex h-14 w-full items-center px-4 lg:px-10 glass-panel border-b border-white/5">
            <h2 className="text-base lg:text-xl font-bold tracking-tight">Pilih Siswa untuk Input Nilai</h2>
          </header>
          <div className="p-3 lg:p-10 max-w-[1000px] mx-auto w-full space-y-3 lg:space-y-6 flex-1">
            <div className="glass-card rounded-2xl lg:rounded-[2rem] p-4 lg:p-8 border-primary/20 text-center mb-4 lg:mb-8">
              <h3 className="text-lg lg:text-2xl font-black text-white mb-1 lg:mb-2">Input Nilai Rapor</h3>
              <p className="text-slate-400 text-xs lg:text-sm">Pilih siswa dari daftar di bawah ini untuk mulai mengisi narasi capaian pembelajaran Kurikulum Merdeka.</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 lg:gap-6">
              {students.length > 0 ? students.map(s => (
                <Link to={`/editor/${s.id}`} key={s.id} className="glass-card rounded-2xl lg:rounded-[1.5rem] p-3 lg:p-6 flex flex-col items-center gap-2 lg:gap-4 hover:scale-105 transition-all border-white/5 hover:border-primary/50 group">
                  <div className="w-10 h-10 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-base lg:text-2xl font-black shadow-lg">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-center">
                    <h4 className="text-sm lg:text-lg font-bold text-white truncate max-w-[140px] lg:max-w-[180px]">{s.name}</h4>
                    <p className="text-[10px] lg:text-xs text-slate-400 mt-0.5">Fase {s.phase} - Kelas {s.group}</p>
                  </div>
                  <div className="w-full mt-1 lg:mt-2 py-1.5 lg:py-2 bg-white/10 rounded-lg text-center text-xs lg:text-sm font-bold group-hover:bg-primary transition-colors">
                    Pilih Siswa
                  </div>
                </Link>
              )) : (
                <EmptyState
                  icon="group_add"
                  title="Belum ada data murid"
                  subtitle="Tambahkan murid terlebih dahulu di halaman Pengaturan sebelum mengisi nilai raport."
                  actionLabel="Ke Halaman Pengaturan"
                  actionLink="/setup"
                />
              )}
            </div>
          </div>
        </main>
      </div>
    );
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
          <Link className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all" to="/setup">
            <span className="material-symbols-outlined text-[22px]" data-icon="settings">settings</span>
            <span className="text-[15px] font-medium">Pengaturan</span>
          </Link>
          <div className="flex items-center gap-4 rounded-2xl bg-white/10 px-4 py-3 text-white font-bold backdrop-blur-md border border-white/5 shadow-lg">
            <span className="material-symbols-outlined text-primary text-[22px]" data-icon="edit_note">edit_note</span>
            <span className="text-[15px]">Input Nilai</span>
          </div>
          <Link className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all" to="/print">
            <span className="material-symbols-outlined text-[22px]" data-icon="print">print</span>
            <span className="text-[15px] font-medium">Cetak Raport</span>
          </Link>
        </nav>
        <div className="mt-auto p-4 flex items-center gap-4 glass-card rounded-3xl">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-secondary to-primary flex items-center justify-center text-white font-black text-lg shadow-inner">
            {(schoolInfo?.teacher || 'G').charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-tight truncate w-32">{schoolInfo?.teacher || 'Guru Kelas'}</span>
            <span className="text-xs text-slate-400">Guru Kelas</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:ml-72 min-h-screen">
        {/* Top App Bar */}
        <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between px-4 lg:px-10 glass-panel border-b border-white/5">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5 text-white bg-white/5 rounded-full backdrop-blur-md">
              <span className="material-symbols-outlined text-xl" data-icon="menu">menu</span>
            </button>
            <h2 className="text-base lg:text-xl font-bold text-white tracking-tight hidden sm:block">Editor Raport</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full glass-card text-slate-200 text-xs font-bold tracking-wider">
              {schoolInfo?.academicYear} - {schoolInfo?.semester}
            </div>
            <button className="w-8 h-8 flex items-center justify-center text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors relative">
              <span className="material-symbols-outlined text-lg" data-icon="notifications">notifications</span>
            </button>
          </div>
        </header>

        {/* Content Canvas */}
        <div className="p-3 lg:p-10 space-y-3 lg:space-y-8 max-w-[1440px] mx-auto pb-24 lg:pb-40">
          {/* Header Actions / Identity Card */}
          <div className="glass-card rounded-2xl lg:rounded-[2rem] p-4 sm:p-5 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-3 lg:gap-6 border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 p-8 opacity-20">
              <div className="w-32 h-32 bg-primary rounded-full blur-3xl"></div>
            </div>
            <div className="flex items-center gap-3 lg:gap-5 relative z-10">
              <div className="h-12 w-12 sm:h-14 sm:w-14 lg:h-20 lg:w-20 rounded-xl sm:rounded-2xl lg:rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg sm:text-xl lg:text-3xl shadow-lg shadow-indigo-500/30">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg sm:text-xl lg:text-3xl font-black text-white tracking-tight leading-none mb-1 lg:mb-2">{student.name}</h2>
                <p className="text-xs lg:text-sm text-slate-300 font-bold flex gap-2">
                  <span className="px-2 py-0.5 lg:px-2.5 lg:py-1 rounded-md bg-white/10 border border-white/5 text-[10px] lg:text-sm">Fase {student.phase}</span>
                  <span className="px-2 py-0.5 lg:px-2.5 lg:py-1 rounded-md bg-white/10 border border-white/5 text-[10px] lg:text-sm">Kelas {student.group}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:gap-3 relative z-10">
              <Link to="/students" className="flex items-center justify-center gap-1.5 px-3 lg:px-5 py-2 lg:py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs lg:text-base font-bold transition-all backdrop-blur-md border border-white/10">
                <span className="material-symbols-outlined text-[18px]" data-icon="arrow_back">arrow_back</span>
                Kembali
              </Link>
              <Link to={`/print/${id}`} className="flex items-center justify-center gap-1.5 px-3 lg:px-5 py-2 lg:py-3 rounded-xl bg-white text-indigo-950 text-xs lg:text-base font-black hover:bg-indigo-50 transition-all active:scale-95 shadow-lg">
                <span className="material-symbols-outlined text-[18px]" data-icon="visibility">visibility</span>
                Preview Cetak
              </Link>
            </div>
          </div>

          {/* Stepper Tabs */}
          <div className="flex overflow-x-auto pb-4 pt-2 scrollbar-hide gap-3 sm:gap-4 snap-x">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 lg:gap-2.5 px-3 lg:px-6 py-2 lg:py-4 rounded-xl lg:rounded-2xl transition-all text-xs lg:text-base font-bold snap-center shadow-lg ${
                    isActive 
                      ? "bg-gradient-to-r from-secondary to-primary text-white scale-105" 
                      : "bg-black/20 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] lg:text-[20px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>{tab.icon}</span>
                  <span className="text-[11px] lg:text-[15px]">{tab.id}</span>
                </button>
              );
            })}
          </div>

          {/* Render Content Based on Active Tab */}
          {activeTab !== 'Kehadiran & Catatan' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-8 xl:gap-10 mt-2 lg:mt-4">
              <div className="xl:col-span-7 space-y-3 lg:space-y-6">
                <div className="glass-card rounded-2xl lg:rounded-[2rem] border-white/5 overflow-hidden">
                  <div className="bg-white/5 px-4 lg:px-8 py-3 lg:py-5 flex justify-between items-center border-b border-white/10">
                    <h3 className="text-sm lg:text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary">edit_document</span>
                      {activeTab}
                    </h3>
                  </div>
                  <div className="p-4 sm:p-5 lg:p-8 space-y-4 lg:space-y-6">
                    {/* Placeholder Chip Bar */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                        <span className="material-symbols-outlined text-[14px] align-middle mr-1">touch_app</span>
                        Sisipkan Placeholder (Tap untuk sisipkan di kursor)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {placeholderChips.map(chip => (
                          <button
                            key={chip.label}
                            onClick={() => insertAtCursor(chip.value)}
                            className="inline-flex items-center gap-1.5 pl-2.5 pr-3.5 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-200 border border-indigo-400/30 rounded-full text-[13px] font-bold hover:from-indigo-500/40 hover:to-purple-500/40 hover:border-indigo-400/60 hover:text-white transition-all active:scale-95 shadow-sm backdrop-blur-sm"
                          >
                            <span className="material-symbols-outlined text-[16px]">{chip.icon}</span>
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Template Narasi Chips */}
                    {(() => {
                      const catTemplates = (templates || []).filter(t => t.category === activeTab);
                      return catTemplates.length > 0 ? (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                          <span className="material-symbols-outlined text-[14px] align-middle mr-1">description</span>
                          Bank Template Narasi (Tap untuk tambahkan)
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {catTemplates.map(t => (
                            <button 
                              key={t.id} 
                              onClick={() => applyTemplate(t.text)}
                              className="group inline-flex items-center gap-2 pl-3 pr-4 py-2.5 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-200 border border-emerald-400/25 rounded-full text-[13px] font-bold hover:from-emerald-500/30 hover:to-teal-500/30 hover:border-emerald-400/50 hover:text-white transition-all active:scale-95 shadow-sm backdrop-blur-sm"
                            >
                              <span className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center text-[12px] group-hover:bg-emerald-500/50 transition-colors">+</span>
                              {t.name}
                              {t.groupName && <span className="text-[9px] bg-emerald-500/20 px-1.5 py-0.5 rounded-full ml-1">{t.groupName}</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (!templates || templates.length === 0) && (
                      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-amber-400">lightbulb</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-amber-200">Belum ada template narasi</p>
                          <p className="text-xs text-amber-300/70 mt-0.5">Muat template bawaan Kurikulum Merdeka untuk mempercepat pengisian raport.</p>
                        </div>
                        <button
                          onClick={() => seedTemplates(undefined, {
                            onSuccess: () => toast.success('Template bawaan berhasil dimuat!'),
                            onError: () => toast.error('Gagal memuat template bawaan'),
                          })}
                          disabled={isSeeding}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold hover:from-amber-600 hover:to-orange-600 active:scale-95 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-60 flex-shrink-0"
                        >
                          <span className="material-symbols-outlined text-[18px]">{isSeeding ? 'sync' : 'download'}</span>
                          {isSeeding ? 'Memuat...' : 'Muat Template'}
                        </button>
                      </div>
                    );
                    })()}
                    
                    {/* Textarea with auto-save */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-widest">Narasi Capaian Pembelajaran</label>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-500 font-bold bg-black/30 px-2 py-1 rounded-md">{localReport[tabToDbField[activeTab]]?.length || 0} Karakter</span>
                          {saveStatus === 'saving' && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-full animate-pulse">
                              <span className="material-symbols-outlined text-[12px]">sync</span>Menyimpan...
                            </span>
                          )}
                          {saveStatus === 'saved' && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full">
                              <span className="material-symbols-outlined text-[12px]">check_circle</span>Tersimpan
                            </span>
                          )}
                        </div>
                      </div>
                      <textarea 
                        ref={textareaRef}
                        className="w-full bg-black/30 border border-white/10 rounded-xl lg:rounded-[1.5rem] p-4 lg:p-6 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-black/40 transition-all resize-none min-h-[160px] lg:min-h-[250px] shadow-inner text-sm lg:text-base leading-relaxed" 
                        placeholder="Tuliskan deskripsi capaian pembelajaran anak secara detail dan suportif. Gunakan chip di atas untuk menyisipkan placeholder [nama] secara otomatis..." 
                        value={localReport[tabToDbField[activeTab]] || ''}
                        onChange={handleContentChange}
                      />
                      {/* Save as Template Button */}
                      {(localReport[tabToDbField[activeTab]] || '').length > 20 && (
                        <div className="mt-3">
                          {!showSaveAsTemplate ? (
                            <button
                              onClick={() => setShowSaveAsTemplate(true)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/5 text-slate-400 border border-white/10 rounded-xl text-[12px] font-bold hover:bg-white/10 hover:text-white transition-all active:scale-95"
                            >
                              <span className="material-symbols-outlined text-[14px]">bookmark_add</span>
                              Simpan sebagai Template
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl p-2">
                              <input
                                value={saveTemplateName}
                                onChange={e => setSaveTemplateName(e.target.value)}
                                placeholder="Nama template..."
                                className="flex-1 bg-transparent text-white text-sm px-3 py-2 focus:outline-none"
                                autoFocus
                              />
                              <button onClick={() => setShowSaveAsTemplate(false)} className="px-3 py-2 text-slate-400 text-sm font-bold hover:text-white">Batal</button>
                              <button
                                onClick={handleSaveAsTemplate}
                                disabled={!saveTemplateName.trim()}
                                className="px-4 py-2 bg-gradient-to-r from-secondary to-primary text-white rounded-lg text-sm font-bold active:scale-95 transition-all disabled:opacity-50"
                              >
                                Simpan
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* AI Generate Panel */}
                    <div className="border border-white/10 rounded-2xl overflow-hidden">
                      <button
                        onClick={() => setShowAiPanel(!showAiPanel)}
                        className="w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-violet-500/10 to-purple-500/10 hover:from-violet-500/20 hover:to-purple-500/20 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-violet-400 text-[18px]">auto_awesome</span>
                          <span className="text-sm font-bold text-violet-200">✨ Generate dengan AI (Gemini)</span>
                        </div>
                        <span className="material-symbols-outlined text-slate-400 text-[18px]">{showAiPanel ? 'expand_less' : 'expand_more'}</span>
                      </button>
                      {showAiPanel && (
                        <div className="p-5 space-y-4 bg-black/20">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Kata Kunci Perkembangan Anak</label>
                            <input
                              value={aiKeywords}
                              onChange={e => setAiKeywords(e.target.value)}
                              placeholder="Contoh: sudah bisa menghafal surat pendek, aktif bermain, mandiri..."
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-inner"
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => generateNarasi({ category: activeTab, keywords: aiKeywords, studentName: student?.name || '[nama]' })}
                              disabled={!aiKeywords.trim() || isGenerating}
                              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-violet-600 hover:to-purple-700 active:scale-95 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[16px]">{isGenerating ? 'sync' : 'auto_awesome'}</span>
                              {isGenerating ? 'Generating...' : 'Generate Narasi'}
                            </button>
                            <span className="text-[10px] text-slate-500">Powered by Gemini AI</span>
                          </div>
                          {aiError && (
                            <div className="bg-red-500/10 border border-red-400/20 rounded-xl p-3 text-sm text-red-300">
                              {aiError?.response?.data?.error || 'Gagal generate narasi'}
                            </div>
                          )}
                          {aiResult?.text && (
                            <div className="space-y-3">
                              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{aiResult.text}</p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    const field = tabToDbField[activeTab];
                                    const current = localReport[field] || '';
                                    const sep = current.trim() ? '\n\n' : '';
                                    const newVal = current + sep + aiResult.text;
                                    setLocalReport(prev => ({ ...prev, [field]: newVal }));
                                    debouncedSave(field, newVal);
                                    setShowAiPanel(false);
                                    setAiKeywords('');
                                  }}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/20 rounded-xl text-[12px] font-bold hover:bg-emerald-500/30 active:scale-95 transition-all"
                                >
                                  <span className="material-symbols-outlined text-[14px]">add</span>Tambahkan ke Narasi
                                </button>
                                <button
                                  onClick={() => {
                                    const field = tabToDbField[activeTab];
                                    setLocalReport(prev => ({ ...prev, [field]: aiResult.text }));
                                    debouncedSave(field, aiResult.text);
                                    setShowAiPanel(false);
                                    setAiKeywords('');
                                  }}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-white/5 text-slate-300 border border-white/10 rounded-xl text-[12px] font-bold hover:bg-white/10 active:scale-95 transition-all"
                                >
                                  <span className="material-symbols-outlined text-[14px]">swap_horiz</span>Ganti Seluruh Narasi
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Preview / Portal Sidebar */}
              <div className="xl:col-span-5 relative hidden xl:block">
                <div className="sticky top-28">
                  <div className="mb-4 flex items-center gap-2 text-slate-300">
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                    <span className="text-[11px] font-bold uppercase tracking-widest">Preview Cetak (Realtime)</span>
                  </div>
                  <div className="bg-white text-black w-full aspect-[1/1.414] rounded-lg p-10 overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform origin-top left-0 right-0 max-h-[70vh] overflow-y-auto print-preview-scroll">
                    <div className="border-b-2 border-double border-gray-900 pb-3 mb-5 text-center">
                      <p className="font-print-report text-xs font-bold uppercase tracking-wider">Laporan Capaian Pembelajaran</p>
                      <p className="font-print-report text-[10px]">{schoolInfo.schoolName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1 mb-5 font-print-report text-[9pt]">
                      <div className="flex justify-between"><span>Nama</span><span>:</span></div>
                      <div className="font-bold">{student.name.toUpperCase()}</div>
                      <div className="flex justify-between"><span>Kelas</span><span>:</span></div>
                      <div>{student.group}</div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-print-report text-[11pt] font-bold border-b border-gray-400 pb-1">{activeTab}</h4>
                      <p className="font-print-report text-[10pt] leading-relaxed text-justify italic text-gray-800 whitespace-pre-wrap">
                        {replacePlaceholders(localReport[tabToDbField[activeTab]], { student, schoolInfo }) || 'Belum ada narasi yang ditulis...'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Kehadiran & Catatan' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-10 mt-4">
              <div className="xl:col-span-8 space-y-8">
                {/* Attendance Section */}
                <section className="glass-card rounded-2xl lg:rounded-[2rem] p-4 lg:p-8 border-white/5">
                  <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined" data-icon="event_available">event_available</span>
                    </div>
                    <h3 className="text-base lg:text-xl font-black text-white tracking-tight">Data Kehadiran</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <AttendanceInput label="Sakit" field="sick" colorClass="bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/20" />
                    <AttendanceInput label="Izin" field="permission" colorClass="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/20" />
                    <AttendanceInput label="Tanpa Keterangan" field="unexcused" colorClass="bg-gradient-to-br from-slate-500 to-slate-700 text-white shadow-lg shadow-slate-500/20" />
                  </div>
                </section>

                {/* Parent Reflection Section */}
                <section className="glass-card rounded-2xl lg:rounded-[2rem] p-4 lg:p-8 border-white/5">
                  <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined" data-icon="family_restroom">family_restroom</span>
                    </div>
                    <h3 className="text-base lg:text-xl font-black text-white tracking-tight">Catatan Orang Tua</h3>
                  </div>
                  <textarea 
                    className="w-full bg-black/30 border border-white/10 rounded-xl lg:rounded-[1.5rem] p-4 lg:p-6 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-black/40 transition-all resize-none min-h-[120px] lg:min-h-[200px] shadow-inner text-sm lg:text-base leading-relaxed" 
                    placeholder="Tuliskan refleksi, harapan, atau tanggapan orang tua di sini..."
                    value={localReport.parentReflection || ''}
                    onChange={handleReflectionChange}
                  ></textarea>
                </section>
              </div>

              <div className="xl:col-span-4">
                <div className="glass-card rounded-[2rem] p-8 bg-gradient-to-br from-indigo-900/40 to-blue-900/40 border border-blue-500/20 shadow-inner">
                  <div className="flex flex-col gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-2">
                      <span className="material-symbols-outlined text-3xl" data-icon="tips_and_updates">tips_and_updates</span>
                    </div>
                    <h4 className="text-xl font-black text-white">Informasi Sistem</h4>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      Semua data yang Anda ketik secara otomatis disimpan di perangkat Anda. Anda tidak perlu mencari tombol simpan.
                    </p>
                    <p className="text-slate-300 text-sm leading-relaxed mt-2">
                      Pastikan untuk memeriksa kembali semua ejaan sebelum menekan tombol Cetak Raport.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Navigation Bottom */}
      <div className="fixed bottom-0 left-0 lg:left-72 right-0 p-6 z-50 pointer-events-none">
        <div className="max-w-[1440px] mx-auto flex justify-end sm:justify-between items-center pointer-events-auto">
          <div className="hidden sm:flex items-center gap-3 glass-card px-5 py-3 rounded-full border-white/10">
            {saveStatus === 'saving' ? (
              <>
                <span className="material-symbols-outlined text-[16px] text-amber-400 animate-spin">sync</span>
                <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">Menyimpan...</span>
              </>
            ) : (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Auto-Save Aktif</span>
              </>
            )}
          </div>

          <button 
            className="flex items-center gap-2 lg:gap-3 px-5 lg:px-8 py-3 lg:py-4 rounded-full bg-white text-indigo-950 font-black text-sm lg:text-base shadow-[0_10px_40px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all"
            onClick={() => {
              const currentIndex = tabs.findIndex(t => t.id === activeTab);
              if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1].id);
              else window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            {activeTab === 'Kehadiran & Catatan' ? 'Selesai & Ke Atas' : 'Lanjut Isi Berikutnya'}
            {activeTab !== 'Kehadiran & Catatan' && <span className="material-symbols-outlined text-[20px]" data-icon="arrow_forward">arrow_forward</span>}
            {activeTab === 'Kehadiran & Catatan' && <span className="material-symbols-outlined text-[20px]" data-icon="check_circle">check_circle</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportEditor;
