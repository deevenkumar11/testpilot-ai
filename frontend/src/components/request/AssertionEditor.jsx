import React from 'react';
import { Plus, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';

export function AssertionEditor({ assertions, onChange }) {
  const handleAdd = (type = 'status_code') => {
    let newItem = {
      id: Math.random().toString(36).substring(2, 7),
      type,
      target: '',
      operator: 'equals',
      expected: 200,
    };

    if (type === 'response_time') {
      newItem.operator = 'less_than';
      newItem.expected = 1000;
    } else if (type === 'json_field_exists') {
      newItem.target = 'data';
      newItem.operator = 'exists';
      newItem.expected = true;
    } else if (type === 'json_field_value') {
      newItem.target = 'status';
      newItem.operator = 'equals';
      newItem.expected = 'success';
    } else if (type === 'body_contains') {
      newItem.operator = 'contains';
      newItem.expected = 'ok';
    }

    onChange([...assertions, newItem]);
  };

  const handleUpdate = (index, field, value) => {
    const updated = [...assertions];
    updated[index][field] = value;
    onChange(updated);
  };

  const handleRemove = (index) => {
    onChange(assertions.filter((_, i) => i !== index));
  };

  const handleAddPresetSuite = () => {
    onChange([
      { id: 'p1', type: 'status_code', operator: 'equals', expected: 200 },
      { id: 'p2', type: 'response_time', operator: 'less_than', expected: 1500 },
      { id: 'p3', type: 'json_field_exists', target: 'id', operator: 'exists', expected: true },
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <span className="text-xs font-semibold text-slate-200">Response Assertions</span>
          <p className="text-[11px] text-slate-400">Validate status code, latency threshold, or JSON payload values</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddPresetSuite}
            className="text-[11px] px-2.5 py-1 rounded bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/40 transition-colors"
          >
            + Standard 200 OK + 1500ms Suite
          </button>
        </div>
      </div>

      {assertions.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
          <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">No assertions configured for this request yet.</p>
          <div className="flex justify-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => handleAdd('status_code')}
              className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
            >
              + Status Code
            </button>
            <button
              type="button"
              onClick={() => handleAdd('response_time')}
              className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
            >
              + Response Time
            </button>
            <button
              type="button"
              onClick={() => handleAdd('json_field_value')}
              className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
            >
              + JSON Value
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {assertions.map((assertion, idx) => (
            <div
              key={assertion.id || idx}
              className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800"
            >
              {/* Type Select */}
              <select
                value={assertion.type}
                onChange={(e) => handleUpdate(idx, 'type', e.target.value)}
                className="px-2.5 py-1 text-xs bg-slate-850 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="status_code">Status Code</option>
                <option value="response_time">Response Time (ms)</option>
                <option value="json_field_exists">JSON Field Exists</option>
                <option value="json_field_value">JSON Field Value</option>
                <option value="body_contains">Body Contains</option>
              </select>

              {/* Target (Path/Key) if applicable */}
              {(assertion.type === 'json_field_exists' || assertion.type === 'json_field_value') && (
                <input
                  type="text"
                  placeholder="JSON path (e.g. data.id)"
                  value={assertion.target || ''}
                  onChange={(e) => handleUpdate(idx, 'target', e.target.value)}
                  className="flex-1 min-w-[140px] px-2.5 py-1 text-xs font-mono bg-slate-850 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              )}

              {/* Operator */}
              <select
                value={assertion.operator}
                onChange={(e) => handleUpdate(idx, 'operator', e.target.value)}
                className="px-2.5 py-1 text-xs bg-slate-850 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {assertion.type === 'status_code' && (
                  <>
                    <option value="equals">Equals (==)</option>
                    <option value="not_equals">Not Equals (!=)</option>
                    <option value="less_than">Less Than (&lt;)</option>
                    <option value="greater_than">Greater Than (&gt;)</option>
                  </>
                )}
                {assertion.type === 'response_time' && (
                  <>
                    <option value="less_than">Less than or equal (&lt;=)</option>
                    <option value="greater_than">Greater than (&gt;=)</option>
                  </>
                )}
                {assertion.type === 'json_field_exists' && (
                  <>
                    <option value="exists">Exists</option>
                    <option value="not_exists">Does not exist</option>
                  </>
                )}
                {assertion.type === 'json_field_value' && (
                  <>
                    <option value="equals">Equals (==)</option>
                    <option value="not_equals">Not Equals (!=)</option>
                    <option value="contains">Contains</option>
                  </>
                )}
                {assertion.type === 'body_contains' && (
                  <>
                    <option value="contains">Contains</option>
                    <option value="not_contains">Does not contain</option>
                  </>
                )}
              </select>

              {/* Expected Value */}
              {assertion.type !== 'json_field_exists' && (
                <input
                  type="text"
                  placeholder="Expected value"
                  value={assertion.expected ?? ''}
                  onChange={(e) => handleUpdate(idx, 'expected', e.target.value)}
                  className="flex-1 min-w-[120px] px-2.5 py-1 text-xs font-mono bg-slate-850 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              )}

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors ml-auto"
                title="Remove assertion"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleAdd('status_code')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium py-1 px-2 rounded-lg hover:bg-indigo-950/30 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Status Assertion
            </button>
            <button
              type="button"
              onClick={() => handleAdd('json_field_value')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium py-1 px-2 rounded-lg hover:bg-indigo-950/30 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add JSON Assertion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
