import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { MethodBadge, StatusBadge, OutcomeBadge } from '../common/Badge';
import { CheckCircle2, XCircle, AlertCircle, Play, Clock, Sparkles } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useToast } from '../common/Toast';

export function BatchRunnerModal({ isOpen, onClose, onCompleted }) {
  const { addToast } = useToast();
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);

  const handleRunAll = async () => {
    setRunning(true);
    setReport(null);
    try {
      const res = await apiClient.runAllTestCases();
      setReport(res.data);
      if (res.data.failed === 0 && res.data.errors === 0) {
        addToast(`All ${res.data.total} test cases PASSED!`, 'success');
      } else {
        addToast(`Batch run completed: ${res.data.passed} passed, ${res.data.failed + res.data.errors} failed/errors.`, 'warning');
      }
      if (onCompleted) onCompleted();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to execute batch run', 'error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Automated Test Suite Runner"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4 text-xs">
        {!report && !running && (
          <div className="text-center py-8 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center text-indigo-400 mx-auto">
              <Play className="w-7 h-7 fill-indigo-400" />
            </div>
            <h4 className="text-base font-semibold text-slate-100">Run Full Test Suite</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Executes all automated test cases sequentially, validates status codes, response time thresholds, and JSON field assertions, and generates an integrated test report with AI diagnostics for any failures.
            </p>
            <div className="pt-2">
              <Button onClick={handleRunAll} variant="primary" size="lg" icon={Play}>
                Start Test Suite Execution
              </Button>
            </div>
          </div>
        )}

        {running && (
          <div className="text-center py-12 space-y-4">
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping"></div>
              <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
            </div>
            <h4 className="text-sm font-semibold text-slate-200">Executing Test Cases...</h4>
            <p className="text-xs text-slate-400">Please wait while assertions are evaluated</p>
          </div>
        )}

        {report && !running && (
          <div className="space-y-4">
            {/* Summary Metrics */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Tests</span>
                <p className="text-xl font-bold text-slate-100 mt-1">{report.total}</p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-center">
                <span className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Passed</span>
                <p className="text-xl font-bold text-emerald-400 mt-1">{report.passed}</p>
              </div>

              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-center">
                <span className="text-rose-400 text-[10px] uppercase font-bold tracking-wider">Failed</span>
                <p className="text-xl font-bold text-rose-400 mt-1">{report.failed}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Latency</span>
                <p className="text-xl font-bold text-cyan-400 mt-1">{report.total_time_ms.toFixed(0)} ms</p>
              </div>
            </div>

            {/* Test Case Items List */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {report.items.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                    item.result.outcome === 'PASS'
                      ? 'bg-slate-900/60 border-slate-800'
                      : 'bg-rose-950/20 border-rose-900/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.result.outcome === 'PASS' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <h5 className="font-semibold text-slate-200 text-xs truncate">
                        {item.test_case_name}
                      </h5>
                      <span className="font-mono text-[11px] text-slate-400 truncate block">
                        {item.result.status_code ? `HTTP ${item.result.status_code}` : 'Network error'} • {item.result.response_time_ms.toFixed(0)}ms
                      </span>
                    </div>
                  </div>

                  <OutcomeBadge outcome={item.result.outcome} />
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={handleRunAll} icon={Play}>
                Rerun Suite
              </Button>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
