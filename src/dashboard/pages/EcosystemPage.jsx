import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  CreditCard,
  Gamepad2,
  Globe2,
  Layers,
  LayoutGrid,
  Rocket,
  SlidersHorizontal,
  TrendingUp,
  X,
} from 'lucide-react';
import { useHana } from '../context/HanaContext';
import { HANA_IMAGES } from '../assets/images';
import { GoldButton, BlueButton } from '../components/common/UiPrimitives';
import CircularGallery from '../components/common/CircularGallery';

const ECOSYSTEM_PRODUCTS = [
  {
    id: 'predict',
    category: 'Blockchain Prediction',
    filterKey: 'prediction',
    brandPrefix: 'HANA',
    title: 'Predict',
    shortNav: 'Predict',
    connectedTitle: 'HANA Predict',
    launchPhase: 'Phase 1 · Q1 2027',
    icon: TrendingUp,
    image: HANA_IMAGES.productPredict,
    summary: 'Blockchain-based real-world predictions with fair, verifiable outcomes.',
    comingSoonNote:
      'Our decentralized prediction market engine and on-chain oracle settlement layer are undergoing final security audits before public release.',
    features: [
      'Decentralized Predictions',
      'Transparent Outcomes',

    ],
    accessRequirement: 'HANA Wallet & Active Stakers',
    synergyActionLabel: 'Stake HANA Meantime',
    synergyRoute: '/staking',
  },
  {
    id: 'gaming',
    category: 'Play-to-Earn',
    filterKey: 'gaming',
    brandPrefix: 'HANA',
    title: 'Gaming',
    shortNav: 'Gaming',
    connectedTitle: 'HANA Gaming',
    launchPhase: 'Phase 2 · Q1 2027',
    icon: Gamepad2,
    image: HANA_IMAGES.productGaming,
    summary: 'A next-generation earning ecosystem with play-to-earn opportunities.',
    comingSoonNote:
      'Interactive Web3 tournaments, player reward pools, and BEP-721 digital game assets are currently in closed beta testing.',
    features: [
      'Interactive Gaming',
      'Play-to-Earn Rewards',

    ],
    accessRequirement: 'HANA Community Members',
    synergyActionLabel: 'Explore HANA Tokenomics',
    synergyRoute: '/token',
  },
  {
    id: 'ai-wallet',
    category: 'AI Powered',
    filterKey: 'ai',
    brandPrefix: 'HANA AI',
    title: 'DEX Wallet',
    shortNav: 'AI & Wallet',
    connectedTitle: 'HANA AI',
    launchPhase: 'Phase 2 · Q2 2027',
    icon: Cpu,
    image: HANA_IMAGES.productAiWallet,
    summary: 'AI-powered virtual intelligence that brings real utility across the HANA ecosystem.',
    comingSoonNote:
      'Multi-chain non-custodial key vaults, smart swap routing, and automated portfolio intelligence are being finalized for launch.',
    features: [
      'Smart AI Assistant',
      'Multi-Chain Wallet',

    ],
    accessRequirement: 'All Ecosystem Users',
    synergyActionLabel: 'View Token Swap',
    synergyRoute: '/token',
  },
  {
    id: 'dachi-card',
    category: 'Digital Payments',
    filterKey: 'payments',
    brandPrefix: 'HANA',
    title: 'Dachi Card',
    shortNav: 'Digital Payments',
    connectedTitle: 'HANA Dachi Card',
    launchPhase: 'Phase 3 · Q2 2027',
    icon: CreditCard,
    image: HANA_IMAGES.productDachiCard,
    summary: 'Seamlessly crypto-based payments for everyday use worldwide.',
    comingSoonNote:
      'Global virtual and physical card issuance with real-time USDT and HANA balance conversion is in banking partner onboarding.',
    features: [
      'Global Payments',

      'Crypto Utility',
    ],
    accessRequirement: 'Verified HANA Accounts',
    synergyActionLabel: 'Check Wallet & Withdraw',
    synergyRoute: '/withdraw',
  },
  {
    id: 'blockchain',
    category: 'Blockchain Infrastructure',
    filterKey: 'blockchain',
    brandPrefix: 'HANA',
    title: 'Blockchain',
    shortNav: 'Blockchain',
    connectedTitle: 'HANA Blockchain',
    launchPhase: 'Phase 3 · Q3 2027',
    icon: Layers,
    image: HANA_IMAGES.productBlockchain,
    summary: 'The foundational layer of HANA, ensuring security, transparency, and true ownership.',
    comingSoonNote:
      'Dedicated EVM-compatible Layer-1 validator nodes, public explorer tooling, and cross-ecosystem settlement bridges are in active testnet.',
    features: [
      'Secure Infrastructure',

      'Decentralized Network',
    ],
    accessRequirement: 'DAO & Validator Participants',
    synergyActionLabel: 'Explore DAO Program',
    synergyRoute: '/dao',
    featuredCenter: true,
  },
];

const FILTER_TABS = [
  { key: 'all', label: 'All Products' },
  { key: 'prediction', label: 'Predict' },
  { key: 'gaming', label: 'Gaming' },
  { key: 'ai', label: 'AI & Wallet' },
  { key: 'payments', label: 'Digital Payments' },
  { key: 'blockchain', label: 'Blockchain' },
];

const CONNECTED_ORDER = ['predict', 'gaming', 'blockchain', 'ai-wallet', 'dachi-card'];

function ProductVisual({ src, alt, Icon, className = 'aspect-[4/3] w-full' }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-[#0645C5] via-[#032B91] to-[#061B50] ${className}`}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#FFD700]/40 bg-[#041540]/80 text-[#FFD700] shadow-lg">
          <Icon className="h-8 w-8" />
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`object-cover object-center ${className}`}
    />
  );
}

export function EcosystemPage() {
  const navigate = useNavigate();
  const { hanaBalance, totalStaked } = useHana();

  const [activeFilter, setActiveFilter] = useState('all');
  const [comingSoonProductId, setComingSoonProductId] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'carousel'
  const [activeProductIndex, setActiveProductIndex] = useState(0);
  const galleryRef = useRef(null);

  const galleryItems = useMemo(() => {
    return ECOSYSTEM_PRODUCTS.map((product) => ({
      id: product.id,
      image: product.image,
      text: product.connectedTitle,
      description: product.summary,
      product,
      onExplore: (item) => {
        setComingSoonProductId(item.id);
      },
    }));
  }, []);

  useEffect(() => {
    if (!comingSoonProductId) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setComingSoonProductId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [comingSoonProductId]);

  const visibleProducts =
    activeFilter === 'all'
      ? ECOSYSTEM_PRODUCTS
      : ECOSYSTEM_PRODUCTS.filter((p) => p.filterKey === activeFilter);

  const selectedProduct = ECOSYSTEM_PRODUCTS.find((p) => p.id === comingSoonProductId) || null;
  const connectedProducts = CONNECTED_ORDER.map((id) =>
    ECOSYSTEM_PRODUCTS.find((p) => p.id === id)
  ).filter(Boolean);

  const scrollToProducts = (filterKey = 'all') => {
    setActiveFilter(filterKey);
    const el = document.getElementById('ecosystem-products');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Clean Panoramic Hero Banner */}
      <section className="hana-hero-banner relative overflow-hidden rounded-2xl p-6 text-white sm:p-8 lg:p-10">
        <img
          src={HANA_IMAGES.ecosystemHero}
          alt="HANA Connected Ecosystem Globe and Skyline"
          referrerPolicy="no-referrer"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#031F6B]/95 via-[#032B91]/80 to-[#032B91]/20 lg:w-3/4" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#032B91]/25 via-transparent to-[#031F6B]/55" />

        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl space-y-4">


            <h1 className="font-display text-3xl font-extrabold leading-[1.12] tracking-tight text-balance drop-shadow-[0_2px_12px_rgba(3,43,145,0.7)] sm:text-4xl lg:text-[42px]">
              One Ecosystem.{' '}
              <span className="block text-[#FFD700] sm:inline">
                Five Powerful Innovations.
              </span>
            </h1>

            <p className="max-w-xl text-sm font-medium leading-relaxed text-blue-50/95 sm:text-base">
              Explore the next generation of blockchain, AI, gaming and digital finance — unified by the HANA token economy.
            </p>


          </div>

          <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">

            <GoldButton onClick={() => scrollToProducts('all')} className="px-6 py-3">
              Explore Our Products
              <ArrowRight className="h-4 w-4" />
            </GoldButton>
          </div>
        </div>
      </section>

      {/* 2. Section Header & View Toggle */}
      <div
        id="ecosystem-products"
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center rounded-xl border border-[#0755E8]/20 bg-white/90 px-4 py-3 shadow-xs"
      >
        <div>
          <h2 className="font-display text-xl font-extrabold tracking-tight text-[#032B91] sm:text-2xl">
            Five Core Ecosystem Products
          </h2>
          <p className="text-xs font-medium text-[#0645C5]/75 sm:text-sm">
            Click any product card to preview upcoming launch details and enable early-access alerts.
          </p>
        </div>

        {/* Grid / Carousel toggle */}
        <div className="flex items-center gap-1 rounded-xl border border-[#0755E8]/20 bg-[#EAF4FF] p-1 shadow-xs shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-pressed={viewMode === 'grid'}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${viewMode === 'grid'
                ? 'bg-gradient-to-r from-[#0755E8] to-[#032B91] text-white shadow-sm'
                : 'text-[#032B91]/80 hover:bg-white/70 hover:text-[#032B91]'
              }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode('carousel')}
            aria-pressed={viewMode === 'carousel'}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${viewMode === 'carousel'
                ? 'bg-gradient-to-r from-[#0755E8] to-[#032B91] text-white shadow-sm'
                : 'text-[#032B91]/80 hover:bg-white/70 hover:text-[#032B91]'
              }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Carousel
          </button>
        </div>
      </div>

      {/* 3D Circular Gallery View */}
      {viewMode === 'carousel' && (
        <div className="hana-dark-card relative overflow-hidden rounded-2xl py-6 sm:py-8 flex flex-col items-center">
          {/* Ambient background glows */}
          <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[32rem] -translate-x-1/2 rounded-full bg-[#0755E8]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 left-1/2 h-44 w-96 -translate-x-1/2 rounded-full bg-[#FFD700]/15 blur-3xl" />

          {/* 3D WebGL Circular Gallery Canvas Stage */}
          <div className="relative z-10 w-full" style={{ height: '580px' }}>
            <CircularGallery
              ref={galleryRef}
              items={galleryItems}
              bend={3}
              textColor="#ffffff"
              borderRadius={0.05}
              scrollEase={0.05}
              onItemClick={(item, index) => {
                setActiveProductIndex(index);
              }}
              onActiveChange={(index) => {
                setActiveProductIndex(index);
              }}
              itemSize={1}
              itemAspect={0.78}
              gap={0.26}
              wave={1}
              fadeEdges={0.12}
              shadow={0.25}
              scrollSpeed={0}
              autoScroll={0}
              enableWheel={false}
              enableDrag={false}
              snap
              grayscale={false}
              showTitles
              openOnClick
              intro
            />
          </div>

          {/* Left and Right Arrow Navigation Controls */}
          <div className="relative z-20 mt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => galleryRef.current?.prev()}
              aria-label="Previous product"
              className="group flex h-11 w-11 items-center justify-center rounded-full border border-[#27D9FF]/40 bg-[#041F63]/80 text-white backdrop-blur-md transition-all duration-200 hover:scale-110 hover:border-[#FFD700] hover:bg-[#0755E8] hover:text-[#FFD700] active:scale-95 cursor-pointer shadow-[0_4px_18px_rgba(7,85,232,0.35)]"
            >
              <ChevronLeft className="h-6 w-6 stroke-[2.2] transition-transform group-hover:-translate-x-0.5" />
            </button>

            <button
              type="button"
              onClick={() => galleryRef.current?.next()}
              aria-label="Next product"
              className="group flex h-11 w-11 items-center justify-center rounded-full border border-[#27D9FF]/40 bg-[#041F63]/80 text-white backdrop-blur-md transition-all duration-200 hover:scale-110 hover:border-[#FFD700] hover:bg-[#0755E8] hover:text-[#FFD700] active:scale-95 cursor-pointer shadow-[0_4px_18px_rgba(7,85,232,0.35)]"
            >
              <ChevronRight className="h-6 w-6 stroke-[2.2] transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Polished Five Product Cards Grid */}
      {viewMode === 'grid' && (
        <div
          className={`grid gap-5 ${visibleProducts.length === 1
              ? 'grid-cols-1 max-w-md'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
            }`}
        >
          {visibleProducts.map((product) => {
            const Icon = product.icon;
            return (
              <article
                key={product.id}
                onClick={() => setComingSoonProductId(product.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setComingSoonProductId(product.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Open ${product.connectedTitle} Coming Soon preview`}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#27D9FF]/45 bg-gradient-to-b from-[#0A4FD4] via-[#042A89] to-[#041442] text-white shadow-[0_14px_34px_rgba(3,43,145,0.28)] transition-all duration-200 hover:-translate-y-1.5 hover:border-[#FFD700]/85 hover:shadow-[0_20px_42px_rgba(7,85,232,0.42)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700] cursor-pointer"
              >
                {/* Top Specular Gold & Cyan Rim */}
                <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[2px] bg-gradient-to-r from-transparent via-[#FFE98A] to-transparent opacity-80 transition-opacity group-hover:opacity-100" />

                {/* Product 3D Visual Stage */}
                <div className="relative overflow-hidden bg-[#031F6B]">
                  <ProductVisual
                    src={product.image}
                    alt={`${product.brandPrefix} ${product.title}`}
                    Icon={Icon}
                    className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-[1.05]"
                  />
                  {/* Seamless gradient blend into the royal-blue card body */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#042A89] via-[#042A89]/25 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#031F6B]/55 to-transparent" />

                  {/* Title overlay — top left on image */}
                  <div className="absolute left-0 top-0 z-20 px-3 pt-3">
                    <p className="font-display text-[10px] font-extrabold tracking-widest text-[#FFD700] uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                      {product.brandPrefix}
                    </p>
                    <h3 className="font-display text-[18px] font-extrabold leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]">
                      {product.title}
                    </h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="relative z-10 -mt-3 flex flex-1 flex-col justify-between px-4 pb-5 pt-2 sm:px-5">
                  <div className="space-y-3">
                    {/* Product Title Lockup — hidden, now shown on image */}
                    <div className="flex items-start justify-between gap-2" />

                    {/* Description */}
                    <p className="min-h-[40px] text-xs leading-relaxed text-blue-100/90">
                      {product.summary}
                    </p>

                    {/* Hairline divider */}
                    <div className="h-px bg-gradient-to-r from-[#27D9FF]/35 via-white/15 to-transparent" />

                    {/* 3 Feature Checkmarks */}
                    <ul className="space-y-2 pt-0.5">
                      {product.features.map((feat) => (
                        <li key={feat} className="flex items-center gap-2 text-xs font-semibold text-blue-50">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#FFD700]" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Primary CTA */}
                  <div className="pt-5">
                    <GoldButton
                      onClick={(e) => {
                        e.stopPropagation();
                        setComingSoonProductId(product.id);
                      }}
                      className="w-full py-2.5 text-xs"
                    >
                      Explore Product
                      <ArrowRight className="h-3.5 w-3.5" />
                    </GoldButton>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 4. Bottom "One Connected Ecosystem" Strip + "The Future Is Connected." Callout */}
      {/* <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch">
        <section className="hana-dark-card relative overflow-hidden rounded-2xl p-5 text-white lg:col-span-8 sm:p-6">
          <div className="pointer-events-none absolute -bottom-16 left-1/2 h-40 w-3/4 -translate-x-1/2 rounded-full bg-[#27D9FF]/15 blur-3xl" />

          <div className="relative z-10 text-center">
            <p className="font-display text-base font-extrabold tracking-wide text-[#FFE98A] uppercase sm:text-lg">
              One Connected Ecosystem
            </p>
            <p className="mt-1 text-xs font-medium text-blue-100/85 sm:text-sm">
              Five innovative products. One unified vision.
            </p>
          </div>

          <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5 sm:items-end">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-10 left-10 top-1/2 hidden h-0.5 -translate-y-3 bg-gradient-to-r from-[#27D9FF]/30 via-[#FFD700]/80 to-[#27D9FF]/30 sm:block"
            />

            {connectedProducts.map((item) => {
              const Icon = item.icon;
              const isCenter = Boolean(item.featuredCenter);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setComingSoonProductId(item.id)}
                  className={`group relative z-10 flex flex-col items-center rounded-2xl border p-3 text-center transition-all duration-200 hover:-translate-y-1 cursor-pointer ${
                    isCenter
                      ? 'col-span-2 sm:col-span-1 border-[#FFD700]/80 bg-gradient-to-b from-[#0755E8]/80 to-[#041540]/95 shadow-[0_8px_24px_rgba(255,184,0,0.28)]'
                      : 'border-[#27D9FF]/30 bg-[#041540]/80 hover:border-[#FFD700]/60'
                  }`}
                >
                  <div
                    className={`relative overflow-hidden rounded-full border-2 shadow-md ${
                      isCenter
                        ? 'h-16 w-16 border-[#FFD700]'
                        : 'h-13 w-13 border-[#27D9FF]/70 group-hover:border-[#FFD700]'
                    }`}
                  >
                    <ProductVisual
                      src={item.image}
                      alt={item.connectedTitle}
                      Icon={Icon}
                      className="h-full w-full"
                    />
                  </div>
                  <span
                    className={`mt-2.5 font-display text-xs font-extrabold leading-tight ${
                      isCenter ? 'text-[#FFE98A]' : 'text-white group-hover:text-[#FFE98A]'
                    }`}
                  >
                    {item.connectedTitle}
                  </span>
                  <span className="mt-0.5 text-[10px] font-medium text-blue-200/80">
                    {item.shortNav}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="hana-dark-card relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 text-white lg:col-span-4">
          <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-[#FFD700]/20 blur-2xl" />
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-[#27D9FF] uppercase">
              <Globe2 className="h-4 w-4 text-[#FFD700]" />
              <span>Unified HANA Utility</span>
            </div>
            <h3 className="font-display text-2xl font-extrabold leading-tight text-balance">
              The Future <span className="text-[#FFD700]">Is Connected.</span>
            </h3>
            <p className="text-xs leading-relaxed text-blue-100/90 sm:text-sm">
              Explore the HANA ecosystem and discover a new world of innovation powered by smart-contract staking and cross-product rewards.
            </p>
          </div>

          <div className="relative z-10 mt-5 flex flex-col gap-2.5">
            <GoldButton onClick={() => navigate('/dashboard/staking')} className="w-full py-3">
              Join HANA Ecosystem
              <ArrowRight className="h-4 w-4" />
            </GoldButton>
            <BlueButton onClick={() => navigate('/dashboard/token')} className="w-full py-2.5 text-xs">
              View HANA Tokenomics
            </BlueButton>
          </div>
        </section>
      </div> */}



      {/* 6. Minimal Coming Soon Popup Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#03123A]/75 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="coming-soon-modal-title"
          onClick={() => setComingSoonProductId(null)}
        >
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-[#FFD700]/70 bg-gradient-to-b from-[#0846C4] via-[#042578] to-[#04133D] p-7 text-center text-white shadow-[0_24px_70px_rgba(3,18,58,0.85)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Design Accent 1: Top gold specular rim + subtle ambient radial glow */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#FFE98A] to-transparent" />
            <div className="pointer-events-none absolute -top-16 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-[#27D9FF]/25 blur-3xl" />

            {/* Close button */}
            <button
              type="button"
              onClick={() => setComingSoonProductId(null)}
              className="absolute top-3.5 right-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-[#03123A]/70 text-white transition hover:border-[#FFD700] hover:bg-[#03123A] cursor-pointer"
              aria-label="Close Coming Soon popup"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Design Accent 2: Glowing Circular Product Medallion */}
            <div className="relative mx-auto mt-1 flex h-24 w-24 items-center justify-center">
              <div className="pointer-events-none absolute -inset-2 rounded-full border border-[#FFD700]/40" />
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-[#FFD700] bg-[#031F6B] shadow-[0_10px_30px_rgba(255,184,0,0.35)]">
                <ProductVisual
                  src={selectedProduct.image}
                  alt={selectedProduct.connectedTitle}
                  Icon={selectedProduct.icon}
                  className="h-full w-full"
                />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-[#FFE98A] bg-gradient-to-br from-[#FFE98A] to-[#FFB800] text-[#061B50] shadow-md">
                <Rocket className="h-4 w-4" />
              </div>
            </div>

            {/* Product Name + Coming Soon Only */}
            <div className="relative z-10 mt-5 space-y-2">
              <p className="text-xs font-bold tracking-widest text-[#7BE6FF] uppercase">
                {selectedProduct.connectedTitle}
              </p>
              <h3
                id="coming-soon-modal-title"
                className="font-display text-3xl font-extrabold tracking-tight text-[#FFD700] drop-shadow-[0_2px_10px_rgba(255,215,0,0.35)]"
              >
                Coming Soon
              </h3>
            </div>

            <div className="relative z-10 mt-6">
              <GoldButton
                onClick={() => setComingSoonProductId(null)}
                className="w-full py-2.5 text-sm"
              >
                Close
              </GoldButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
