import React, { useState, useRef } from 'react';
import {
  TrendingUp,
  Coins,
  Flame,
  Wallet,
  ArrowLeftRight,
  ShoppingCart,
  ShieldCheck,
  PieChart,
  BarChart3,
  Zap,
  Info,
} from 'lucide-react';
import { useHana } from '../context/HanaContext';
import { HANA_IMAGES } from '../assets/images';
import {
  ConfirmModal,
  GoldButton,
  HeroBanner,
  SectionCard,
  StatCard,
} from '../components/common/UiPrimitives';
import { HanaCoinBadgeIcon, UsdtBadgeIcon } from '../components/common/Icons3D';

export function TokenPage() {
  const {
    hanaPrice,
    usdtReserve,
    hanaPool,
    hanaBalance,
    usdtBalance,
    buyHana,
    sellHana,
  } = useHana();

  const [mode, setMode] = useState('buy');
  const [amountInput, setAmountInput] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const swapRef = useRef(null);

  const parsedAmount = Math.max(0, Number(amountInput) || 0);
  const estimatedReceive =
    mode === 'buy'
      ? parsedAmount / hanaPrice
      : parsedAmount * hanaPrice;

  const maxBalance = mode === 'buy' ? usdtBalance : hanaBalance;

  return (
    <div className="space-y-5">
      <HeroBanner
        title="Tokenomics"
        highlight="Trade. Burn. Grow."
        subtitle="Algorithmic reserve-backed liquidity with 100% deflationary sell burn mechanism"
        ctaLabel="Buy / Sell HANA →"
        onCtaClick={() => swapRef.current?.scrollIntoView({ behavior: 'smooth' })}
        imageSrc={HANA_IMAGES.bannerStaking}
        imageAlt="HANA Tokenomics Reserve"
      />

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="h-6 w-6" />}
          label="HANA Live Price"
          value={`$${hanaPrice.toFixed(4)}`}
          trend="+12.8%"
        />
        <StatCard
          icon={<Coins className="h-6 w-6" />}
          label="USDT Reserve"
          value={`$${usdtReserve.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtext="Locked in Contract"
          goldAccent
        />
        <StatCard
          icon={<Flame className="h-6 w-6" />}
          label="HANA in Pool"
          value={hanaPool.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          subtext="Circulating Supply"
        />
        <StatCard
          icon={<Wallet className="h-6 w-6" />}
          label="Your HANA Balance"
          value={hanaBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          subtext={`≈ $${(hanaBalance * hanaPrice).toFixed(2)} USDT`}
          goldAccent
        />
      </div>

      {/* Main Swap + Mechanisms Grid */}
      <div ref={swapRef} className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Interactive Token Swap */}
        <SectionCard
          className="lg:col-span-6"
          title="Interactive Token Swap"
          subtitle="Buy & Sell HANA directly from the smart contract"
          icon={<ArrowLeftRight className="h-4 w-4" />}
        >
          <div className="space-y-4">
            {/* Buy / Sell Segmented Toggle */}
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#0755E8]/20 bg-[#DCEBFF]/60 p-1.5">
              <button
                type="button"
                onClick={() => {
                  setMode('buy');
                  setAmountInput('100');
                }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-extrabold transition cursor-pointer ${
                  mode === 'buy'
                    ? 'hana-nav-active text-[#061B50]'
                    : 'text-[#032B91] hover:bg-white/60'
                }`}
              >
                <ShoppingCart className="h-4 w-4" />
                Buy
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('sell');
                  setAmountInput('100');
                }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-extrabold transition cursor-pointer ${
                  mode === 'sell'
                    ? 'hana-blue-btn text-white'
                    : 'text-[#032B91] hover:bg-white/60'
                }`}
              >
                <Flame className="h-4 w-4 text-[#FFB800]" />
                Sell
              </button>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                <span className="text-[#032B91]">
                  {mode === 'buy' ? 'You Pay (USDT)' : 'You Sell & Burn (HANA)'}
                </span>
                <span className="text-[#0645C5] tabular-nums">
                  Balance: {mode === 'buy' ? `$${usdtBalance.toFixed(2)} USDT` : `${hanaBalance.toFixed(2)} HANA`}
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-[#0755E8]/30 bg-white px-3 py-2 shadow-inner">
                {mode === 'buy' ? <UsdtBadgeIcon size={26} /> : <HanaCoinBadgeIcon size={26} />}
                <input
                  type="number"
                  min={0}
                  max={maxBalance}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent font-display text-lg font-extrabold text-[#061B50] tabular-nums focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setAmountInput(String(maxBalance))}
                  className="hana-gold-btn rounded-lg px-3 py-1 text-xs font-extrabold cursor-pointer"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[#0755E8]/25 bg-gradient-to-r from-[#042A82] to-[#0755E8] p-4 text-white sm:grid-cols-2">
              <div className="flex items-center gap-3">
                {mode === 'buy' ? <HanaCoinBadgeIcon size={36} /> : <UsdtBadgeIcon size={36} />}
                <div>
                  <p className="text-[11px] font-semibold text-blue-100">Estimated Receive</p>
                  <p className="font-display text-base font-extrabold text-[#FFE98A] tabular-nums">
                    ≈ {estimatedReceive.toFixed(2)} {mode === 'buy' ? 'HANA' : 'USDT'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:border-l sm:border-white/20 sm:pl-4">
                <TrendingUp className="h-5 w-5 shrink-0 text-[#FFD700]" />
                <div>
                  <p className="text-[11px] font-semibold text-blue-100">Contract Price</p>
                  <p className="font-display text-sm font-extrabold tabular-nums">
                    1 HANA = ${hanaPrice.toFixed(4)} USDT
                  </p>
                </div>
              </div>
            </div>

            <GoldButton
              onClick={() => setConfirmOpen(true)}
              disabled={parsedAmount <= 0 || parsedAmount > maxBalance}
              className="w-full py-3"
            >
              <Zap className="h-4 w-4" />
              {mode === 'buy' ? 'Approve & Buy HANA' : 'Approve & Sell (Burn) HANA'}
            </GoldButton>
          </div>
        </SectionCard>

        {/* Right: Constant Liquidity Backing + 100% Deflationary Sell Mechanism */}
        <div className="space-y-4 lg:col-span-6">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-400/50 bg-gradient-to-r from-[#064E3B] via-[#047857] to-[#059669] p-5 text-white shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 border border-emerald-300/40">
                <ShieldCheck className="h-7 w-7 text-emerald-200" />
              </div>
              <div>
                <h3 className="font-display text-lg font-extrabold text-emerald-100">
                  Constant Liquidity Backing
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-emerald-50/90 sm:text-sm">
                  Price is determined entirely by USDT and HANA reserves inside the smart contract, guaranteeing
                  continuous on-chain liquidity.
                </p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-orange-400/50 bg-gradient-to-r from-[#7C2D12] via-[#B45309] to-[#DC2626] p-5 text-white shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 border border-orange-300/40">
                <Flame className="h-7 w-7 text-[#FFE98A]" />
              </div>
              <div>
                <h3 className="font-display text-lg font-extrabold text-[#FFE98A]">
                  100% Deflationary Sell Mechanism
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-orange-50/90 sm:text-sm">
                  Whenever tokens are sold back to the contract, <strong>100% of the sold HANA</strong> are permanently
                  burned from circulating supply.
                </p>
              </div>
            </div>
          </div>

          <div className="hana-card flex items-center gap-4 rounded-2xl p-4">
            <img
              src={HANA_IMAGES.goldCoinsStack}
              alt="HANA Liquidity Reserve"
              referrerPolicy="no-referrer"
              className="h-20 w-20 shrink-0 rounded-2xl object-cover border border-[#FFB800]/50"
            />
            <div className="text-xs">
              <p className="font-display text-sm font-extrabold text-[#032B91]">On-Chain Reserve Ratio</p>
              <p className="mt-0.5 text-[#0645C5]">
                Every HANA buy strengthens the USDT liquidity floor, while every sell permanently reduces supply.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 2 Cards: Token Distribution & Price History */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Token Distribution"
          subtitle="Allocation data is governed by the connected liquidity contract"
          icon={<PieChart className="h-4 w-4" />}
        >
          <div className="flex items-center gap-3 rounded-xl border border-[#0755E8]/20 bg-white/90 p-3.5 text-xs text-[#032B91]">
            <Info className="h-5 w-5 shrink-0 text-[#0755E8]" />
            <span>
              No static allocation percentages are displayed because supply adjusts dynamically via staking rewards
              and 100% sell-side token burns.
            </span>
          </div>
        </SectionCard>

        <SectionCard
          title="Price History"
          subtitle="Live contract reserve pricing"
          icon={<BarChart3 className="h-4 w-4" />}
        >
          <div className="flex items-center gap-3 rounded-xl border border-[#0755E8]/20 bg-white/90 p-3.5 text-xs text-[#032B91]">
            <Info className="h-5 w-5 shrink-0 text-[#0755E8]" />
            <span>
              Current live on-chain price: <strong>${hanaPrice.toFixed(4)} USDT</strong> (derived from $
              {usdtReserve.toLocaleString()} USDT / {hanaPool.toLocaleString()} HANA pool).
            </span>
          </div>
        </SectionCard>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={mode === 'buy' ? 'Confirm HANA Purchase' : 'Confirm HANA Sell & Burn'}
        description={
          mode === 'buy'
            ? `Swap $${parsedAmount.toFixed(2)} USDT for ≈ ${estimatedReceive.toFixed(2)} HANA at $${hanaPrice.toFixed(4)}.`
            : `Sell and permanently burn ${parsedAmount.toFixed(2)} HANA for ≈ $${estimatedReceive.toFixed(2)} USDT.`
        }
        confirmLabel={mode === 'buy' ? 'Buy HANA' : 'Sell & Burn HANA'}
        onConfirm={() => {
          if (mode === 'buy') buyHana(parsedAmount);
          else sellHana(parsedAmount);
        }}
      />
    </div>
  );
}
