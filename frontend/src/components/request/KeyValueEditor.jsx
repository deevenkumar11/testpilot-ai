import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export function KeyValueEditor({ items, onChange, placeholderKey = 'Key', placeholderVal = 'Value', presets = [] }) {
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    onChange(updated);
  };

  const handleToggle = (index) => {
    const updated = [...items];
    updated[index].enabled = !updated[index].enabled;
    onChange(updated);
  };

  const handleAdd = () => {
    onChange([...items, { key: '', value: '', enabled: true }]);
  };

  const handleRemove = (index) => {
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
  };

  const applyPreset = (preset) => {
    // Check if key already exists
    const exists = items.some(item => item.key.toLowerCase() === preset.key.toLowerCase());
    if (exists) {
      const updated = items.map(item => 
        item.key.toLowerCase() === preset.key.toLowerCase() ? { ...item, value: preset.value, enabled: true } : item
      );
      onChange(updated);
    } else {
      // Remove any empty row first if only 1 empty row exists
      const cleaned = items.filter(item => item.key.trim() !== '' || item.value.trim() !== '');
      onChange([...cleaned, { ...preset, enabled: true }]);
    }
  };

  return (
    <div className="space-y-3">
      {presets && presets.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium mr-1">Quick Presets:</span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              className="text-[11px] px-2 py-1 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              + {p.label || p.key}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.enabled}
              onChange={() => handleToggle(index)}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-navy-950"
              title="Enable/Disable parameter"
            />
            <input
              type="text"
              value={item.key}
              onChange={(e) => handleItemChange(index, 'key', e.target.value)}
              placeholder={placeholderKey}
              className={`flex-1 px-3 py-1.5 text-xs font-mono bg-slate-900/90 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors ${
                !item.enabled ? 'opacity-50' : ''
              }`}
            />
            <input
              type="text"
              value={item.value}
              onChange={(e) => handleItemChange(index, 'value', e.target.value)}
              placeholder={placeholderVal}
              className={`flex-1 px-3 py-1.5 text-xs font-mono bg-slate-900/90 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors ${
                !item.enabled ? 'opacity-50' : ''
              }`}
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
              title="Remove row"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium py-1 px-2 rounded-lg hover:bg-indigo-950/30 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Row</span>
      </button>
    </div>
  );
}
