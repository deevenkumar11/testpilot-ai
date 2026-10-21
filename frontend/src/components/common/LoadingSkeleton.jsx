import React from 'react';

export function LoadingSkeleton({ className = '', lines = 1 }) {
  return (
    <div className="space-y-2.5 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`bg-slate-800/80 rounded-lg ${className || 'h-4 w-full'}`}
        />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-24 bg-slate-800 rounded"></div>
        <div className="w-8 h-8 rounded-lg bg-slate-800"></div>
      </div>
      <div className="h-7 w-20 bg-slate-800 rounded mb-2"></div>
      <div className="h-3 w-32 bg-slate-800/60 rounded"></div>
    </div>
  );
}
