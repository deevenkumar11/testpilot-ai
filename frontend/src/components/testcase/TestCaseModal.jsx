import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { KeyValueEditor } from '../request/KeyValueEditor';
import { JsonEditor } from '../request/JsonEditor';
import { AssertionEditor } from '../request/AssertionEditor';
import { apiClient } from '../../api/client';
import { useToast } from '../common/Toast';

export function TestCaseModal({ isOpen, onClose, testCase = null, onSuccess }) {
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [activeTab, setActiveTab] = useState('assertions');

  const [headers, setHeaders] = useState([]);
  const [params, setParams] = useState([]);
  const [body, setBody] = useState('');
  const [assertions, setAssertions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (testCase) {
      setName(testCase.name || '');
      setDescription(testCase.description || '');
      setMethod(testCase.method || 'GET');
      setUrl(testCase.url || '');
      setHeaders(
        testCase.headers
          ? Object.entries(testCase.headers).map(([k, v]) => ({ key: k, value: v, enabled: true }))
          : []
      );
      setParams(
        testCase.params
          ? Object.entries(testCase.params).map(([k, v]) => ({ key: k, value: v, enabled: true }))
          : []
      );
      setBody(testCase.body || '');
      setAssertions(testCase.assertions || []);
    } else {
      setName('');
      setDescription('');
      setMethod('GET');
      setUrl('https://jsonplaceholder.typicode.com/posts/1');
      setHeaders([{ key: 'Accept', value: 'application/json', enabled: true }]);
      setParams([]);
      setBody('');
      setAssertions([
        { id: '1', type: 'status_code', operator: 'equals', expected: 200 },
        { id: '2', type: 'response_time', operator: 'less_than', expected: 1500 },
      ]);
    }
  }, [testCase, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Please enter a test case name', 'warning');
      return;
    }
    if (!url.trim()) {
      addToast('Please enter a target URL', 'warning');
      return;
    }

    setLoading(true);

    const headersObj = {};
    headers.forEach((h) => {
      if (h.enabled && h.key.trim()) headersObj[h.key.trim()] = h.value;
    });

    const paramsObj = {};
    params.forEach((p) => {
      if (p.enabled && p.key.trim()) paramsObj[p.key.trim()] = p.value;
    });

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      method: method.toUpperCase(),
      url: url.trim(),
      headers: headersObj,
      params: paramsObj,
      body: body.trim() ? body : null,
      assertions,
    };

    try {
      if (testCase?.id) {
        await apiClient.updateTestCase(testCase.id, payload);
        addToast('Test case updated successfully', 'success');
      } else {
        await apiClient.createTestCase(payload);
        addToast('Test case created successfully', 'success');
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to save test case', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={testCase ? 'Edit Test Case' : 'Create Automated Test Case'}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Name & Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Test Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Verify User Profile API"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Validates schema and token response"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Method & URL */}
        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-28 px-3 py-2 font-mono font-bold bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>

          <input
            type="text"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/v1/users"
            className="flex-1 px-3 py-2 font-mono bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Tab Selection */}
        <div className="border-b border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('assertions')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'assertions' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'
            }`}
          >
            Assertions ({assertions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('headers')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'headers' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'
            }`}
          >
            Headers ({headers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('body')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'body' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'
            }`}
          >
            Request Body
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('params')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'params' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'
            }`}
          >
            Query Params ({params.length})
          </button>
        </div>

        {/* Tab Panes */}
        <div className="pt-2 max-h-72 overflow-y-auto">
          {activeTab === 'assertions' && (
            <AssertionEditor assertions={assertions} onChange={setAssertions} />
          )}
          {activeTab === 'headers' && (
            <KeyValueEditor items={headers} onChange={setHeaders} />
          )}
          {activeTab === 'body' && (
            <JsonEditor value={body} onChange={setBody} />
          )}
          {activeTab === 'params' && (
            <KeyValueEditor items={params} onChange={setParams} />
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} variant="primary">
            {testCase ? 'Save Changes' : 'Create Test Case'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
