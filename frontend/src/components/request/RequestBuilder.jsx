import React, { useState } from 'react';
import { Send, Save, Settings as SettingsIcon, Play, AlertCircle, Sparkles, Check } from 'lucide-react';
import { Button } from '../common/Button';
import { MethodBadge } from '../common/Badge';
import { KeyValueEditor } from './KeyValueEditor';
import { JsonEditor } from './JsonEditor';
import { AssertionEditor } from './AssertionEditor';
import { ResponseViewer } from './ResponseViewer';
import { Modal } from '../common/Modal';
import { apiClient } from '../../api/client';
import { useToast } from '../common/Toast';

export function RequestBuilder({ initialTestCase = null, onSavedAsTestCase }) {
  const { addToast } = useToast();

  const [method, setMethod] = useState(initialTestCase?.method || 'GET');
  const [url, setUrl] = useState(initialTestCase?.url || 'https://jsonplaceholder.typicode.com/posts/1');
  const [activeTab, setActiveTab] = useState('params');

  // Request Headers
  const [headers, setHeaders] = useState(
    initialTestCase?.headers
      ? Object.entries(initialTestCase.headers).map(([k, v]) => ({ key: k, value: v, enabled: true }))
      : [
          { key: 'Accept', value: 'application/json', enabled: true },
          { key: 'User-Agent', value: 'TestPilot-AI/1.0', enabled: true },
        ]
  );

  // Query Params
  const [params, setParams] = useState(
    initialTestCase?.params
      ? Object.entries(initialTestCase.params).map(([k, v]) => ({ key: k, value: v, enabled: true }))
      : []
  );

  // Request Body
  const [body, setBody] = useState(initialTestCase?.body || '');

  // Assertions
  const [assertions, setAssertions] = useState(
    initialTestCase?.assertions || [
      { id: '1', type: 'status_code', operator: 'equals', expected: 200 },
      { id: '2', type: 'response_time', operator: 'less_than', expected: 1500 },
    ]
  );

  // Per-request Execution Settings
  const [timeout, setTimeoutSeconds] = useState(10);
  const [verifySsl, setVerifySsl] = useState(true);

  // Execution State & Response
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  // Save Modal State
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [testCaseName, setTestCaseName] = useState(initialTestCase?.name || '');
  const [testCaseDesc, setTestCaseDesc] = useState(initialTestCase?.description || '');
  const [savingTestCase, setSavingTestCase] = useState(false);

  // Execute Request
  const handleExecute = async () => {
    if (!url.trim()) {
      addToast('Please enter a target URL', 'warning');
      return;
    }

    setLoading(true);

    // Format headers object
    const headersObj = {};
    headers.forEach((h) => {
      if (h.enabled && h.key.trim()) {
        headersObj[h.key.trim()] = h.value;
      }
    });

    // Format query params object
    const paramsObj = {};
    params.forEach((p) => {
      if (p.enabled && p.key.trim()) {
        paramsObj[p.key.trim()] = p.value;
      }
    });

    try {
      const res = await apiClient.executeRequest({
        method,
        url: url.trim(),
        headers: headersObj,
        params: paramsObj,
        body: body.trim() ? body : null,
        assertions,
        timeout: parseFloat(timeout) || 10,
        verify_ssl: verifySsl,
        save_to_history: true,
      });

      setResponse(res.data);

      if (res.data.outcome === 'PASS') {
        addToast(`Request succeeded (${res.data.status_code}) in ${res.data.response_time_ms.toFixed(0)}ms`, 'success');
      } else if (res.data.outcome === 'FAIL') {
        addToast(`Request assertions or HTTP status failed. AI diagnostics generated.`, 'warning');
      } else {
        addToast(`Execution error: ${res.data.error_message || 'Connection failed'}`, 'error');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Execution error';
      addToast(errMsg, 'error');
      setResponse({
        status_code: null,
        response_time_ms: 0,
        headers: {},
        body: null,
        outcome: 'ERROR',
        error_message: errMsg,
        assertions_result: [],
        ai_analysis: {
          summary: errMsg,
          confirmed_facts: ['Execution failed before connection completed.'],
          possible_causes: ['Backend server is unreachable or CORS blocked.'],
          suggested_fixes: ['Ensure backend server is running on port 8000.'],
          provider: 'client_fallback',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  // Quick Preset Handlers
  const loadPreset = (preset) => {
    setMethod(preset.method);
    setUrl(preset.url);
    if (preset.body) setBody(preset.body);
    if (preset.headers) {
      setHeaders(Object.entries(preset.headers).map(([k, v]) => ({ key: k, value: v, enabled: true })));
    }
    if (preset.assertions) {
      setAssertions(preset.assertions);
    }
    addToast(`Loaded preset: ${preset.name}`, 'info');
  };

  // Save as Test Case
  const handleSaveTestCase = async (e) => {
    e.preventDefault();
    if (!testCaseName.trim()) {
      addToast('Please provide a name for the test case', 'warning');
      return;
    }

    setSavingTestCase(true);

    const headersObj = {};
    headers.forEach((h) => {
      if (h.enabled && h.key.trim()) {
        headersObj[h.key.trim()] = h.value;
      }
    });

    const paramsObj = {};
    params.forEach((p) => {
      if (p.enabled && p.key.trim()) {
        paramsObj[p.key.trim()] = p.value;
      }
    });

    try {
      if (initialTestCase?.id) {
        await apiClient.updateTestCase(initialTestCase.id, {
          name: testCaseName.trim(),
          description: testCaseDesc.trim() || null,
          method,
          url: url.trim(),
          headers: headersObj,
          params: paramsObj,
          body: body.trim() ? body : null,
          assertions,
        });
        addToast('Test case updated successfully', 'success');
      } else {
        await apiClient.createTestCase({
          name: testCaseName.trim(),
          description: testCaseDesc.trim() || null,
          method,
          url: url.trim(),
          headers: headersObj,
          params: paramsObj,
          body: body.trim() ? body : null,
          assertions,
        });
        addToast('Test case saved to Automated Test Suites', 'success');
      }
      setSaveModalOpen(false);
      if (onSavedAsTestCase) onSavedAsTestCase();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to save test case', 'error');
    } finally {
      setSavingTestCase(false);
    }
  };

  const headerPresets = [
    { label: 'JSON Content-Type', key: 'Content-Type', value: 'application/json' },
    { label: 'Bearer Token', key: 'Authorization', value: 'Bearer testpilot-token' },
    { label: 'API Key', key: 'x-api-key', value: 'test-api-key-123' },
  ];

  const presets = [
    {
      name: 'Fetch Post (GET 200)',
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      body: '',
      headers: { Accept: 'application/json' },
      assertions: [
        { id: '1', type: 'status_code', operator: 'equals', expected: 200 },
        { id: '2', type: 'response_time', operator: 'less_than', expected: 1500 },
        { id: '3', type: 'json_field_exists', target: 'title', operator: 'exists', expected: true },
      ],
    },
    {
      name: 'Create Post (POST 201)',
      method: 'POST',
      url: 'https://jsonplaceholder.typicode.com/posts',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'TestPilot Demo', body: 'AI testing execution', userId: 1 }, null, 2),
      assertions: [
        { id: '1', type: 'status_code', operator: 'equals', expected: 201 },
        { id: '2', type: 'json_field_exists', target: 'id', operator: 'exists', expected: true },
      ],
    },
    {
      name: 'Demo 404 Route',
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/invalid-route-for-testing',
      body: '',
      assertions: [{ id: '1', type: 'status_code', operator: 'equals', expected: 200 }],
    },
    {
      name: 'Mock Auth Test (401)',
      method: 'GET',
      url: `${window.location.origin}/api/mock-api/auth-test`,
      headers: {},
      assertions: [{ id: '1', type: 'status_code', operator: 'equals', expected: 200 }],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Preset Endpoints Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Presets:
        </span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => loadPreset(p)}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors flex items-center gap-1.5"
          >
            <MethodBadge method={p.method} size="sm" />
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      {/* Main URL Bar and Action Buttons */}
      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          {/* Method Selector */}
          <div className="relative min-w-[120px]">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full h-11 px-3 text-xs font-bold font-mono uppercase bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none text-center"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          {/* URL Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/v1/resource"
              onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
              className="w-full h-11 px-4 text-xs font-mono bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExecute}
              loading={loading}
              icon={Send}
              variant="primary"
              className="h-11 px-5"
            >
              Send
            </Button>

            <Button
              onClick={() => {
                setTestCaseName(testCaseName || `Test: ${method} ${url.replace(/^https?:\/\//, '').slice(0, 30)}`);
                setSaveModalOpen(true);
              }}
              variant="outline"
              icon={Save}
              className="h-11 px-4"
              title="Save as automated test case"
            >
              Save
            </Button>
          </div>
        </div>

        {/* Tab Navigation for Request Config */}
        <div className="border-t border-slate-800/80 pt-3 flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('params')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'params'
                ? 'bg-slate-800 text-indigo-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            Params {params.filter((p) => p.enabled && p.key).length > 0 && `(${params.filter((p) => p.enabled && p.key).length})`}
          </button>

          <button
            onClick={() => setActiveTab('headers')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'headers'
                ? 'bg-slate-800 text-indigo-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            Headers {headers.filter((h) => h.enabled && h.key).length > 0 && `(${headers.filter((h) => h.enabled && h.key).length})`}
          </button>

          <button
            onClick={() => setActiveTab('body')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'body'
                ? 'bg-slate-800 text-indigo-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            Body {body.trim() && '•'}
          </button>

          <button
            onClick={() => setActiveTab('assertions')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'assertions'
                ? 'bg-slate-800 text-indigo-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            Assertions ({assertions.length})
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-slate-800 text-indigo-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            Settings
          </button>
        </div>

        {/* Tab Content Panes */}
        <div className="pt-2">
          {activeTab === 'params' && (
            <KeyValueEditor
              items={params}
              onChange={setParams}
              placeholderKey="Parameter Name"
              placeholderVal="Parameter Value"
            />
          )}

          {activeTab === 'headers' && (
            <KeyValueEditor
              items={headers}
              onChange={setHeaders}
              placeholderKey="Header Name"
              placeholderVal="Header Value"
              presets={headerPresets}
            />
          )}

          {activeTab === 'body' && (
            <JsonEditor
              value={body}
              onChange={setBody}
            />
          )}

          {activeTab === 'assertions' && (
            <AssertionEditor
              assertions={assertions}
              onChange={setAssertions}
            />
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200">Execution Timeout (seconds)</span>
                  <p className="text-slate-400 text-[11px]">Maximum wait time for remote server response (default 10s)</p>
                </div>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={timeout}
                  onChange={(e) => setTimeoutSeconds(e.target.value)}
                  className="w-20 px-2 py-1 text-center font-mono bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div>
                  <span className="font-semibold text-slate-200">Verify TLS / SSL Certificate</span>
                  <p className="text-slate-400 text-[11px]">Enforce strict TLS validation (recommended for production APIs)</p>
                </div>
                <input
                  type="checkbox"
                  checked={verifySsl}
                  onChange={(e) => setVerifySsl(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Response Display Section */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Live Execution Result</h3>
        <ResponseViewer response={response} loading={loading} />
      </div>

      {/* Save as Test Case Modal */}
      <Modal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title={initialTestCase ? 'Update Test Case' : 'Save as Automated Test Case'}
      >
        <form onSubmit={handleSaveTestCase} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Test Case Name *</label>
            <input
              type="text"
              required
              value={testCaseName}
              onChange={(e) => setTestCaseName(e.target.value)}
              placeholder="e.g. Verify User Authentication Endpoint"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              value={testCaseDesc}
              onChange={(e) => setTestCaseDesc(e.target.value)}
              placeholder="e.g. Asserts 200 status code, latency < 1000ms, and valid JWT token in response body"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 text-slate-400">
            <p><strong>Method:</strong> {method}</p>
            <p className="break-all"><strong>URL:</strong> {url}</p>
            <p><strong>Configured Assertions:</strong> {assertions.length}</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setSaveModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={savingTestCase} variant="primary">
              Save Test Case
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
