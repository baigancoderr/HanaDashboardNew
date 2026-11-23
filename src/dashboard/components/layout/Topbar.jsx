import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Copy,
  Bell,
  LogOut,
  Settings,
  UserCheck,
  Wallet,
  CheckCheck,
} from 'lucide-react';
import { useHana } from '../../context/HanaContext';
import { BnbIcon, MetaMaskIcon } from '../common/Icons3D';
import { HANA_IMAGES } from '../../assets/images';

export function Topbar({ onToggleSidebar }) {
  const {
    network,
    switchNetwork,
    walletConnected,
    walletAddress,
    shortWallet,
    connectWallet,
    disconnectWallet,
    copyToClipboard,
    notifications,
    markAllNotificationsRead,
  } = useHana();
  const navigate = useNavigate();

  const [netOpen, setNetOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const containerRef = useRef(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setNetOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <header
      ref={containerRef}
      className="hana-topbar-bg sticky top-0 z-30 flex min-h-[64px] items-center justify-between gap-3 px-4 py-2.5 text-white sm:px-6"
    >
      {/* Left: Toggle + Welcome */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition hover:bg-white/15 cursor-pointer"
          aria-label="Toggle sidebar navigation"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="2" y1="5" x2="18" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="2" y1="10" x2="11" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="2" y1="15" x2="18" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="hidden min-w-0 items-center gap-2.5 md:flex">
          {/* <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFB800]/20 text-[#FFD700] border border-[#FFD700]/40">
            <UserCheck className="h-4 w-4" />
          </span> */}
          <div className="min-w-0 leading-tight">
            <p className="text-[11px] font-medium text-blue-100/90">Welcome Back,</p>
            <div className="flex items-center gap-1.5">
              <p className="truncate font-mono text-sm font-bold text-white tabular-nums">{shortWallet}</p>
              <button
                type="button"
                onClick={() => copyToClipboard(walletAddress, 'Wallet address copied')}
                className="rounded p-1 text-blue-100 transition hover:bg-white/15 hover:text-[#FFD700] cursor-pointer"
                aria-label="Copy wallet address"
                title="Copy wallet address"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Network Switcher + Wallet Pill + Notifications + Profile */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {/* BNB Smart Chain Network Selector (hidden on mobile) */}
        <div className="relative hidden md:block">
          <button
            type="button"
            onClick={() => {
              setNetOpen((v) => !v);
              setNotifOpen(false);
              setProfileOpen(false);
            }}
            className="flex items-center gap-2 rounded-full border border-[#27D9FF]/45 bg-[#032B91]/60 px-3.5 py-1.5 text-[13px] font-bold text-white shadow-inner transition hover:bg-[#032B91]/85 cursor-pointer"
          >
            <BnbIcon className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">
              {network === 'bscTestnet' ? 'BNB Smart Chain' : 'BNB Mainnet'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-blue-200" />
          </button>

          {netOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-[#0755E8]/30 bg-white p-1.5 text-[#061B50] shadow-2xl">
              <p className="px-3 py-1.5 text-[11px] font-extrabold tracking-wider text-[#0645C5]/70 uppercase">
                Select Network
              </p>
              <button
                type="button"
                onClick={() => {
                  switchNetwork('bscTestnet');
                  setNetOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold transition cursor-pointer ${
                  network === 'bscTestnet' ? 'bg-[#EAF4FF] text-[#0755E8]' : 'hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <BnbIcon className="h-4 w-4" />
                  BNB Smart Chain (Testnet)
                </span>
                {network === 'bscTestnet' && <span className="text-[10px] font-extrabold text-emerald-600">Active</span>}
              </button>
              <button
                type="button"
                onClick={() => {
                  switchNetwork('bscMainnet');
                  setNetOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold transition cursor-pointer ${
                  network === 'bscMainnet' ? 'bg-[#EAF4FF] text-[#0755E8]' : 'hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <BnbIcon className="h-4 w-4" />
                  BNB Smart Chain (Mainnet)
                </span>
                {network === 'bscMainnet' && <span className="text-[10px] font-extrabold text-emerald-600">Active</span>}
              </button>
            </div>
          )}
        </div>

        {/* Connected Wallet Pill */}
        {/* {walletConnected ? (
          <div className="flex items-center gap-1.5 rounded-full border border-[#27D9FF]/45 bg-[#032B91]/60 py-1.5 pr-2 pl-2.5 text-xs font-bold text-white shadow-inner sm:gap-2 sm:pl-3 sm:text-[13px]">
            <MetaMaskIcon className="h-4 w-4 shrink-0" />
            <span className="font-mono tabular-nums">{shortWallet}</span>
            <button
              type="button"
              onClick={() => copyToClipboard(walletAddress, 'Wallet address copied')}
              className="rounded-full p-1 text-blue-100 transition hover:bg-white/15 hover:text-[#FFD700] cursor-pointer"
              aria-label="Copy connected wallet address"
              title="Copy wallet address"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={connectWallet}
            className="hana-gold-btn flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold cursor-pointer"
          >
            <Wallet className="h-3.5 w-3.5" />
            <span>Connect Wallet</span>
          </button>
        )} */}

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setNetOpen(false);
              setProfileOpen(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FFD700] px-1 text-[10px] font-extrabold text-[#061B50]">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#0755E8]/30 bg-white p-3 text-[#061B50] shadow-2xl">
              <div className="mb-2 flex items-center justify-between border-b border-blue-100 pb-2">
                <span className="font-display text-sm font-bold text-[#032B91]">On-Chain Alerts</span>
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#0755E8] hover:underline cursor-pointer"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              </div>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-xl border p-2.5 text-xs ${
                      n.read ? 'border-slate-100 bg-slate-50/70' : 'border-amber-200 bg-amber-50/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#032B91]">{n.title}</span>
                      <span className="text-[10px] text-[#0645C5]/60">{n.time}</span>
                    </div>
                    <p className="mt-1 text-[#061B50]/80">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((v) => !v);
              setNetOpen(false);
              setNotifOpen(false);
            }}
            className="flex items-center gap-1.5 rounded-full border border-[#FFD700]/65 bg-white/10 p-0.5 pr-2 transition hover:bg-white/20 cursor-pointer"
            aria-label="Profile menu"
          >
            <img
              src={HANA_IMAGES.userAvatar}
              alt={shortWallet}
              referrerPolicy="no-referrer"
              className="h-8 w-8 rounded-full object-cover border border-[#FFD700]"
            />
            <ChevronDown className="h-3.5 w-3.5 text-white" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-[#0755E8]/30 bg-white p-2 text-[#061B50] shadow-2xl">
              <div className="border-b border-blue-100 px-3 py-2">
                <p className="text-[11px] font-bold text-[#0645C5]/75">Connected Wallet</p>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="font-mono text-xs font-bold text-[#032B91]">{shortWallet}</p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(walletAddress, 'Wallet address copied')}
                    className="rounded-md p-1 text-[#0755E8] hover:bg-[#EAF4FF] cursor-pointer"
                    aria-label="Copy wallet address"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-1 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/dashboard/settings');
                    setProfileOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-[#032B91] hover:bg-[#EAF4FF] cursor-pointer"
                >
                  <Settings className="h-4 w-4 text-[#0755E8]" />
                  Account Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/dashboard/transactions');
                    setProfileOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-[#032B91] hover:bg-[#EAF4FF] cursor-pointer"
                >
                  <Wallet className="h-4 w-4 text-[#0755E8]" />
                  Transaction History
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/');
                    setProfileOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-[#0645C5] hover:bg-[#EAF4FF] cursor-pointer"
                >
                  <Wallet className="h-4 w-4 text-[#0755E8]" />
                  Main Website
                </button>
                {walletConnected ? (
                  <button
                    type="button"
                    onClick={() => {
                      disconnectWallet();
                      setProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Disconnect Wallet
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      connectWallet();
                      setProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                  >
                    <Wallet className="h-4 w-4" />
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
