import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Scale, FlaskConical, CheckCircle2, Play,
  BarChart3, HelpCircle, GitBranch, FlaskRound,
  Eye, Fingerprint, ShieldCheck, Link2,
  Archive, FileText, QrCode, History,
  ClipboardCheck, Shield, FileDiff, ScrollText,
  BookOpen, GitCompare,
  Users, Building2, Settings, X, ChevronLeft, Award
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../hooks/useAuth';

export interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onToggleCollapse?: () => void;
}

const navSections = [
  {
    title: 'Operations',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    ],
  },
  {
    title: 'Testing Workflow',
    items: [
      { label: 'Instruments', icon: Scale, path: '/instruments' },
      { label: 'Test Sessions', icon: FlaskConical, path: '/test-sessions' },
      { label: 'Test Ready', icon: CheckCircle2, path: '/test-ready' },
      { label: 'Test Plan', icon: FileText, path: '/test-plan' },
      { label: 'Test Execution', icon: Play, path: '/test-execution' },
    ],
  },
  {
    title: 'Compliance Engine',
    items: [
      { label: 'Compliance Results', icon: BarChart3, path: '/results' },
      { label: 'Why Pass / Why Fail', icon: HelpCircle, path: '/why-pass' },
      { label: 'Decision Trace', icon: GitBranch, path: '/decision-trace' },
      { label: 'Simulation / What-If', icon: FlaskRound, path: '/simulations' },
    ],
  },
  {
    title: 'Quality & Evidence',
    items: [
      { label: 'VisualProof (OCR)', icon: Eye, path: '/visualproof' },
      { label: 'Test Provenance', icon: Fingerprint, path: '/provenance' },
      { label: 'TestGuard QC', icon: ShieldCheck, path: '/testguard' },
      { label: 'Case Integrity', icon: Link2, path: '/case-integrity' },
    ],
  },
  {
    title: 'Governance & Approval',
    items: [
      { label: 'Review & Approval', icon: ClipboardCheck, path: '/review' },
      { label: 'ReportGuard', icon: Shield, path: '/reportguard' },
      { label: 'Approval Diff', icon: FileDiff, path: '/approval-diff' },
      { label: 'Audit Trail', icon: ScrollText, path: '/audit' },
    ],
  },
  {
    title: 'Reports & Registry',
    items: [
      { label: 'Report Repository', icon: Archive, path: '/repository' },
      { label: 'Issued Reports', icon: FileText, path: '/reports' },
      { label: 'Hash Verification', icon: QrCode, path: '/verification' },
      { label: 'Relational History', icon: History, path: '/history' },
    ],
  },
  {
    title: 'Regulatory RulePacks',
    items: [
      { label: 'Digital RulePacks', icon: BookOpen, path: '/rulepacks' },
      { label: 'Change Impact', icon: GitCompare, path: '/change-impact' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'User Directory', icon: Users, path: '/users' },
      { label: 'Laboratories', icon: Building2, path: '/laboratories' },
      { label: 'System Settings', icon: Settings, path: '/settings' },
    ],
  },
];

export function Sidebar({ collapsed, mobileOpen, setMobileOpen, onToggleCollapse }: SidebarProps) {
  const { user } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-[#0b132b] text-slate-200 border-r border-slate-800/80 transition-all duration-300 ease-in-out select-none shadow-xl',
          collapsed ? 'w-[72px]' : 'w-[272px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-4 bg-[#080e21]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <Scale className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold tracking-tight text-white">MetriSure</span>
                  <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30">
                    R-76
                  </span>
                </div>
                <p className="text-[10px] uppercase font-medium tracking-widest text-slate-400 truncate">
                  NAWI Metrology Platform
                </p>
              </div>
            )}
          </div>
          {/* Mobile close button */}
          <button
            className="md:hidden rounded-md p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-thin">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!collapsed ? (
                <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {section.title}
                </h4>
              ) : (
                <div className="h-px bg-slate-800/80 my-2 mx-2" />
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        clsx(
                          'group flex items-center rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                          collapsed && 'justify-center px-2',
                          isActive
                            ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-600/20'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        )
                      }
                    >
                      <item.icon
                        className={clsx(
                          'h-[18px] w-[18px] shrink-0 transition-colors',
                          collapsed ? '' : 'mr-3',
                          'text-slate-400 group-hover:text-white group-[.active]:text-white'
                        )}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Identity Footer */}
        {user && (
          <div className="border-t border-slate-800 bg-[#080e21] p-3 text-xs">
            {!collapsed ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-600 font-bold text-xs text-white shadow-xs">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-200 text-xs truncate leading-tight">
                      {user.full_name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80 font-mono">
                  <span className="font-semibold text-indigo-400">{user.role}</span>
                  {user.id && <span className="text-slate-500">UID #{user.id}</span>}
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-0.5" title={`${user.full_name} (${user.role}) • ${user.email}`}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-xs text-white shadow-xs">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collapse toggle (desktop) */}
        <div className="hidden md:flex border-t border-slate-800 p-2 bg-[#070c1c]">
          <button
            onClick={onToggleCollapse}
            className="flex w-full items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft className={clsx('h-4 w-4 transition-transform duration-200', collapsed && 'rotate-180')} />
            {!collapsed && <span className="text-xs font-medium ml-2">Collapse Navigation</span>}
          </button>
        </div>

        {/* Authoritative Disclaimer */}
        {!collapsed && (
          <div className="border-t border-slate-800 px-3 py-1.5 bg-[#050814]">
            <p className="text-[9px] text-amber-500/80 text-center font-mono">
              DEMO RULEPACK — NOT AUTHORITATIVE
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
