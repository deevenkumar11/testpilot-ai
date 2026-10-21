import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Send, Shield, Info, ExternalLink } from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

export function Navbar() {
  const location = useLocation();
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/':
        return 'Analytics Dashboard';
      case '/builder':
        return 'API Request Builder';
      case '/test-cases':
        return 'Automated Test Suites';
      case '/history':
        return 'Execution History';
      case '/settings':
        return 'Platform Settings & Safety';
      default:
        return 'TestPilot AI';
    }
  };

  return (
    <>
      <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">
            {getPageTitle(location.pathname)}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Ethical Use & Safety Guidelines Button */}
          <button
            onClick={() => setSafetyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Safety Guidelines</span>
          </button>

          {location.pathname !== '/builder' && (
            <Link to="/builder">
              <Button size="sm" icon={Send} variant="primary">
                New Request
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Ethical Testing & Security Modal */}
      <Modal
        isOpen={safetyModalOpen}
        onClose={() => setSafetyModalOpen(false)}
        title="Ethical API Testing & Platform Safety"
      >
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-200 text-xs flex gap-2.5 items-start">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Crucial Policy Notice:</strong> You must test only API endpoints that you own, operate, or have express written authorization to test. Unauthorized penetration testing or brute-forcing APIs is illegal and strictly prohibited.
            </span>
          </div>

          <div>
            <h4 className="font-semibold text-slate-100 mb-1">SSRF (Server-Side Request Forgery) Protection</h4>
            <p className="text-slate-400 text-xs">
              TestPilot AI automatically enforces rigorous SSRF filters on every HTTP request. Requests directed to localhost, loopback IPs (127.0.0.1, ::1), private RFC1918 subnets (10.x, 172.16-31.x, 192.168.x), and cloud metadata endpoints (169.254.169.254, metadata.google.internal) are blocked at the DNS and socket level.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-100 mb-1">Redirect Revalidation</h4>
            <p className="text-slate-400 text-xs">
              Every redirect hop is inspected prior to connection to ensure an external API cannot redirect the server into internal or private network infrastructure.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-100 mb-1">Execution Safeguards</h4>
            <p className="text-slate-400 text-xs">
              Configurable timeout limits (up to 30s) and payload size restrictions (5MB request, 10MB response) protect your testing engine against resource exhaustion attacks.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setSafetyModalOpen(false)}>
              Understood
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
