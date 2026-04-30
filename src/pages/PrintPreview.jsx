import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStudents, useSchoolInfo, useReport, useAllReports, useShareReport, useRevokeShare } from '../hooks/queries';
import { replacePlaceholders } from '../lib/templateEngine';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';

function PrintPreview() {
  const { id } = useParams();
  const isBatch = id === 'batch';

  const { data: studentsData, isLoading: isStudentsLoading } = useStudents();
  const students = studentsData || [];
  const student = isBatch ? null : students.find(s => s.id === id);
  
  const { data: reportData } = useReport(isBatch ? null : id);
  const singleReport = reportData || {};

  const { data: allReportsData, isLoading: isAllReportsLoading } = useAllReports();
  const allReports = allReportsData || [];

  const { data: schoolInfoData, isLoading: isSchoolLoading } = useSchoolInfo();
  const schoolInfo = schoolInfoData || {
    schoolName: 'TK PAUD',
    location: '',
    academicYear: '',
    semester: '',
    teacher: '',
    teacherNip: '',
    principal: '',
    principalNip: '',
    date: ''
  };

  const handlePrint = () => {
    window.print();
  };

  const { mutate: shareReport, isPending: isSharing } = useShareReport();
  const { mutate: revokeShare, isPending: isRevoking } = useRevokeShare();
  const [showSharePanel, setShowSharePanel] = useState(false);

  const getShareUrl = (token) => {
    const base = window.location.origin;
    return `${base}/raport/${token}`;
  };

  const handleShare = () => {
    shareReport(id, {
      onSuccess: (data) => {
        toast.success('Link raport berhasil dibuat!');
        setShowSharePanel(true);
      },
      onError: () => toast.error('Gagal membuat link berbagi'),
    });
  };

  const handleRevoke = () => {
    revokeShare(id, {
      onSuccess: () => {
        toast.success('Link berbagi telah dicabut');
        setShowSharePanel(false);
      },
      onError: () => toast.error('Gagal mencabut link'),
    });
  };

  const handleCopyLink = (token) => {
    navigator.clipboard.writeText(getShareUrl(token));
    toast.success('Link disalin ke clipboard!');
  };

  const handleExportLeger = () => {
    if (!students.length) return toast.error('Belum ada data siswa.');

    const headerRows = [
      ['LEGER PENILAIAN KURIKULUM MERDEKA'],
      [schoolInfo.schoolName || 'TK/PAUD'],
      [`Tahun Ajaran: ${schoolInfo.academicYear || '-'} | Semester: ${schoolInfo.semester || '-'}`],
      [],
    ];

    const tableHeader = [
      'No',
      'Nama Siswa',
      'Kelompok',
      'Fase',
      'L/P',
      'NISN',
      'Nilai Agama & Budi Pekerti',
      'Jati Diri',
      'Dasar Literasi & STEAM',
      'Projek / Kokurikuler',
      'Sakit',
      'Izin',
      'Tanpa Keterangan',
      'Catatan Orang Tua',
    ];

    const dataRows = students.map((s, idx) => {
      const report = allReports.find(r => r.studentId === s.id) || {};
      const ctx = { student: s, schoolInfo };
      return [
        idx + 1,
        s.name,
        `Kelas ${s.group}`,
        s.phase,
        s.gender || '-',
        s.nisn || '-',
        replacePlaceholders(report.agama, ctx) || '-',
        replacePlaceholders(report.jatiDiri, ctx) || '-',
        replacePlaceholders(report.literasi, ctx) || '-',
        replacePlaceholders(report.p5, ctx) || '-',
        report.attendanceSick || 0,
        report.attendancePermission || 0,
        report.attendanceUnexcused || 0,
        replacePlaceholders(report.parentReflection, ctx) || '-',
      ];
    });

    const wsData = [...headerRows, tableHeader, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Style column widths
    ws['!cols'] = [
      { wch: 4 },   // No
      { wch: 25 },  // Nama
      { wch: 12 },  // Kelompok
      { wch: 10 },  // Fase
      { wch: 5 },   // L/P
      { wch: 14 },  // NISN
      { wch: 40 },  // Agama
      { wch: 40 },  // Jati Diri
      { wch: 40 },  // Literasi
      { wch: 40 },  // Projek
      { wch: 8 },   // Sakit
      { wch: 8 },   // Izin
      { wch: 8 },   // Tanpa Keterangan
      { wch: 40 },  // Catatan
    ];

    // Merge header cells
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 13 } },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leger');
    XLSX.writeFile(wb, `Leger_${schoolInfo.schoolName || 'PAUD'}_${schoolInfo.academicYear || ''}_${schoolInfo.semester || ''}.xlsx`);
  };

  if (isStudentsLoading || isSchoolLoading || (isBatch && isAllReportsLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-4xl animate-spin" data-icon="sync">sync</span>
          <p className="font-bold">Memuat data...</p>
        </div>
      </div>
    );
  }

  // Jika tidak ada ID murid yang dipilih dan bukan mode batch, tampilkan halaman pilih murid
  if (!id || (!isBatch && !student)) {
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
            <Link className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all" to="/editor">
              <span className="material-symbols-outlined text-[22px]" data-icon="edit_note">edit_note</span>
              <span className="text-[15px] font-medium">Input Nilai</span>
            </Link>
            <div className="flex items-center gap-4 rounded-2xl bg-white/10 px-4 py-3 text-white font-bold backdrop-blur-md border border-white/5 shadow-lg">
              <span className="material-symbols-outlined text-primary text-[22px]" data-icon="print">print</span>
              <span className="text-[15px]">Cetak Raport</span>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="lg:ml-72 flex-1 flex flex-col relative z-10 w-full">
          <header className="sticky top-0 z-40 flex h-14 w-full items-center px-4 lg:px-10 glass-panel border-b border-white/5">
            <h2 className="text-base lg:text-xl font-bold tracking-tight">Pilih Siswa untuk Cetak Rapor</h2>
          </header>
          <div className="p-3 lg:p-10 max-w-[1000px] mx-auto w-full space-y-3 lg:space-y-6 flex-1">
            <div className="glass-card rounded-2xl lg:rounded-[2rem] p-4 lg:p-8 border-primary/20 text-center mb-3 lg:mb-8 flex flex-col items-center">
              <h3 className="text-lg lg:text-2xl font-black text-white mb-1 lg:mb-2">Cetak Rapor Kurikulum Merdeka</h3>
              <p className="text-slate-400 text-xs lg:text-sm mb-3 lg:mb-6">Pilih siswa dari daftar di bawah ini atau cetak seluruh kelas sekaligus.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/print/batch" className="flex items-center gap-2 px-5 lg:px-8 py-3 lg:py-4 text-white bg-gradient-to-r from-secondary to-primary hover:from-primary hover:to-secondary rounded-xl lg:rounded-2xl font-bold shadow-lg shadow-primary/30 transition-all active:scale-95 text-sm lg:text-lg">
                  <span className="material-symbols-outlined text-[24px]">print_connect</span>
                  Cetak Semua (Batch Print)
                </Link>
                <button onClick={handleExportLeger} className="flex items-center gap-2 px-5 lg:px-8 py-3 lg:py-4 text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-teal-600 hover:to-emerald-500 rounded-xl lg:rounded-2xl font-bold shadow-lg shadow-emerald-500/30 transition-all active:scale-95 text-sm lg:text-lg">
                  <span className="material-symbols-outlined text-[24px]">table_chart</span>
                  Cetak Leger (Excel)
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 lg:gap-6">
              {students.map(s => (
                <Link to={`/print/${s.id}`} key={s.id} className="glass-card rounded-2xl lg:rounded-[1.5rem] p-3 lg:p-6 flex flex-col items-center gap-2 lg:gap-4 hover:scale-105 transition-all border-white/5 hover:border-primary/50 group">
                  <div className="w-10 h-10 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-base lg:text-2xl font-black shadow-lg">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-center">
                    <h4 className="text-sm lg:text-lg font-bold text-white truncate max-w-[140px] lg:max-w-[180px]">{s.name}</h4>
                    <p className="text-[10px] lg:text-xs text-slate-400 mt-0.5">Fase {s.phase} - Kelas {s.group}</p>
                  </div>
                  <div className="w-full mt-1 lg:mt-2 py-1.5 lg:py-2 bg-white/10 rounded-lg text-center text-xs lg:text-sm font-bold group-hover:bg-primary transition-colors flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">print</span> Cetak
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const studentsToPrint = isBatch ? students : [student];

  return (
    <div className="font-sans overflow-x-hidden min-h-screen text-white bg-transparent print:bg-white pb-10">
      {/* Navigation Drawer (Desktop) */}
      <aside className="hidden lg:flex flex-col h-screen p-4 gap-4 fixed left-0 top-0 w-72 border-r border-white/10 glass-panel z-50 no-print">
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
          <Link className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all" to="/editor">
            <span className="material-symbols-outlined text-[22px]" data-icon="edit_note">edit_note</span>
            <span className="text-[15px] font-medium">Input Nilai</span>
          </Link>
          <div className="flex items-center gap-4 rounded-2xl bg-white/10 px-4 py-3 text-white font-bold backdrop-blur-md border border-white/5 shadow-lg">
            <span className="material-symbols-outlined text-primary text-[22px]" data-icon="print">print</span>
            <span className="text-[15px]">Cetak Raport</span>
          </div>
        </nav>
        <div className="mt-auto p-4 flex items-center gap-4 glass-card rounded-3xl">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-secondary to-primary flex items-center justify-center text-white font-black text-lg shadow-inner">
            {(schoolInfo?.teacher || 'G').charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-tight truncate w-32">{schoolInfo.teacher || 'Guru Kelas'}</span>
            <span className="text-xs text-slate-400">Guru Kelas</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:ml-72 min-h-screen flex flex-col relative z-10">
        {/* Top App Bar */}
        <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between px-4 lg:px-10 glass-panel border-b border-white/5 no-print">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5 text-white bg-white/5 rounded-full backdrop-blur-md">
              <span className="material-symbols-outlined text-xl" data-icon="menu">menu</span>
            </button>
            <h2 className="text-base lg:text-xl font-bold text-white tracking-tight hidden sm:block">Cetak Raport</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full glass-card text-slate-200 text-xs font-bold tracking-wider">
              {schoolInfo.academicYear} - {schoolInfo.semester}
            </div>
            <button className="w-8 h-8 flex items-center justify-center text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors relative">
              <span className="material-symbols-outlined text-lg" data-icon="notifications">notifications</span>
            </button>
          </div>
        </header>

        {/* Content Canvas */}
        <div className="flex-1 overflow-auto p-6 lg:p-10 no-print pb-24 lg:pb-10 w-full max-w-[1440px] mx-auto">
          <div className="space-y-4 lg:space-y-8">
            
            {/* Action Header */}
            <div className="glass-card rounded-2xl lg:rounded-[2rem] p-4 sm:p-5 lg:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-6 border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                <div className="w-32 h-32 bg-secondary rounded-full blur-3xl"></div>
              </div>
              <div className="relative z-10">
                <h2 className="text-lg lg:text-2xl font-black text-white tracking-tight mb-1 lg:mb-2 flex items-center gap-2 lg:gap-3">
                  <span className="material-symbols-outlined text-secondary text-xl lg:text-3xl">preview</span>
                  {isBatch ? 'Preview Batch: Semua Murid' : `Preview: ${student.name}`}
                </h2>
                <p className="text-slate-400 font-medium text-xs lg:text-sm">Pratinjau dokumen sebelum dicetak ke format PDF atau printer fisik.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 relative z-10">
                {!isBatch && (
                  <Link to={`/editor/${id}`} className="flex items-center gap-1.5 px-3 lg:px-5 py-2 lg:py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs lg:text-base font-bold transition-colors border border-white/10 backdrop-blur-md">
                    <span className="material-symbols-outlined text-lg" data-icon="arrow_back">arrow_back</span>
                    Edit Kembali
                  </Link>
                )}
                {!isBatch && (
                  <button onClick={singleReport?.shareToken ? () => setShowSharePanel(!showSharePanel) : handleShare} disabled={isSharing}
                    className="flex items-center gap-1.5 px-3 lg:px-5 py-2 lg:py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl text-xs lg:text-base font-bold transition-all border border-emerald-500/30 disabled:opacity-50">
                    <span className="material-symbols-outlined text-lg">qr_code_2</span>
                    {isSharing ? 'Membuat...' : singleReport?.shareToken ? 'Lihat QR' : 'Bagikan ke Ortu'}
                  </button>
                )}
                <button onClick={handlePrint} className="flex items-center gap-1.5 px-4 lg:px-6 py-2 lg:py-3 text-white bg-gradient-to-r from-secondary to-primary hover:from-primary hover:to-secondary rounded-xl text-xs lg:text-base font-bold shadow-lg shadow-primary/30 transition-all active:scale-95">
                  <span className="material-symbols-outlined text-lg" data-icon="print">print</span>
                  Cetak / Save PDF
                </button>
              </div>
            </div>

            {/* Share Panel (QR Code + Link) */}
            {showSharePanel && singleReport?.shareToken && (
              <div className="glass-card rounded-2xl p-5 lg:p-6 border-emerald-500/20 flex flex-col sm:flex-row items-center gap-5">
                <div className="bg-white p-3 rounded-2xl shadow-lg">
                  <QRCodeSVG value={getShareUrl(singleReport.shareToken)} size={140} />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="text-sm font-black text-white mb-1 flex items-center gap-2 justify-center sm:justify-start">
                    <span className="material-symbols-outlined text-emerald-400 text-[18px]">link</span>
                    Link Raport untuk Orang Tua
                  </h4>
                  <p className="text-[11px] text-slate-400 mb-3">Scan QR Code atau salin link di bawah untuk dikirim ke orang tua/wali.</p>
                  <div className="flex items-center gap-2 bg-black/30 rounded-xl p-2 border border-white/10">
                    <input readOnly value={getShareUrl(singleReport.shareToken)} className="flex-1 bg-transparent text-[11px] text-emerald-300 font-mono px-2 focus:outline-none truncate" />
                    <button onClick={() => handleCopyLink(singleReport.shareToken)} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-[11px] font-bold hover:bg-emerald-500/30 active:scale-95 transition-all">
                      Salin
                    </button>
                  </div>
                  <button onClick={handleRevoke} disabled={isRevoking}
                    className="mt-3 flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 transition-colors font-bold disabled:opacity-50">
                    <span className="material-symbols-outlined text-[14px]">link_off</span>
                    {isRevoking ? 'Mencabut...' : 'Cabut Link Berbagi'}
                  </button>
                </div>
              </div>
            )}

            {/* A4 Mockup Container */}
            <div className="flex flex-col xl:flex-row gap-10 justify-center items-start overflow-x-auto pb-12 w-full custom-scrollbar">
              
              {studentsToPrint.map((currentStudent, index) => {
                const report = isBatch 
                  ? (allReports.find(r => r.studentId === currentStudent.id) || {}) 
                  : singleReport;
                
                // Auto-replace placeholders for print
                const ctx = { student: currentStudent, schoolInfo };
                const rAgama = replacePlaceholders(report.agama, ctx);
                const rJatiDiri = replacePlaceholders(report.jatiDiri, ctx);
                const rLiterasi = replacePlaceholders(report.literasi, ctx);
                const rP5 = replacePlaceholders(report.p5, ctx);
                const rReflection = replacePlaceholders(report.parentReflection, ctx);
                return (
                  <React.Fragment key={currentStudent.id}>
                    {/* PAGE 1 (Cover) */}
              <div className="a4-page font-print-report text-black flex flex-col shrink-0 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative items-center py-20 px-16">
                <div className="absolute top-0 left-0 w-full h-full border-[12px] border-double border-black m-4 rounded-xl pointer-events-none" style={{ width: 'calc(100% - 2rem)', height: 'calc(100% - 2rem)' }}></div>
                
                <div className="text-center flex-1 flex flex-col items-center justify-center w-full z-10">
                  <h1 className="text-3xl font-black uppercase tracking-widest mb-2 text-center">LAPORAN CAPAIAN PEMBELAJARAN</h1>
                  <h2 className="text-2xl font-bold uppercase tracking-wider mb-12 text-center">PENDIDIKAN ANAK USIA DINI</h2>
                  
                  <div className="w-56 h-56 my-8 flex items-center justify-center p-4">
                    <img src="/logo.png" alt="Logo PAUD" className="w-full h-full object-contain drop-shadow-xl" />
                  </div>

                  <div className="space-y-4 w-full max-w-md mx-auto text-center mt-16">
                    <p className="text-lg font-semibold uppercase tracking-widest text-gray-600">Nama Peserta Didik</p>
                    <div className="border-b-2 border-black pb-2 mb-8">
                      <h3 className="text-3xl font-black uppercase">{currentStudent.name}</h3>
                    </div>
                    
                    <p className="text-lg font-semibold uppercase tracking-widest text-gray-600">NISN / NIK</p>
                    <div className="border-b-2 border-black pb-2">
                      <h4 className="text-2xl font-bold">{currentStudent.nisn || currentStudent.nik || '-'}</h4>
                    </div>
                  </div>
                </div>

                <div className="mt-auto text-center w-full z-10 pt-16">
                  <h3 className="text-2xl font-black uppercase tracking-wider">{schoolInfo.schoolName}</h3>
                  <p className="text-lg font-medium mt-2">{schoolInfo.location}</p>
                </div>
              </div>

              {/* PAGE 2 (Narasi Capaian Pembelajaran) */}
              <div className="a4-page font-print-report text-black flex flex-col shrink-0 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 inline-block">
                    LAPORAN CAPAIAN PEMBELAJARAN {schoolInfo.schoolName.toUpperCase()}
                  </h3>
                </div>

                {/* Student Grid */}
                <div className="grid grid-cols-2 gap-y-2 mb-8 text-[11pt] border-b border-black pb-6">
                  <div className="flex"><span className="w-32 font-semibold">Nama Siswa</span><span className="mr-2">:</span><span className="font-bold uppercase">{currentStudent.name}</span></div>
                  <div className="flex"><span className="w-32 font-semibold">Tahun Ajaran</span><span className="mr-2">:</span><span>{schoolInfo.academicYear}</span></div>
                  <div className="flex"><span className="w-32 font-semibold">Kelompok</span><span className="mr-2">:</span><span>Kelas {currentStudent.group}</span></div>
                  <div className="flex"><span className="w-32 font-semibold">Fase</span><span className="mr-2">:</span><span>{currentStudent.phase}</span></div>
                  <div className="flex"><span className="w-32 font-semibold">Semester</span><span className="mr-2">:</span><span>{schoolInfo.semester}</span></div>
                  <div className="flex"><span className="w-32 font-semibold">Tinggi / Berat</span><span className="mr-2">:</span><span>{currentStudent.height || '-'} cm / {currentStudent.weight || '-'} kg</span></div>
                </div>

                {/* Narrative Sections */}
                <div className="space-y-6 flex-1 text-[11pt]">
                  <section>
                    <h4 className="font-bold bg-gray-200 border border-black px-3 py-1 mb-3 inline-block">1. Nilai Agama dan Budi Pekerti</h4>
                    <p className="text-justify indent-8 leading-relaxed whitespace-pre-wrap">{rAgama || '-'}</p>
                  </section>

                  <section>
                    <h4 className="font-bold bg-gray-200 border border-black px-3 py-1 mb-3 inline-block">2. Jati Diri</h4>
                    <p className="text-justify indent-8 leading-relaxed whitespace-pre-wrap">{rJatiDiri || '-'}</p>
                  </section>

                  <section>
                    <h4 className="font-bold bg-gray-200 border border-black px-3 py-1 mb-3 inline-block">3. Dasar-dasar Literasi dan STEAM</h4>
                    <p className="text-justify indent-8 leading-relaxed whitespace-pre-wrap">{rLiterasi || '-'}</p>
                  </section>

                  <section>
                    <h4 className="font-bold bg-gray-200 border border-black px-3 py-1 mb-3 inline-block">4. Projek Penguatan Profil Pelajar Pancasila (P5)</h4>
                    <p className="text-justify indent-8 leading-relaxed whitespace-pre-wrap">{rP5 || '-'}</p>
                  </section>
                </div>

                <div className="mt-8 text-center text-[10pt] text-gray-500 italic border-t border-gray-300 pt-2">
                  Halaman 1
                </div>
              </div>

              {/* PAGE 3 (Absensi, Catatan & Tanda Tangan) */}
              <div className="a4-page font-print-report text-black flex flex-col shrink-0 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="mb-10">
                  <h4 className="font-bold text-lg mb-6">Penutup Laporan,</h4>
                  <p className="text-justify mb-8 text-[11pt] leading-relaxed">Laporan ini merupakan gambaran menyeluruh tentang perkembangan putra/putri Bapak/Ibu selama satu semester. Kami berharap adanya komunikasi yang berkelanjutan untuk mendukung potensi Ananda secara maksimal baik di sekolah maupun di rumah.</p>
                </div>

                {/* Reflection Box */}
                <section className="mb-10">
                  <h4 className="font-bold mb-3 uppercase tracking-wider text-[11pt] bg-gray-200 border border-black px-3 py-1 inline-block">Refleksi Orang Tua / Wali</h4>
                  <div className="border border-black p-4 min-h-[120px]">
                    {rReflection ? (
                      <p className="text-sm italic">{rReflection}</p>
                    ) : (
                      <div className="space-y-6 mt-4">
                        <div className="border-b border-dotted border-gray-400 w-full h-4"></div>
                        <div className="border-b border-dotted border-gray-400 w-full h-4"></div>
                        <div className="border-b border-dotted border-gray-400 w-full h-4"></div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Attendance Boxes */}
                <div className="mb-16">
                  <h4 className="font-bold mb-4 uppercase tracking-wider text-[11pt] bg-gray-200 border border-black px-3 py-1 inline-block">Ketidakhadiran</h4>
                  <div className="grid grid-cols-3 gap-6 mt-2">
                    <div className="border border-black bg-white p-4 text-center">
                      <span className="block text-xs font-bold text-black uppercase mb-2">Sakit</span>
                      <span className="text-3xl font-black text-black">{report.attendanceSick || 0}</span>
                      <span className="block text-[10pt] text-black mt-1">Hari</span>
                    </div>
                    <div className="border border-black bg-white p-4 text-center">
                      <span className="block text-xs font-bold text-black uppercase mb-2">Izin</span>
                      <span className="text-3xl font-black text-black">{report.attendancePermission || 0}</span>
                      <span className="block text-[10pt] text-black mt-1">Hari</span>
                    </div>
                    <div className="border border-black bg-white p-4 text-center">
                      <span className="block text-xs font-bold text-black uppercase mb-2">Tanpa Keterangan</span>
                      <span className="text-3xl font-black text-black">{report.attendanceUnexcused || 0}</span>
                      <span className="block text-[10pt] text-black mt-1">Hari</span>
                    </div>
                  </div>
                </div>

                {/* Signature Area */}
                <div className="mt-auto grid grid-cols-2 gap-12 text-center text-[11pt]">
                  <div className="space-y-24">
                    <div>
                      <p className="mb-1">Mengetahui,</p>
                      <p className="font-bold">Orang Tua / Wali Siswa</p>
                    </div>
                    <div className="w-48 mx-auto border-b border-black"></div>
                  </div>
                  
                  <div className="space-y-24">
                    <div>
                      <p className="mb-1">{schoolInfo.location}, {schoolInfo.date || '.................'}</p>
                      <p className="font-bold">Wali Kelas {currentStudent.group}</p>
                    </div>
                    <div>
                      <p className="font-bold underline italic">{schoolInfo.teacher || '..........................'}</p>
                      {schoolInfo.teacherNip && <p className="text-xs">NIP. {schoolInfo.teacherNip}</p>}
                    </div>
                  </div>

                  <div className="col-span-2 mt-12 space-y-24">
                    <div>
                      <p className="mb-1">Mengesahkan,</p>
                      <p className="font-bold uppercase">Kepala {schoolInfo.schoolName}</p>
                    </div>
                    <div>
                      <p className="font-bold underline italic">{schoolInfo.principal || '..........................'}</p>
                      {schoolInfo.principalNip && <p className="text-xs">NIP. {schoolInfo.principalNip}</p>}
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-center text-[10pt] text-gray-500 italic border-t border-gray-300 pt-2 flex items-center justify-between">
                  <span>Halaman 2</span>
                  {(() => {
                    const token = isBatch
                      ? (allReports.find(r => r.studentId === currentStudent.id) || {}).shareToken
                      : singleReport?.shareToken;
                    if (!token) return null;
                    return (
                      <div className="flex items-center gap-2 not-italic text-[8pt]">
                        <QRCodeSVG value={getShareUrl(token)} size={48} />
                        <span className="text-gray-500">Scan untuk<br/>lihat online</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
                  </React.Fragment>
                );
              })}
              
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PrintPreview;
