import React from 'react';

export function Card({ children, className = '', glow = false, ...props }) {
  return (
    <div
      className={`bg-slate-900/80 border border-slate-800/90 rounded-xl p-5 shadow-sm transition-all duration-200 ${
        glow ? 'hover:border-slate-700/90 hover:shadow-lg hover:shadow-indigo-500/5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action, icon: Icon, className = '' }) {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h3 className="font-semibold text-slate-100 text-base">{title}</h3>
          {description && (
            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
