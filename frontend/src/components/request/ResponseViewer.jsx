import React, { useState } from 'react';
import { StatusBadge, OutcomeBadge } from '../common/Badge';
import { AiExplanationCard } from './AiExplanationCard';
import { Clock, HardDrive, Copy, Check, Sparkles, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export function ResponseViewer({ response, loading }) {
  const [activeTab, setActiveTab] = useState('body');
  const [copied, setCopied] = useState(false);

  if (loading) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[380px] text-center">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping"></div>
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
        </div>
        <h4 className="text-sm font-semibold text-slate-200 mb-1">Sending Request...</h4>
        <p className="text-xs text-slate-400">Inspecting headers, payload, and evaluating assertions</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[380px] text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-850 border border-slate-700/60 flex items-center justify-center text-slate-500 mb-3">
          <Clock className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-300 mb-1">No Response Yet</h4>
        <p className="text-xs text-slate-400 max-w-xs">
          Enter an endpoint URL above and click <strong>Send</strong> to execute the API call and inspect the response.
        </p>
      </div>
    );
  }

  const {
    status_code,
    response_time_ms,
    headers = {},
    body,
    is_json,
    json_data,
    size_bytes,
    outcome,
    error_message,
    assertions_result = [],
    ai_analysis,
  } = response;

  const handleCopyBody = () => {
    if (!body) return;
    navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedJson = is_json && json_data ? JSON.stringify(json_data, null, 2) : body;
  const failedAssertionsCount = assertions_result.filter((a) => !a.passed).length;
  const hasErrorOrFail = outcome === 'FAIL' || outcome === 'ERROR' || (status_code && status_code >= 400);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col min-h-[420px]">
      {/* Response Metrics Header Bar */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <StatusBadge statusCode={status_code} />
          <OutcomeBadge outcome={outcome} />
          {error_message && (
            <span className="text-xs font-mono text-rose-400 truncate max-w-xs">
              {error_message}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5" title="Total response latency">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{response_time_ms ? `${response_time_ms.toFixed(0)} ms` : '0 ms'}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Response payload size">
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {size_bytes > 1024 ? `${(size_bytes / 1024).toFixed(1)} KB` : `${size_bytes} B`}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between px-4 border-b border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('body')}
            className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'body'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Response Body {is_json && <span className="text-[10px] text-slate-500 font-mono ml-1">(JSON)</span>}
          </button>

          <button
            onClick={() => setActiveTab('headers')}
            className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'headers'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Headers ({Object.keys(headers).length})
          </button>

          {assertions_result.length > 0 && (
            <button
              onClick={() => setActiveTab('assertions')}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'assertions'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Assertions ({assertions_result.length})</span>
              {failedAssertionsCount > 0 ? (
                <span className="w-4 h-4 rounded-full bg-rose-600/80 text-white text-[10px] flex items-center justify-center font-bold">
                  {failedAssertionsCount}
                </span>
              ) : (
                <span className="w-4 h-4 rounded-full bg-emerald-600/80 text-white text-[10px] flex items-center justify-center font-bold">
                  ✓
                </span>
              )}
            </button>
          )}

          {ai_analysis && (
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center gap-1 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'ai'
                  ? 'border-indigo-500 text-indigo-400'
                  : hasErrorOrFail
                  ? 'border-transparent text-indigo-400 font-semibold animate-pulse'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Analysis</span>
            </button>
          )}
        </div>

        {activeTab === 'body' && body && (
          <button
            type="button"
            onClick={handleCopyBody}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-850 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        )}
      </div>

      {/* Tab Panels */}
      <div className="p-4 flex-1 overflow-y-auto max-h-[500px]">
        {/* BODY TAB */}
        {activeTab === 'body' && (
          <div>
            {body ? (
              <pre className="font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap select-text p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                {formattedJson}
              </pre>
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs italic">
                (Empty response body)
              </div>
            )}
          </div>
        )}

        {/* HEADERS TAB */}
        {activeTab === 'headers' && (
          <div className="space-y-1.5 font-mono text-xs">
            {Object.keys(headers).length > 0 ? (
              Object.entries(headers).map(([key, val]) => (
                <div
                  key={key}
                  className="flex items-start gap-3 p-2 rounded-lg bg-slate-950/40 border border-slate-800/60"
                >
                  <span className="font-semibold text-indigo-400 min-w-[180px] break-all">{key}:</span>
                  <span className="text-slate-300 break-all">{val}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-xs italic text-center py-6">No headers available</p>
            )}
          </div>
        )}

        {/* ASSERTIONS TAB */}
        {activeTab === 'assertions' && (
          <div className="space-y-2.5">
            {assertions_result.map((res, index) => (
              <div
                key={index}
                className={`p-3 rounded-xl border flex items-start gap-3 ${
                  res.passed
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                }`}
              >
                {res.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">
                      {res.type.replace('_', ' ')}: {res.operator}
                    </span>
                    <span className={`font-bold ${res.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {res.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-200">{res.message}</p>
                  <div className="mt-1 text-[11px] font-mono text-slate-400 flex gap-4">
                    <span>Expected: {String(res.expected)}</span>
                    <span>Actual: {String(res.actual ?? 'N/A')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI ANALYSIS TAB */}
        {activeTab === 'ai' && (
          <div>
            <AiExplanationCard analysis={ai_analysis} />
          </div>
        )}
      </div>

      {/* Auto-expand AI Banner at the bottom if request failed and user is on body tab */}
      {hasErrorOrFail && ai_analysis && activeTab !== 'ai' && (
        <div className="p-3 bg-indigo-950/60 border-t border-indigo-800/40 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="truncate">
              <strong>AI Diagnostic Ready:</strong> {ai_analysis.summary}
            </span>
          </div>
          <button
            onClick={() => setActiveTab('ai')}
            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs whitespace-nowrap transition-colors"
          >
            View AI Explanation
          </button>
        </div>
      )}
    </div>
  );
}
