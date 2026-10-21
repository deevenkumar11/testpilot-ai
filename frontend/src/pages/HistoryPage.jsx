import React, { useState, useEffect } from 'react';
import { HistoryTable } from '../components/history/HistoryTable';
import { apiClient } from '../api/client';
import { useToast } from '../components/common/Toast';

export function HistoryPage() {
  const { addToast } = useToast();
  const [historyData, setHistoryData] = useState({ total: 0, page: 1, limit: 50, items: [] });
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getHistory({ limit: 100 });
      setHistoryData(res.data);
    } catch (err) {
      addToast('Failed to load execution history from backend', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          Execution History & Logs
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Audit trail of all executed HTTP requests, assertion evaluations, and AI error analysis diagnostics
        </p>
      </div>

      <HistoryTable
        historyData={historyData}
        onRefresh={fetchHistory}
        loading={loading}
      />
    </div>
  );
}
