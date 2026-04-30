import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMarketplaceTemplates, useMyVotes, useVoteTemplate, useForkMarketplace } from '../hooks/queries';
import { toast } from 'sonner';
import { EmptyState } from '../components/Skeletons';

const CATEGORIES = [
  { id: 'all', label: 'Semua', icon: 'apps' },
  { id: 'Nilai Agama & Budi Pekerti', label: 'Agama', icon: 'auto_awesome' },
  { id: 'Jati Diri', label: 'Jati Diri', icon: 'face' },
  { id: 'Dasar Literasi & STEAM', label: 'Literasi', icon: 'menu_book' },
  { id: 'Projek / Kokurikuler', label: 'Projek', icon: 'star' },
];

const CATEGORY_COLORS = {
  'Nilai Agama & Budi Pekerti': 'from-amber-400 to-orange-500',
  'Jati Diri': 'from-pink-400 to-rose-500',
  'Dasar Literasi & STEAM': 'from-cyan-400 to-blue-500',
  'Projek / Kokurikuler': 'from-emerald-400 to-green-500',
};

function Marketplace() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const { data: templates, isLoading } = useMarketplaceTemplates();
  const { data: myVotes } = useMyVotes();
  const { mutate: voteTemplate } = useVoteTemplate();
  const { mutate: forkTemplate, isPending: isForking } = useForkMarketplace();

  const votedSet = new Set(myVotes || []);

  const filtered = (templates || []).filter(t => {
    if (activeCategory !== 'all' && t.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.text.toLowerCase().includes(q) || (t.authorName || '').toLowerCase().includes(q);
    }
    return true;
  });

  const handleVote = (templateId) => {
    voteTemplate(templateId, {
      onError: () => toast.error('Gagal memproses vote'),
    });
  };

  const handleFork = (templateId) => {
    forkTemplate(templateId, {
      onSuccess: () => toast.success('Template berhasil disalin ke koleksi Anda!'),
      onError: () => toast.error('Gagal menyalin template'),
    });
  };

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
            <span className="material-symbols-outlined text-[22px]">space_dashboard</span>
            <span className="text-[15px] font-medium">Dashboard</span>
          </Link>
          <Link className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 transition-all" to="/templates">
            <span className="material-symbols-outlined text-[22px]">description</span>
            <span className="text-[15px] font-medium">Template Saya</span>
          </Link>
          <div className="flex items-center gap-4 rounded-2xl bg-white/10 px-4 py-3 text-white font-bold backdrop-blur-md border border-white/5 shadow-lg">
            <span className="material-symbols-outlined text-primary text-[22px]">storefront</span>
            <span className="text-[15px]">Marketplace</span>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen">
        <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between px-4 lg:px-10 glass-panel border-b border-white/5">
          <h2 className="text-base lg:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">storefront</span>
            Marketplace Template
          </h2>
        </header>

        <div className="p-3 lg:p-10 space-y-4 lg:space-y-8 max-w-[1200px] mx-auto">
          {/* Hero */}
          <div className="glass-card rounded-2xl lg:rounded-[2rem] p-5 lg:p-8 border-white/5 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <h3 className="text-xl lg:text-3xl font-black text-white tracking-tight mb-2">
                🏪 Galeri Template Narasi
              </h3>
              <p className="text-slate-400 text-xs lg:text-sm max-w-lg">
                Temukan template narasi terbaik dari guru-guru PAUD/TK seluruh Indonesia. Vote template favorit Anda, atau salin langsung ke koleksi pribadi.
              </p>
            </div>
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari template, kategori, atau nama guru..."
                className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary shadow-inner placeholder-slate-500"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-secondary to-primary text-white shadow-lg'
                    : 'bg-black/20 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
              {[1,2,3,4].map(i => (
                <div key={i} className="glass-card rounded-2xl p-5 border-white/5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-32 bg-white/10 rounded" />
                      <div className="h-3 w-20 bg-white/5 rounded" />
                    </div>
                  </div>
                  <div className="h-20 bg-white/5 rounded-lg" />
                  <div className="flex gap-2">
                    <div className="h-8 w-16 bg-white/5 rounded-lg" />
                    <div className="h-8 w-16 bg-white/5 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Template Grid */}
          {!isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(t => {
                const isVoted = votedSet.has(t.id);
                const isExpanded = expandedId === t.id;
                const colorGradient = CATEGORY_COLORS[t.category] || 'from-indigo-400 to-purple-500';

                return (
                  <div key={t.id} className="glass-card rounded-2xl border-white/5 overflow-hidden hover:border-white/10 transition-all group">
                    {/* Category Ribbon */}
                    <div className={`bg-gradient-to-r ${colorGradient} px-4 py-2 flex items-center justify-between`}>
                      <span className="text-[10px] font-black text-white uppercase tracking-wider">{t.category}</span>
                      <div className="flex items-center gap-2">
                        {t.phase && <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-md font-bold text-white">{t.phase}</span>}
                        {t.semester && <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-md font-bold text-white">{t.semester}</span>}
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      {/* Title + Author */}
                      <div>
                        <h4 className="text-sm font-black text-white leading-tight">{t.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">person</span>
                          {t.authorName || 'Guru'}
                        </p>
                      </div>

                      {/* Description */}
                      {t.description && (
                        <p className="text-[11px] text-slate-300 italic">{t.description}</p>
                      )}

                      {/* Preview Text */}
                      <div
                        className="bg-black/20 rounded-xl p-3 border border-white/5 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : t.id)}
                      >
                        <p className={`text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap ${isExpanded ? '' : 'line-clamp-3'}`}>
                          {t.text}
                        </p>
                        {!isExpanded && t.text.length > 150 && (
                          <span className="text-[10px] text-primary font-bold mt-1 inline-block">Tap untuk baca selengkapnya →</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleVote(t.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 ${
                            isVoted
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-white/5 text-slate-400 border border-white/10 hover:text-rose-400 hover:bg-rose-500/10'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]" style={isVoted ? { fontVariationSettings: "'FILL' 1" } : {}}>
                            favorite
                          </span>
                          {t.voteCount || 0}
                        </button>

                        <button
                          onClick={() => handleFork(t.id)}
                          disabled={isForking}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 text-slate-400 border border-white/10 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all active:scale-95 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[14px]">content_copy</span>
                          Salin ({t.forkCount || 0})
                        </button>

                        {t.groupName && (
                          <span className="ml-auto text-[9px] bg-white/5 px-2 py-1 rounded-md text-slate-500 font-bold border border-white/5">
                            Kelas {t.groupName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && !isLoading && (
                <EmptyState
                  icon="storefront"
                  title="Belum ada template di marketplace"
                  subtitle="Jadilah yang pertama membagikan template narasi Anda ke guru lain di seluruh Indonesia!"
                  actionLabel="Kelola Template"
                  actionLink="/templates"
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Marketplace;
