import React from 'react';

/** Shimmer animation base — a single pulsing bar */
const Shimmer = ({ className = '' }) => (
  <div className={`bg-white/5 rounded-lg animate-pulse ${className}`} />
);

/** Skeleton card for student list (SetupSekolah & ReportEditor student picker) */
export const SkeletonStudentCard = () => (
  <div className="glass-card rounded-2xl p-4 lg:p-5 flex flex-col gap-3 border-white/5 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-white/10" />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-3.5 w-24" />
        <div className="flex gap-1.5">
          <Shimmer className="h-3 w-14" />
          <Shimmer className="h-3 w-14" />
        </div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <Shimmer className="h-10 rounded-xl" />
      <Shimmer className="h-10 rounded-xl" />
    </div>
    <Shimmer className="h-8 w-full rounded-lg" />
  </div>
);

/** Grid of skeleton student cards */
export const SkeletonStudentGrid = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonStudentCard key={i} />
    ))}
  </div>
);

/** Skeleton for student picker (circular avatar cards in editor/print) */
export const SkeletonStudentPicker = ({ count = 6 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 lg:gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="glass-card rounded-2xl lg:rounded-[1.5rem] p-3 lg:p-6 flex flex-col items-center gap-2 lg:gap-4 border-white/5 animate-pulse">
        <div className="w-10 h-10 lg:w-16 lg:h-16 rounded-full bg-white/10" />
        <div className="text-center space-y-2 w-full">
          <Shimmer className="h-4 w-20 mx-auto" />
          <Shimmer className="h-3 w-24 mx-auto" />
        </div>
        <Shimmer className="h-8 w-full rounded-lg mt-1" />
      </div>
    ))}
  </div>
);

/** Skeleton for the report editor (tabs + textarea area) */
export const SkeletonReportEditor = () => (
  <div className="space-y-4 lg:space-y-8 animate-pulse">
    {/* Identity card */}
    <div className="glass-card rounded-2xl lg:rounded-[2rem] p-4 sm:p-5 lg:p-8 border-white/5">
      <div className="flex items-center gap-3 lg:gap-5">
        <div className="h-12 w-12 lg:h-20 lg:w-20 rounded-xl lg:rounded-[2rem] bg-white/10" />
        <div className="flex-1 space-y-3">
          <Shimmer className="h-6 w-40" />
          <div className="flex gap-2">
            <Shimmer className="h-5 w-20 rounded-md" />
            <Shimmer className="h-5 w-20 rounded-md" />
          </div>
        </div>
      </div>
    </div>
    {/* Tab bar */}
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <Shimmer key={i} className="h-10 lg:h-12 w-28 lg:w-36 rounded-xl lg:rounded-2xl flex-shrink-0" />
      ))}
    </div>
    {/* Editor area */}
    <div className="glass-card rounded-2xl lg:rounded-[2rem] border-white/5 overflow-hidden">
      <div className="bg-white/5 px-4 lg:px-8 py-3 lg:py-5 border-b border-white/10">
        <Shimmer className="h-5 w-48" />
      </div>
      <div className="p-4 lg:p-8 space-y-4">
        <Shimmer className="h-4 w-56" />
        <div className="flex gap-2">
          <Shimmer className="h-8 w-20 rounded-full" />
          <Shimmer className="h-8 w-24 rounded-full" />
        </div>
        <Shimmer className="h-40 lg:h-60 w-full rounded-xl" />
      </div>
    </div>
  </div>
);

/** Skeleton for setup/school info form */
export const SkeletonSetupForm = () => (
  <div className="space-y-3 lg:space-y-8 animate-pulse">
    {/* Header card */}
    <div className="glass-card p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border-white/5">
      <div className="flex items-center gap-3 lg:gap-4">
        <div className="w-10 h-10 lg:w-16 lg:h-16 rounded-xl lg:rounded-[1.5rem] bg-white/10" />
        <div className="space-y-2">
          <Shimmer className="h-5 w-40" />
          <Shimmer className="h-3 w-56" />
        </div>
      </div>
    </div>
    {/* Tab bar */}
    <div className="flex gap-2 lg:gap-4 border-b border-white/10 pb-3 lg:pb-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Shimmer key={i} className="h-9 w-24 rounded-full" />
      ))}
    </div>
    {/* Form body */}
    <div className="glass-card rounded-2xl lg:rounded-[2rem] p-4 lg:p-10 border-white/5 space-y-6">
      <Shimmer className="h-5 w-32" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Shimmer className="h-12 rounded-xl" />
        <Shimmer className="h-12 rounded-xl" />
        <Shimmer className="h-12 rounded-xl md:col-span-2" />
        <Shimmer className="h-12 rounded-xl" />
        <Shimmer className="h-12 rounded-xl" />
      </div>
      <Shimmer className="h-5 w-32 mt-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-black/20 p-4 rounded-2xl space-y-3 border border-white/5">
          <Shimmer className="h-4 w-28" />
          <Shimmer className="h-10 rounded-xl" />
          <Shimmer className="h-10 rounded-xl" />
        </div>
        <div className="bg-black/20 p-4 rounded-2xl space-y-3 border border-white/5">
          <Shimmer className="h-4 w-28" />
          <Shimmer className="h-10 rounded-xl" />
          <Shimmer className="h-10 rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);

/** Empty state — used when lists have zero data */
export const EmptyState = ({ icon, title, subtitle, actionLabel, onAction, actionLink }) => (
  <div className="sm:col-span-2 xl:col-span-3 py-12 lg:py-20 flex flex-col items-center justify-center text-center glass-card rounded-2xl lg:rounded-[2rem] border-white/5">
    <div className="w-20 h-20 bg-gradient-to-br from-white/5 to-white/10 rounded-[1.5rem] flex items-center justify-center mb-5 shadow-inner">
      <span className="material-symbols-outlined text-slate-400 text-4xl">{icon}</span>
    </div>
    <h4 className="text-base lg:text-xl font-black text-white mb-1.5 tracking-tight">{title}</h4>
    <p className="text-xs lg:text-sm text-slate-400 max-w-xs mb-6">{subtitle}</p>
    {actionLabel && onAction && (
      <button onClick={onAction} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-secondary to-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
        <span className="material-symbols-outlined text-[18px]">add_circle</span>
        {actionLabel}
      </button>
    )}
    {actionLabel && actionLink && (
      <a href={actionLink} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-secondary to-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        {actionLabel}
      </a>
    )}
  </div>
);

export default Shimmer;
