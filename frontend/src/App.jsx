import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { ToastProvider } from './components/common/Toast';
import { Dashboard } from './pages/Dashboard';
import { RequestBuilderPage } from './pages/RequestBuilderPage';
import { TestSuitesPage } from './pages/TestSuitesPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="flex min-h-screen bg-[#070b14] text-slate-100 font-sans antialiased">
          {/* Persistent Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <Navbar />
            <main className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/builder" element={<RequestBuilderPage />} />
                <Route path="/test-cases" element={<TestSuitesPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
