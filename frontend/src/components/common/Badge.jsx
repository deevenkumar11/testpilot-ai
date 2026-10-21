import React from 'react';

export function MethodBadge({ method = 'GET', size = 'md' }) {
  const m = method.toUpperCase();
  const sizeClasses = size === 'sm' 
    ? 'text-[10px] px-1.5 py-0.5 font-semibold' 
    : 'text-xs px-2.5 py-1 font-bold';

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
  if (m === 'GET') colorClasses = 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60';
  else if (m === 'POST') colorClasses = 'bg-indigo-950/80 text-indigo-400 border-indigo-800/60';
  else if (m === 'PUT') colorClasses = 'bg-amber-950/80 text-amber-400 border-amber-800/60';
  else if (m === 'PATCH') colorClasses = 'bg-purple-950/80 text-purple-400 border-purple-800/60';
  else if (m === 'DELETE') colorClasses = 'bg-rose-950/80 text-rose-400 border-rose-800/60';

  return (
    <span className={`inline-flex items-center font-mono rounded border uppercase tracking-wider ${sizeClasses} ${colorClasses}`}>
      {m}
    </span>
  );
}

export function StatusBadge({ statusCode }) {
  if (statusCode === null || statusCode === undefined) {
    return (
      <span className="inline-flex items-center font-mono text-xs px-2 py-0.5 rounded border bg-slate-900 text-slate-400 border-slate-700">
        ERR
      </span>
    );
  }

  let colorClasses = 'bg-slate-900 text-slate-300 border-slate-700';
  if (statusCode >= 200 && statusCode < 300) {
    colorClasses = 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60';
  } else if (statusCode >= 300 && statusCode < 400) {
    colorClasses = 'bg-cyan-950/90 text-cyan-300 border-cyan-700/60';
  } else if (statusCode >= 400 && statusCode < 500) {
    colorClasses = 'bg-amber-950/90 text-amber-300 border-amber-700/60';
  } else if (statusCode >= 500) {
    colorClasses = 'bg-rose-950/90 text-rose-300 border-rose-700/60';
  }

  return (
    <span className={`inline-flex items-center font-mono text-xs px-2.5 py-0.5 rounded font-medium border ${colorClasses}`}>
      {statusCode}
    </span>
  );
}

export function OutcomeBadge({ outcome = 'PASS' }) {
  const o = outcome.toUpperCase();
  if (o === 'PASS') {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-xs px-2.5 py-0.5 rounded-full border bg-emerald-950/80 text-emerald-400 border-emerald-700/50">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        PASS
      </span>
    );
  } else if (o === 'FAIL') {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-xs px-2.5 py-0.5 rounded-full border bg-rose-950/80 text-rose-400 border-rose-700/50">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
        FAIL
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-xs px-2.5 py-0.5 rounded-full border bg-amber-950/80 text-amber-400 border-amber-700/50">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
      ERROR
    </span>
  );
}
