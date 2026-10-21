import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Send, 
  Play, 
  Sparkles, 
  HardDrive,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { MethodBadge, StatusBadge, OutcomeBadge } from '../components/common/Badge';
import { StatCardSkeleton } from '../components/common/LoadingSkeleton';
import { BatchRunnerModal } from '../components/testcase/BatchRunnerModal';
import { ExecutionDrawer } from '../components/history/ExecutionDrawer';
import { apiClient } from '../api/client';
import { useToast } from '../components/common/Toast';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

export function Dashboard() {
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getDashboardStats();
      setStats(res.data);
    } catch (err) {
      addToast('Failed to load dashboard metrics from backend', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Format data for Donut Chart
  const pieData = [
    { name: 'Successful', value: stats?.successful_requests || 0, color: '#10b981' },
    { name: 'Failed', value: stats?.failed_requests || 0, color: '#f43f5e' },
    { name: 'Errors', value: stats?.error_requests || 0, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  // Fallback pie data if zero requests yet
  const displayPieData = pieData.length > 0 ? pieData : [{ name: 'No Data Yet', value: 1, color: '#334155' }];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Intelligent API Testing & Automation Platform
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time analytics, automated assertion suites, and AI error diagnosis
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            icon={RefreshCw}
            onClick={fetchStats}
            loading={loading}
          >
            Refresh
          </Button>

          <Button
            size="sm"
            variant="secondary"
            icon={Play}
            onClick={() => setBatchModalOpen(true)}
          >
            Run All Tests
          </Button>

          <Link to="/builder">
            <Button size="sm" variant="primary" icon={Send}>
              API Tester
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            {/* Total Requests */}
            <Card glow className="relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Executions</span>
                <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-100 font-mono">
                {stats?.total_requests || 0}
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Across all test suites & ad-hoc requests
              </div>
            </Card>

            {/* Success Rate */}
            <Card glow className="relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Success Rate</span>
                <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                {stats?.success_rate || 0}%
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                {stats?.successful_requests || 0} passed / {stats?.total_requests || 0} total
              </div>
            </Card>

            {/* Failed Requests */}
            <Card glow className="relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Failed / Errors</span>
                <div className="p-2 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-800/40">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-rose-400 font-mono">
                {(stats?.failed_requests || 0) + (stats?.error_requests || 0)}
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Failed assertions or HTTP 4xx/5xx errors
              </div>
            </Card>

            {/* Average Latency */}
            <Card glow className="relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Latency</span>
                <div className="p-2 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-cyan-400 font-mono">
                {stats?.avg_response_time_ms ? `${stats.avg_response_time_ms.toFixed(0)} ms` : '0 ms'}
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Average server round-trip response time
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Success Rate Donut Chart */}
        <Card className="flex flex-col">
          <CardHeader
            title="Outcome Distribution"
            description="Success vs failure breakdown"
          />
          <div className="flex-1 flex flex-col items-center justify-center min-h-[240px]">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={displayPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {displayPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex items-center justify-center gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="text-slate-300">Passed ({stats?.successful_requests || 0})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                <span className="text-slate-300">Failed ({stats?.failed_requests || 0})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="text-slate-300">Errors ({stats?.error_requests || 0})</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Latency & Activity Trend Area Chart */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader
            title="Execution History & Latency Trend"
            description="Average response time (ms) and volume"
          />
          <div className="flex-1 min-h-[240px]">
            {stats?.timeline_data && stats.timeline_data.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats.timeline_data}>
                  <defs>
                    <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="ms" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="avg_latency"
                    name="Avg Latency (ms)"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#latencyGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
                No execution trend data yet. Run API requests or automated test suites to visualize latency trends.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-100 text-base">Recent Test Activity</h3>
            <p className="text-xs text-slate-400 mt-0.5">Live execution logs from the database</p>
          </div>
          <Link to="/history" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
            View All History <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Endpoint</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3">Outcome</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {stats?.recent_activity && stats.recent_activity.length > 0 ? (
                stats.recent_activity.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-850/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedHistoryItem(item);
                      setDrawerOpen(true);
                    }}
                  >
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <MethodBadge method={item.method} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 max-w-xs md:max-w-md truncate text-slate-200">
                      {item.url}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge statusCode={item.status_code} />
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">
                      {item.response_time_ms ? `${item.response_time_ms.toFixed(0)} ms` : '-'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-sans">
                      <OutcomeBadge outcome={item.outcome} />
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-400 font-sans text-[11px]">
                      {item.created_at ? new Date(item.created_at).toLocaleTimeString() : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHistoryItem(item);
                          setDrawerOpen(true);
                        }}
                        className="text-indigo-400 hover:text-indigo-300 font-sans text-xs underline"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                    No API executions logged yet. Use the API Tester above to send your first request!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Batch Runner Modal */}
      <BatchRunnerModal
        isOpen={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        onCompleted={fetchStats}
      />

      {/* Execution Drawer */}
      <ExecutionDrawer
        item={selectedHistoryItem}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
