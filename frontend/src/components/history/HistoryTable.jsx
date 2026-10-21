import React, { useState } from 'react';
import { MethodBadge, StatusBadge, OutcomeBadge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { ExecutionDrawer } from './ExecutionDrawer';
import { Search, Trash2, Clock, Eye, AlertTriangle, RefreshCw } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useToast } from '../common/Toast';

export function HistoryTable({ historyData, onRefresh, loading }) {
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');

  // Drawer / Inspection
  const [selectedItem, setSelectedItem] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Clear Confirmation Modal
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleInspect = (item) => {
    setSelectedItem(item);
    setDrawerOpen(true);
  };

  const handleClearHistory = async () => {
    setClearing(true);
    try {
      await apiClient.clearHistory();
      addToast('Execution history cleared successfully', 'success');
      setClearModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to clear history', 'error');
    } finally {
      setClearing(false);
    }
  };

  // Filter items in memory or trigger server fetch
  const items = historyData?.items || [];
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !search.trim() ||
      item.url.toLowerCase().includes(search.toLowerCase()) ||
      (item.test_case_name && item.test_case_name.toLowerCase().includes(search.toLowerCase()));

    const matchesMethod = methodFilter === 'ALL' || item.method.toUpperCase() === methodFilter;
    const matchesOutcome = outcomeFilter === 'ALL' || item.outcome.toUpperCase() === outcomeFilter;

    return matchesSearch && matchesMethod && matchesOutcome;
  });

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-1 items-center gap-2">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by endpoint URL or test name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>

          {/* Outcome Filter */}
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Outcomes</option>
            <option value="PASS">Passed (PASS)</option>
            <option value="FAIL">Failed (FAIL)</option>
            <option value="ERROR">Errors (ERROR)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              size="sm"
              variant="outline"
              icon={RefreshCw}
              onClick={onRefresh}
              loading={loading}
              title="Refresh logs"
            >
              Refresh
            </Button>
          )}

          <Button
            size="sm"
            variant="danger"
            icon={Trash2}
            onClick={() => setClearModalOpen(true)}
            disabled={items.length === 0}
          >
            Clear History
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Endpoint / URL</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                    No execution history matching your filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-850/60 transition-colors group cursor-pointer"
                    onClick={() => handleInspect(item)}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <MethodBadge method={item.method} size="sm" />
                    </td>

                    <td className="py-3 px-4 max-w-xs md:max-w-md truncate font-sans text-slate-200">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs truncate" title={item.url}>
                          {item.url}
                        </span>
                        {item.test_case_name && (
                          <span className="text-[10px] text-slate-400 truncate">
                            Suite: {item.test_case_name}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge statusCode={item.status_code} />
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                      {item.response_time_ms ? `${item.response_time_ms.toFixed(0)} ms` : '-'}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-sans">
                      <OutcomeBadge outcome={item.outcome} />
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-sans text-[11px]">
                      {item.created_at ? new Date(item.created_at).toLocaleTimeString() : '-'}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="xs"
                        variant="ghost"
                        icon={Eye}
                        onClick={() => handleInspect(item)}
                        className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40"
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Execution Drawer Modal */}
      <ExecutionDrawer
        item={selectedItem}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Confirmation Modal to Clear History */}
      <Modal
        isOpen={clearModalOpen}
        onClose={() => setClearModalOpen(false)}
        title="Confirm Clear Execution History"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <div>
              <p className="font-semibold text-rose-200">Are you sure you want to clear all history?</p>
              <p className="mt-1 text-[11px] text-rose-300/80 leading-relaxed">
                This will permanently delete all past API request logs, latency records, and AI error analysis diagnostics. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setClearModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={clearing} onClick={handleClearHistory}>
              Yes, Clear All History
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
