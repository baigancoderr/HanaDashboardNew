import React from 'react';
import {
  Settings,
  User,
  Copy,
  ExternalLink,
  ShieldCheck,
  Box,
  Bell,
  Info,
  RefreshCw,
} from 'lucide-react';
import { useHana, formatShortAddress } from '../context/HanaContext';
import { HANA_IMAGES } from '../assets/images';
import {
  BlueButton,
  HeroBanner,
  SectionCard,
} from '../components/common/UiPrimitives';
import { BnbIcon, HanaCoinBadgeIcon, UsdtBadgeIcon } from '../components/common/Icons3D';

export function SettingsPage() {
  const {
    walletAddress,
    shortWallet,
    sponsorAddress,
    activeContracts,
    copyToClipboard,
    resetDemoState,
  } = useHana();

  const contracts = [
    {
      name: 'HANA Token Contract',
      address: activeContracts.hanaToken,
      icon: <HanaCoinBadgeIcon size={28} />,
    },
    {
      name: 'USDT Token Contract',
      address: activeContracts.usdtToken,
      icon: <UsdtBadgeIcon size={28} />,
    },
    {
      name: 'Hana Staking Contract',
      address: activeContracts.stakingContract,
      icon: (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0755E8] text-white">
          <Box className="h-4 w-4" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <HeroBanner
        title="Profile"
        subtitle="Manage your on-chain identity, smart contract verification, and account preferences"
        imageSrc={HANA_IMAGES.bannerSecurity}
        imageAlt="HANA Blockchain profile & Security"
      />

      {/* Profile & On-Chain Identity */}
      <SectionCard
        title="Profile & On-Chain Identity"
        subtitle="Your connected Web3 account and sponsor details"
        icon={<User className="h-4 w-4" />}
        rightSlot={
          <BlueButton onClick={resetDemoState}>
            <RefreshCw className="h-3.5 w-3.5" />
            Resync Account
          </BlueButton>
        }
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-9">
          {/* Left Identity Card */}
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#0755E8]/20 bg-white/90 p-5 text-center lg:col-span-3">
            <img
              src={HANA_IMAGES.userAvatar}
              alt="Connected Web3 Identity"
              referrerPolicy="no-referrer"
              className="h-24 w-24 rounded-full border-4 border-[#FFD700] object-cover shadow-lg"
            />
            <span className="rounded-full bg-[#032B91] px-4 py-1 font-mono text-xs font-bold text-[#FFE98A]">
              {shortWallet}
            </span>
          </div>

          {/* Middle 2x2 Details */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-6">
            <div className="rounded-2xl border border-[#0755E8]/20 bg-white/95 p-3.5">
              <p className="text-xs font-bold text-[#0645C5]">Connected Wallet Address</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="truncate font-mono text-xs font-bold text-[#061B50]">
                  {formatShortAddress(walletAddress)}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(walletAddress, 'Wallet address copied')}
                    className="rounded-lg bg-[#032B91] p-1.5 text-white hover:bg-[#0755E8] cursor-pointer"
                    aria-label="Copy wallet address"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <a
                    href={`${activeContracts.explorerBase}/address/${walletAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-[#0755E8]/25 p-1.5 text-[#0755E8] hover:bg-[#EAF4FF]"
                    aria-label="View wallet on BscScan"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#0755E8]/20 bg-white/95 p-3.5">
              <p className="text-xs font-bold text-[#0645C5]">Registered Sponsor / Referrer</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="truncate font-mono text-xs font-bold text-[#061B50]">
                  {formatShortAddress(sponsorAddress)}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(sponsorAddress, 'Sponsor address copied')}
                    className="rounded-lg bg-[#032B91] p-1.5 text-white hover:bg-[#0755E8] cursor-pointer"
                    aria-label="Copy sponsor address"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <a
                    href={`${activeContracts.explorerBase}/address/${sponsorAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-[#0755E8]/25 p-1.5 text-[#0755E8] hover:bg-[#EAF4FF]"
                    aria-label="View sponsor on BscScan"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#0755E8]/20 bg-white/95 p-3.5">
              <p className="text-xs font-bold text-[#0645C5]">Active Network</p>
              <div className="mt-2 flex items-center gap-2">
                <BnbIcon className="h-5 w-5 shrink-0" />
                <span className="text-xs font-extrabold text-emerald-700">{activeContracts.chainName}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#0755E8]/20 bg-white/95 p-3.5">
              <p className="text-xs font-bold text-[#0645C5]">Block Explorer</p>
              <a
                href={activeContracts.explorerBase}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex items-center justify-between gap-2 text-xs font-bold text-[#0755E8] hover:underline"
              >
                <span className="truncate">{activeContracts.explorerBase}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#D89500]" />
              </a>
            </div>
          </div>

          {/* Right Status Box */}
          {/* <div className="hana-dark-card flex flex-col items-center justify-center rounded-2xl p-5 text-center text-white lg:col-span-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#168BFF]/30 border border-[#27D9FF]/50 text-[#27D9FF] shadow">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <p className="mt-3 font-display text-base font-extrabold">
              Your account is <span className="text-[#FFD700]">fully connected</span>
            </p>
            <p className="mt-1 text-xs text-blue-100/85">Explore your network and track your progress.</p>
          </div> */}
        </div>
      </SectionCard>

      {/* Smart Contract Addresses */}
      <SectionCard
        title="Smart Contract Addresses"
        subtitle={`Official Hana Protocol contracts on ${activeContracts.chainName}`}
        icon={<Settings className="h-4 w-4" />}
      >
        <div className="grid grid-cols-1 items-center gap-5 lg:grid-cols-12">
          <div className="space-y-2.5 lg:col-span-8">
            {contracts.map((c) => (
              <div
                key={c.name}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-[#0755E8]/20 bg-white/95 p-3.5 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {c.icon}
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-[#032B91]">{c.name}</p>
                    <p className="truncate font-mono text-xs font-bold text-[#061B50]">{c.address}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(c.address, `${c.name} copied`)}
                    className="hana-blue-btn inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </button>
                  <a
                    href={`${activeContracts.explorerBase}/address/${c.address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-xl border border-[#D89500] bg-[#061B50] px-3 py-1.5 text-xs font-bold text-[#FFE98A] hover:brightness-110"
                  >
                    BscScan <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center lg:col-span-4">
            <img
              src={HANA_IMAGES.securityVault}
              alt="Verified Smart Contracts"
              referrerPolicy="no-referrer"
              className="h-48 w-full max-w-[260px] rounded-2xl border border-[#0755E8]/25 object-cover shadow"
            />
          </div>
        </div>
      </SectionCard>

      {/* Notifications Status Banner */}
      <SectionCard
        title="Notifications"
        subtitle="Notification preferences are not connected to an external push notification service"
        icon={<Bell className="h-4 w-4" />}
      >
        <div className="flex items-center gap-3 rounded-xl border border-[#0755E8]/20 bg-white/90 p-3.5 text-xs font-semibold text-[#032B91]">
          <Info className="h-5 w-5 shrink-0 text-[#0755E8]" />
          <span>
            Notification preferences are managed locally during your active Web3 session until an external push
            delivery relay is configured.
          </span>
        </div>
      </SectionCard>
    </div>
  );
}
