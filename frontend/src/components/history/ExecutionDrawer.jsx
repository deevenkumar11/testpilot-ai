import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { MethodBadge, StatusBadge, OutcomeBadge } from '../common/Badge';
import { AiExplanationCard } from '../request/AiExplanationCard';
import { Clock, Copy, Check, Calendar, ArrowRight, Shield } from 'lucide-react';

export function ExecutionDrawer({ item, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('response');
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedCreated = item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Execution Details"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4 text-xs">
        {/* Top Info Bar */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MethodBadge method={item.method} />
            <span className="font-mono text-slate-200 text-xs break-all">{item.url}</span>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge statusCode={item.status_code} />
            <OutcomeBadge outcome={item.outcome} />
            <div className="flex items-center gap-1 text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{item.response_time_ms ? `${item.response_time_ms.toFixed(0)} ms` : '0 ms'}</span>
            </div>
          </div>
        </div>

        {item.test_case_name && (
          <div className="text-slate-400 text-[11px] px-1">
            Associated Test Case: <strong className="text-slate-200">{item.test_case_name}</strong>
          </div>
        )}

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('response')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'response' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Response Body
          </button>
          <button
            onClick={() => setActiveTab('request')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'request' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Request Details
          </button>
          <button
            onClick={() => setActiveTab('headers')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'headers' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Headers
          </button>
          {item.assertions_result && item.assertions_result.length > 0 && (
            <button
              onClick={() => setActiveTab('assertions')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'assertions' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Assertions ({item.assertions_result.length})
            </button>
          )}
          {item.ai_analysis && (
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'ai' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              AI Diagnosis
            </button>
          )}
        </div>

        {/* Tab Panels */}
        <div className="pt-2">
          {activeTab === 'response' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>Logged Body Payload</span>
                {item.response_body && (
                  <button
                    onClick={() => handleCopy(item.response_body)}
                    className="flex items-center gap-1 hover:text-slate-200"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
              <pre className="font-mono text-xs text-slate-300 p-3 bg-slate-950/80 border border-slate-800 rounded-xl overflow-x-auto whitespace-pre-wrap max-h-96">
                {item.response_body || '(No response body)'}
              </pre>
            </div>
          )}

          {activeTab === 'request' && (
            <div className="space-y-3 font-mono text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Request Payload:</span>
                <pre className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-300 max-h-48 overflow-y-auto">
                  {item.request_body || '(No request payload)'}
                </pre>
              </div>
              {item.request_params && Object.keys(item.request_params).length > 0 && (
                <div>
                  <span className="text-slate-400 block mb-1">Query Parameters:</span>
                  <pre className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-300">
                    {JSON.stringify(item.request_params, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'headers' && (
            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-1">Response Headers:</span>
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1 font-mono text-[11px]">
                  {item.response_headers && Object.keys(item.response_headers).length > 0 ? (
                    Object.entries(item.response_headers).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="text-indigo-400 font-semibold">{k}:</span>
                        <span className="text-slate-300 break-all">{v}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-500 italic">No response headers recorded</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assertions' && item.assertions_result && (
            <div className="space-y-2">
              {item.assertions_result.map((a, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    a.passed ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-rose-950/20 border-rose-800/40'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-slate-200 uppercase text-[10px]">
                      {a.type}: {a.operator}
                    </span>
                    <p className="text-slate-300 mt-0.5">{a.message}</p>
                  </div>
                  <OutcomeBadge outcome={a.passed ? 'PASS' : 'FAIL'} />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'ai' && (
            <AiExplanationCard analysis={item.ai_analysis} />
          )}
        </div>

        <div className="pt-4 border-t border-slate-800 text-slate-500 text-[11px] flex justify-between items-center">
          <span>Recorded At: {formattedCreated}</span>
          <span>Record ID: #{item.id}</span>
        </div>
      </div>
    </Modal>
  );
}
