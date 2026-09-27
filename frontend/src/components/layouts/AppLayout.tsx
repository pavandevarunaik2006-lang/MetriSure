import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, LogOut, Shield, ChevronDown, CheckCircle2, Settings, ScrollText, User as UserIcon, Building2 } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import clsx from 'clsx';

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const roleStyles: Record<string, string> = {
    TECHNICIAN: 'bg-blue-50 text-blue-800 border-blue-200',
    REVIEWER: 'bg-amber-50 text-amber-800 border-amber-200',
    APPROVER: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    ADMINISTRATOR: 'bg-purple-50 text-purple-800 border-purple-200',
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Convert current path to readable breadcrumb segment
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentTitle = pathSegments.length > 0
    ? pathSegments[0].replace(/-/g, ' ').toUpperCase()
    : 'OPERATIONS DASHBOARD';

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-slate-800 flex flex-col font-sans">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      {/* Main content wrapper */}
      <div
        className={clsx(
          'flex min-h-screen flex-col transition-all duration-300 ease-in-out',
          collapsed ? 'md:pl-[72px]' : 'md:pl-[272px]'
        )}
      >
        {/* Top bar header */}
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/90 bg-white px-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile toggle */}
            <button
              type="button"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop collapse toggle */}
            <button
              type="button"
              className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 md:block transition-colors cursor-pointer"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label="Toggle navigation collapse"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Institutional Context & Breadcrumb */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest hidden sm:inline">
                METRISURE
              </span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="text-sm font-bold text-slate-800 tracking-tight font-mono">
                {currentTitle}
              </span>
            </div>
          </div>

          {/* Right utility toolbar */}
          <div className="flex items-center gap-3">
            {/* System Status Pill */}
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>OIML R-76 Engine Online</span>
            </div>

            {/* Notifications */}
            <button
              onClick={() => navigate('/notifications')}
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
              </span>
            </button>

            <div className="hidden h-6 w-px bg-slate-200 sm:block" />

            {/* User Profile dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                aria-label="User profile menu"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-xs text-white shadow-xs">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{user?.full_name || 'Metrologist'}</p>
                  <span className={clsx('inline-block text-[10px] font-bold px-1.5 py-0.2 rounded border', roleStyles[user?.role || ''] || 'bg-slate-100 text-slate-700')}>
                    {user?.role || 'OPERATOR'}
                  </span>
                </div>
                <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in duration-100">
                  <div className="border-b border-slate-100 px-4 py-3 bg-slate-50/50">
                    <p className="text-sm font-bold text-slate-900">{user?.full_name || 'Active User'}</p>
                    <p className="text-xs text-slate-500 font-mono truncate">{user?.email || 'user@metrisure.demo'}</p>
                    
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-indigo-600" />
                        <span className={clsx('font-bold text-[10px] px-1.5 py-0.5 rounded border', roleStyles[user?.role || ''] || 'bg-slate-100 text-slate-700')}>
                          {user?.role || 'OPERATOR'}
                        </span>
                      </div>
                      {user?.id && (
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          UID #{user.id}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-500">
                      <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate">National Metrology Institute</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/settings');
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <Settings className="h-4 w-4 text-slate-400" />
                      <span>System Preferences</span>
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/audit?filter=me');
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <ScrollText className="h-4 w-4 text-slate-400" />
                      <span>My Audit Events</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                        navigate('/login');
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1">
          <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>

        {/* Subdued Institutional Footer */}
        <footer className="border-t border-slate-200/80 bg-white/80 py-3 px-6 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">METRISURE</span>
            <span>•</span>
            <span>OIML Recommendation R 76-1 Implementation</span>
          </div>
          <div className="font-mono text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            DEMO DATA & DEMO RULEPACK — FOR DEMONSTRATION ONLY
          </div>
        </footer>
      </div>
    </div>
  );
}
