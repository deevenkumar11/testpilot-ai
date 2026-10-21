import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Send, 
  CheckSquare, 
  History, 
  Settings, 
  ShieldCheck, 
  Sparkles,
  Zap,
  Server
} from 'lucide-react';
import { apiClient } from '../../api/client';

export function Sidebar() {
  const [backendStatus, setBackendStatus] = useState({ online: false, checking: true });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await apiClient.getHealth();
        if (res.data.status === 'healthy') {
          setBackendStatus({ online: true, checking: false });
        } else {
          setBackendStatus({ online: false, checking: false });
        }
      } catch (err) {
        setBackendStatus({ online: false, checking: false });
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/builder', label: 'API Tester', icon: Send },
    { to: '/test-cases', label: 'Test Suites', icon: CheckSquare },
    { to: '/history', label: 'History', icon: History },
    { to: '/settings', label: 'Settings & Safety', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/90 flex flex-col h-screen sticky top-0 select-none z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-600/30">
          <Zap className="w-5 h-5 text-white fill-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-100 tracking-tight text-base">TestPilot</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/60 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> AI
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">API Testing & Automation</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-slate-100 hover:bg-slate-900 border border-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Safety & System Status Footer */}
      <div className="p-4 border-t border-slate-800/80 space-y-2.5 bg-slate-900/30">
        {/* SSRF Protection Pill */}
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-medium">SSRF Guard</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-semibold bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-300">
            Active
          </span>
        </div>

        {/* Backend Connectivity Status */}
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span>FastAPI Server</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus.online ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-500'
              }`}
            />
            <span className="text-[11px] font-medium text-slate-400">
              {backendStatus.checking ? 'Checking...' : backendStatus.online ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
