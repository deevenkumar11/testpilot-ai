import React, { useState } from 'react';
import { Check, Copy, Wand2, AlertCircle } from 'lucide-react';

export function JsonEditor({ value, onChange, placeholder = '{\n  "key": "value"\n}' }) {
  const [copied, setCopied] = useState(false);
  const [formatError, setFormatError] = useState(null);

  const handleFormat = () => {
    if (!value || !value.trim()) return;
    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
      setFormatError(null);
    } catch (e) {
      setFormatError(e.message);
    }
  };

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium">JSON Body Payload</span>
        <div className="flex items-center gap-2">
          {formatError && (
            <span className="flex items-center gap-1 text-[11px] text-rose-400 bg-rose-950/60 border border-rose-900/50 px-2 py-0.5 rounded">
              <AlertCircle className="w-3 h-3" /> Invalid JSON
            </span>
          )}
          <button
            type="button"
            onClick={handleFormat}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
            title="Prettify and format JSON"
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Format</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setFormatError(null);
          }}
          placeholder={placeholder}
          rows={10}
          spellCheck={false}
          className="w-full p-3 font-mono text-xs bg-slate-900/90 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed resize-y selection:bg-indigo-600/30"
        />
      </div>
    </div>
  );
}
