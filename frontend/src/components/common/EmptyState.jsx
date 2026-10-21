import React from 'react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  actionIcon,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30 ${className}`}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-indigo-950/50 border border-indigo-800/40 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-100 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {actionText && onAction && (
        <Button onClick={onAction} icon={actionIcon} variant="primary">
          {actionText}
        </Button>
      )}
    </div>
  );
}
