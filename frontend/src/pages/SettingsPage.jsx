import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Settings as SettingsIcon, 
  Sparkles, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  Save,
  Server,
  Zap
} from 'lucide-react';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { apiClient } from '../api/client';
import { useToast } from '../components/common/Toast';

export function SettingsPage() {
  const { addToast } = useToast();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [defaultTimeout, setDefaultTimeout] = useState(10);
  const [ssrfProtection, setSsrfProtection] = useState(true);
  const [aiProvider, setAiProvider] = useState('rule_based');
  const [aiModel, setAiModel] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');

  // AI Diagnostic Test state
  const [testingAi, setTestingAi] = useState(false);
  const [testAiResult, setTestAiResult] = useState(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getSettings();
      setSettings(res.data);
      setDefaultTimeout(res.data.default_timeout_seconds);
      setSsrfProtection(res.data.ssrf_protection_enabled);
      setAiProvider(res.data.ai_provider);
      setAiModel(res.data.ai_model || '');
    } catch (err) {
      addToast('Failed to load settings from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updateData = {
        default_timeout_seconds: parseFloat(defaultTimeout),
        ssrf_protection_enabled: ssrfProtection,
        ai_provider: aiProvider,
        ai_model: aiModel,
      };

      if (openaiKey.trim()) {
        updateData.openai_api_key = openaiKey.trim();
      }
      if (geminiKey.trim()) {
        updateData.gemini_api_key = geminiKey.trim();
      }

      const res = await apiClient.updateSettings(updateData);
      setSettings(res.data);
      setOpenaiKey('');
      setGeminiKey('');
      addToast('Settings updated successfully', 'success');
    } catch (err) {
      addToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestAi = async () => {
    setTestingAi(true);
    setTestAiResult(null);
    try {
      const res = await apiClient.analyzeError({
        method: 'POST',
        url: 'https://api.example.com/v1/auth/token',
        status_code: 401,
        response_time_ms: 125,
        error_message: 'Unauthorized: Invalid token format',
        response_body: '{"error": "invalid_grant", "error_description": "Token signature mismatch"}',
      });
      setTestAiResult(res.data);
      addToast(`AI Diagnostics evaluated successfully via [${res.data.provider}]`, 'success');
    } catch (err) {
      addToast('AI test failed', 'error');
    } finally {
      setTestingAi(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          Platform Settings & Safety Controls
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure security protections, execution limits, and AI error diagnosis providers
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Security & SSRF Protection Card */}
        <Card>
          <CardHeader
            title="SSRF Defense & Network Safety"
            description="Protects against server-side request forgery, metadata leaks, and internal port scanning"
            icon={ShieldCheck}
          />

          <div className="space-y-4 text-xs text-slate-300">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block">Strict SSRF Protection Policy</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Blocks requests to localhost, loopback (127.0.0.1, ::1), RFC1918 subnets, and cloud metadata
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Enforced
                </span>
                <input
                  type="checkbox"
                  checked={ssrfProtection}
                  onChange={(e) => setSsrfProtection(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Safety Rules Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Restricted Destination Filters</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Automatically rejects addresses matching loopback ranges, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, and cloud metadata (169.254.169.254).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>DNS Rebinding & Redirect Defense</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Resolves DNS records on the server and revalidates all resolved IP targets upon each redirect hop before TCP connection.
                </p>
              </div>
            </div>

            {/* Ethical Testing Warning */}
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-900/40 text-amber-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Ethical Testing Requirement:</strong> You must test only API endpoints that you own or have explicit written permission to test. Testing unauthorized targets is strictly prohibited.
              </p>
            </div>
          </div>
        </Card>

        {/* Execution Controls Card */}
        <Card>
          <CardHeader
            title="Execution Controls & Guardrails"
            description="Configure request execution limits and default timeouts"
            icon={Server}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Default Request Timeout (Seconds)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={defaultTimeout}
                onChange={(e) => setDefaultTimeout(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Maximum allowed timeout is 30.0s</span>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Max Response Size Limit
              </label>
              <input
                type="text"
                disabled
                value="10 MB (10,485,760 bytes)"
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-500 font-mono cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Enforced to prevent memory exhaustion</span>
            </div>
          </div>
        </Card>

        {/* AI Diagnostics Engine Configuration Card */}
        <Card>
          <CardHeader
            title="AI Diagnostics Engine Configuration"
            description="Choose between the built-in rule-based expert engine or an optional LLM integration"
            icon={Sparkles}
          />

          <div className="space-y-4 text-xs text-slate-300">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Active AI Provider</label>
              <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value="rule_based">Rule-Based Expert Engine (Zero Cost, Instant, Fully Offline Fallback)</option>
                <option value="gemini">Google Gemini LLM (Requires GEMINI_API_KEY)</option>
                <option value="openai">OpenAI LLM (Requires OPENAI_API_KEY)</option>
              </select>
            </div>

            {aiProvider === 'rule_based' && (
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-indigo-300 text-[11px] leading-relaxed">
                The built-in Rule-Based Diagnostic Engine operates completely locally without requiring external API keys or incurring any usage costs. It automatically analyzes HTTP 4xx/5xx status codes, network failures, SSRF blocks, and assertion mismatches using industry standard troubleshooting heuristics.
              </div>
            )}

            {aiProvider === 'gemini' && (
              <div className="space-y-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-slate-300">Google Gemini API Key</label>
                    {settings?.has_gemini_key && (
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                        Configured in Environment
                      </span>
                    )}
                  </div>
                  <input
                    type="password"
                    placeholder={settings?.has_gemini_key ? '••••••••••••••••••••••••' : 'Enter your Gemini API key'}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Gemini Model (Optional)</label>
                  <input
                    type="text"
                    placeholder="gemini-1.5-flash (default)"
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {aiProvider === 'openai' && (
              <div className="space-y-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-slate-300">OpenAI API Key</label>
                    {settings?.has_openai_key && (
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                        Configured in Environment
                      </span>
                    )}
                  </div>
                  <input
                    type="password"
                    placeholder={settings?.has_openai_key ? '••••••••••••••••••••••••' : 'Enter your OpenAI API key'}
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">OpenAI Model (Optional)</label>
                  <input
                    type="text"
                    placeholder="gpt-4o-mini (default)"
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Zap}
                loading={testingAi}
                onClick={handleTestAi}
              >
                Test AI Error Diagnosis Sample
              </Button>

              <span className="text-[11px] text-slate-500">
                Safe fallback is always active if LLM is unavailable
              </span>
            </div>

            {testAiResult && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 mt-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Sample Diagnostic Output</span>
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
                    {testAiResult.provider}
                  </span>
                </div>
                <p className="text-slate-300 text-xs italic">"{testAiResult.summary}"</p>
                <div className="text-[11px] text-slate-400">
                  <strong>Suggested Fix:</strong> {testAiResult.suggested_fixes?.[0] || 'N/A'}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Save Changes Button */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={Save}
            loading={saving}
          >
            Save Settings & Safety Configurations
          </Button>
        </div>
      </form>
    </div>
  );
}
