import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Layers,
  Coins,
  Package,
  Repeat,
  Crown,
  Flame,
  Users,
  Award,
  UserPlus,
  TrendingUp,
  FileSpreadsheet,
  Gift,
  BarChart3,
  Trophy,
  Wallet,
  ArrowLeftRight,
  Settings,
  BookOpen,
  HelpCircle,
  Globe,
  X,
} from 'lucide-react';
import { HanaLogo } from '../common/HanaLogo';

const NAV_SECTIONS = [
  {
    heading: 'BUSINESS',
    items: [
      { label: 'Staking', to: '/dashboard/staking', icon: Coins },
      { label: 'DAO Program', to: '/dashboard/dao', icon: Crown },
      { label: 'Compounding', to: '/dashboard/compounding', icon: Repeat },
      { label: 'Tokenomics', to: '/dashboard/token', icon: Flame },
    ],
  },
  {
    heading: 'NETWORK',
    items: [
      { label: 'My Team', to: '/dashboard/team', icon: Users },
    ],
  },
  {
    heading: 'INCOME',
    items: [
      { label: 'Direct Income', to: '/dashboard/direct-income', icon: UserPlus },
      { label: 'Level Income', to: '/dashboard/level-income', icon: TrendingUp },
      { label: 'Income Report', to: '/dashboard/income-report', icon: FileSpreadsheet },
    ],
  },
  {
    heading: 'RANK & REWARDS',
    items: [
      { label: 'Rank', to: '/dashboard/rank', icon: BarChart3 },
    ],
  },
  {
    heading: 'TRANSACTIONS',
    items: [
      { label: 'Withdraw', to: '/dashboard/withdraw', icon: Wallet },
      { label: 'Transactions', to: '/dashboard/transactions', icon: ArrowLeftRight },
    ],
  },
  {
    heading: 'ECOSYSTEM',
    items: [
      { label: 'HANA Ecosystem', to: '/dashboard/ecosystem', icon: Globe },
    ],
  },
  {
    heading: 'TOOLS',
    items: [
      { label: 'Profile', to: '/dashboard/settings', icon: Settings },
    ],
  },
];

export function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  const navContent = (isMobile) => {
    const isCompact = !isMobile && collapsed;
    return (
      <div className="hana-sidebar-bg relative flex h-full flex-col overflow-hidden border-r border-[#27D9FF]/30 text-white select-none">
        {/* Bottom-left curved golden/cyan glow matching reference screenshots */}
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-gradient-to-tr from-[#FFB800]/35 via-[#27D9FF]/20 to-transparent blur-2xl" />

        {/* Brand Header */}
        <div className={`relative z-10 flex items-center justify-between border-b border-white/15 px-4 py-3.5 ${isCompact ? 'justify-center px-2' : ''}`}>
          <NavLink to="/dashboard" onClick={onCloseMobile} className="focus-visible:outline-none">
            <HanaLogo compact={isCompact} />
          </NavLink>
          {isMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white cursor-pointer"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation */}
        <nav className="relative z-10 flex-1 space-y-4 overflow-y-auto px-3 py-4" aria-label="Primary Sidebar Navigation">
          <NavLink
            to="/dashboard"
            end
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all duration-150 ${
                isCompact ? 'justify-center px-2' : ''
              } ${
                isActive
                  ? 'hana-nav-active'
                  : 'text-white/90 hover:bg-white/12 hover:text-white'
              }`
            }
            title="Dashboard"
          >
            <Home className="h-[18px] w-[18px] shrink-0" />
            {!isCompact && <span className="truncate">Dashboard</span>}
          </NavLink>

          {NAV_SECTIONS.map((section) => (
            <div key={section.heading} className="pt-1">
              {!isCompact ? (
                <div className="mb-1.5 flex items-center gap-2 px-2">
                  <span className="text-[11px] font-extrabold tracking-wider text-[#FFD700] uppercase whitespace-nowrap">
                    {section.heading}
                  </span>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-[#FFD700]/60 to-transparent" />
                </div>
              ) : (
                <div className="my-2 h-[1px] bg-[#FFD700]/30" />
              )}

              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isDAO = item.to === '/dashboard/dao' || item.to === '/dao';
                  return (
                    <li key={item.to}>
                      {isDAO ? (
                        <NavLink
                          to={item.to}
                          onClick={onCloseMobile}
                          title={item.label}
                          className={({ isActive }) =>
                            `dao-highlight-item relative flex items-center gap-3 rounded-xl px-3.5 py-2 text-[13.5px] font-semibold transition-all duration-150 overflow-hidden ${
                              isCompact ? 'justify-center px-2' : ''
                            } ${
                              isActive
                                ? 'hana-nav-active font-bold'
                                : 'text-white font-bold'
                            }`
                          }
                        >
                          <Icon className="dao-crown-icon h-4 w-4 shrink-0 text-[#FFD700]" />
                          {!isCompact && (
                            <>
                              <span className="truncate dao-label-text">{item.label}</span>
                              <span className="dao-badge ml-auto shrink-0">HOT</span>
                            </>
                          )}
                          <span className="dao-shimmer" aria-hidden="true" />
                        </NavLink>
                      ) : (
                        <NavLink
                          to={item.to}
                          onClick={onCloseMobile}
                          title={item.label}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-xl px-3.5 py-2 text-[13.5px] font-semibold transition-all duration-150 ${
                              isCompact ? 'justify-center px-2' : ''
                            } ${
                              isActive
                                ? 'hana-nav-active font-bold'
                                : 'text-white/88 hover:bg-white/12 hover:text-white'
                            }`
                          }
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {!isCompact && <span className="truncate">{item.label}</span>}
                        </NavLink>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className="pt-2 border-t border-white/10 mt-3">
            <NavLink
              to="/"
              onClick={onCloseMobile}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2 text-[13px] font-semibold text-blue-100/90 hover:bg-white/12 hover:text-white transition ${
                isCompact ? 'justify-center px-2' : ''
              }`}
              title="Return to Website"
            >
              <Globe className="h-4 w-4 shrink-0 text-[#27D9FF]" />
              {!isCompact && <span className="truncate">Main Website</span>}
            </NavLink>
          </div>
        </nav>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Fixed/Collapsible Sidebar */}
      <aside
        className={`hidden lg:block h-screen shrink-0 transition-all duration-200 ${
          collapsed ? 'w-[76px]' : 'w-[244px]'
        }`}
      >
        <div className="h-full">{navContent(false)}</div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-[#061B50]/65 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 h-full w-[264px] max-w-[82vw] shadow-2xl">
            {navContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
