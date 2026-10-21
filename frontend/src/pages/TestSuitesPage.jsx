import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckSquare, 
  Plus, 
  Play, 
  Edit3, 
  Trash2, 
  Send, 
  Search, 
  Clock, 
  AlertCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { MethodBadge } from '../components/common/Badge';
import { TestCaseModal } from '../components/testcase/TestCaseModal';
import { BatchRunnerModal } from '../components/testcase/BatchRunnerModal';
import { Modal } from '../components/common/Modal';
import { apiClient } from '../api/client';
import { useToast } from '../components/common/Toast';

export function TestSuitesPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [runningId, setRunningId] = useState(null);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [batchModalOpen, setBatchModalOpen] = useState(false);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTestCases = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getTestCases();
      setTestCases(res.data);
    } catch (err) {
      addToast('Failed to fetch test cases', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestCases();
  }, []);

  const handleRunSingle = async (id, name) => {
    setRunningId(id);
    try {
      const res = await apiClient.runTestCase(id);
      if (res.data.outcome === 'PASS') {
        addToast(`Test '${name}' PASSED in ${res.data.response_time_ms.toFixed(0)}ms`, 'success');
      } else if (res.data.outcome === 'FAIL') {
        addToast(`Test '${name}' FAILED assertions or HTTP status. AI diagnosis logged.`, 'warning');
      } else {
        addToast(`Test '${name}' error: ${res.data.error_message}`, 'error');
      }
    } catch (err) {
      addToast(`Execution failed: ${err.message}`, 'error');
    } finally {
      setRunningId(null);
    }
  };

  const handleEdit = (testCase) => {
    setSelectedTestCase(testCase);
    setModalOpen(true);
  };

  const handleOpenInBuilder = (testCase) => {
    navigate('/builder', { state: { testCase } });
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await apiClient.deleteTestCase(itemToDelete.id);
      addToast('Test case deleted successfully', 'success');
      setDeleteModalOpen(false);
      fetchTestCases();
    } catch (err) {
      addToast('Failed to delete test case', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = testCases.filter((tc) =>
    tc.name.toLowerCase().includes(search.toLowerCase()) ||
    tc.url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Automated Test Suites
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage regression tests, status assertions, and latency thresholds
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            icon={RefreshCw}
            onClick={fetchTestCases}
            loading={loading}
          >
            Refresh
          </Button>

          <Button
            size="sm"
            variant="secondary"
            icon={Play}
            onClick={() => setBatchModalOpen(true)}
            disabled={testCases.length === 0}
          >
            Run Suite ({testCases.length})
          </Button>

          <Button
            size="sm"
            variant="primary"
            icon={Plus}
            onClick={() => {
              setSelectedTestCase(null);
              setModalOpen(true);
            }}
          >
            New Test Case
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search test cases by name or endpoint..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
        />
      </div>

      {/* Test Cases Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
          <CheckSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300">No Test Cases Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Create automated test cases with expected status codes, latency thresholds, and JSON field assertions.
          </p>
          <Button
            size="sm"
            variant="primary"
            icon={Plus}
            onClick={() => {
              setSelectedTestCase(null);
              setModalOpen(true);
            }}
          >
            Create Your First Test Case
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tc) => (
            <div
              key={tc.id}
              className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 transition-all duration-200 shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <MethodBadge method={tc.method} size="sm" />
                  <span className="text-[11px] font-mono text-slate-500">ID: #{tc.id}</span>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-100 text-sm leading-snug line-clamp-1">
                    {tc.name}
                  </h4>
                  {tc.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {tc.description}
                    </p>
                  )}
                </div>

                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 font-mono text-[11px] text-slate-300 truncate">
                  {tc.url}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                  <span>Assertions: <strong className="text-slate-200">{tc.assertions?.length || 0}</strong></span>
                  <span>Headers: <strong className="text-slate-200">{Object.keys(tc.headers || {}).length}</strong></span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-800/80">
                <Button
                  size="xs"
                  variant="primary"
                  icon={Play}
                  loading={runningId === tc.id}
                  onClick={() => handleRunSingle(tc.id, tc.name)}
                >
                  Run
                </Button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenInBuilder(tc)}
                    title="Open in Request Builder"
                    className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleEdit(tc)}
                    title="Edit Test Case"
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      setItemToDelete(tc);
                      setDeleteModalOpen(true);
                    }}
                    title="Delete Test Case"
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TestCase Create/Edit Modal */}
      <TestCaseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        testCase={selectedTestCase}
        onSuccess={fetchTestCases}
      />

      {/* Batch Runner Modal */}
      <BatchRunnerModal
        isOpen={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        onCompleted={fetchTestCases}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Test Case"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs text-slate-300">
          <p>
            Are you sure you want to delete test case{' '}
            <strong className="text-slate-100">{itemToDelete?.name}</strong>?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Delete Test Case
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
