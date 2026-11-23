import React, { useState } from 'react';
import { CheckCircle2, Clock, ExternalLink, Info, X, AlertTriangle, Loader2 } from 'lucide-react';
import { useHana } from '../../context/HanaContext';

export function GoldButton({
  children,
  onClick,
  disabled,
  className = '',
  type = 'button',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`hana-gold-btn inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold tracking-tight whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export function BlueButton({
  children,
  onClick,
  disabled,
  className = '',
  type = 'button',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`hana-blue-btn inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export function StatCard({
  icon,
  imageSrc,
  label,
  value,
  subtext,
  trend,
  goldAccent = false,
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 transition-transform duration-200 hover:-translate-y-0.5 ${
        goldAccent ? 'hana-card-gold' : 'hana-card'
      }`}
    >
      {/* Sweeping diagonal glossy wave ribbons matching reference stat cards */}
      <svg
        viewBox="0 0 220 90"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="pointer-events-none absolute right-0 bottom-0 h-full w-3/4 opacity-85"
      >
        <defs>
          <linearGradient id={goldAccent ? 'statWaveGold' : 'statWaveBlue'} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={goldAccent ? '#FFE98A' : '#60B5FF'} stopOpacity="0.08" />
            <stop offset="60%" stopColor={goldAccent ? '#FFB800' : '#0755E8'} stopOpacity="0.32" />
            <stop offset="100%" stopColor={goldAccent ? '#D89500' : '#032B91'} stopOpacity="0.58" />
          </linearGradient>
        </defs>
        <path
          d="M50 90 C105 72 145 36 220 6 L220 90 Z"
          fill={`url(#${goldAccent ? 'statWaveGold' : 'statWaveBlue'})`}
        />
        <path
          d="M92 90 C142 74 176 48 220 26 L220 90 Z"
          fill={goldAccent ? '#FFD700' : '#27D9FF'}
          fillOpacity="0.24"
        />
      </svg>

      <div className="relative z-10 flex items-center gap-3.5">
        {imageSrc ? (
          <div
            className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 p-0.5 shadow-[0_6px_16px_rgba(3,43,145,0.25)] ${
              goldAccent
                ? 'border-[#FFD700] bg-gradient-to-br from-[#FFF8DF] to-[#FFB800]'
                : 'border-[#27D9FF] bg-gradient-to-br from-[#EAF4FF] to-[#0755E8]'
            }`}
          >
            <img
              src={imageSrc}
              alt={label}
              referrerPolicy="no-referrer"
              className="h-full w-full rounded-full object-cover"
            />
          </div>
        ) : (
          <div
            className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 shadow-[0_6px_16px_rgba(3,43,145,0.22),inset_0_2px_6px_rgba(255,255,255,0.75)] ${
              goldAccent
                ? 'border-[#FFE98A] bg-gradient-to-br from-[#FFF3B0] via-[#FFD700] to-[#D89500] text-[#061B50]'
                : 'border-[#7DD3FC] bg-gradient-to-br from-[#38BDF8] via-[#0755E8] to-[#032B91] text-white'
            }`}
          >
            <div className="pointer-events-none absolute inset-1 rounded-full bg-gradient-to-b from-white/35 to-transparent" />
            <div className="relative z-10">{icon}</div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-[#032B91]/85">{label}</p>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
            <span className="font-display text-xl font-extrabold tracking-tight text-[#061B50] tabular-nums sm:text-[22px]">
              {value}
            </span>
            {trend && (
              <span className="inline-flex items-center rounded-md bg-emerald-600 px-1.5 py-0.5 text-[11px] font-bold text-white tabular-nums shadow-xs">
                ▲ {trend}
              </span>
            )}
          </div>
          {subtext && <p className="mt-0.5 truncate text-xs font-semibold text-[#0645C5]/80">{subtext}</p>}
        </div>
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  icon,
  rightSlot,
  children,
  className = '',
  dark = false,
}) {
  return (
    <section className={`rounded-2xl p-4 sm:p-5 ${dark ? 'hana-dark-card text-white' : 'hana-card text-[#061B50]'} ${className}`}>
      {(title || rightSlot) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  dark
                    ? 'bg-[#FFB800]/20 text-[#FFD700] border border-[#FFD700]/40'
                    : 'bg-gradient-to-br from-[#FFE98A] to-[#FFB800] text-[#061B50] shadow-sm'
                }`}
              >
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h2 className={`font-display text-base font-bold sm:text-lg ${dark ? 'text-[#FFE98A]' : 'text-[#032B91]'}`}>
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className={`text-xs ${dark ? 'text-blue-100/80' : 'text-[#0645C5]/75'}`}>{subtitle}</p>
              )}
            </div>
          </div>
          {rightSlot && <div className="flex flex-wrap items-center gap-2">{rightSlot}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function HeroBanner({
  title,
  highlight,
  subtitle,
  features,
  ctaLabel,
  onCtaClick,
  imageSrc,
  imageAlt,
  rightBadge,
}) {
  return (
    <div className="hana-hero-banner relative min-h-[205px] overflow-hidden rounded-2xl p-6 text-white sm:min-h-[240px] sm:p-8 lg:min-h-[255px] flex flex-col justify-center">
      {/* Full-width edge-to-edge panoramic 3D banner illustration */}
      <img
        src={imageSrc}
        alt={imageAlt}
        referrerPolicy="no-referrer"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
      />
      {/* Light left-side readability scrim + soft vertical edge blend */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#032B91]/70 via-[#0436AE]/32 to-transparent sm:w-3/5" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#032B91]/35 via-transparent to-[#032B91]/35" />
      {/* Subtle golden & cyan ambient bottom glow */}
      <div className="pointer-events-none absolute -bottom-16 left-0 right-0 h-28 bg-gradient-to-r from-[#FFB800]/20 via-[#27D9FF]/15 to-[#FFD700]/25 blur-2xl" />

      {rightBadge && <div className="relative z-10 mb-3 flex justify-end sm:absolute sm:right-6 sm:top-5 sm:mb-0">{rightBadge}</div>}

      <div className="relative z-10 max-w-xl space-y-3">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-balance drop-shadow-[0_2px_10px_rgba(3,43,145,0.65)] sm:text-4xl">
          {title}{' '}
          {highlight && <span className="text-[#FFD700] drop-shadow-[0_2px_10px_rgba(255,215,0,0.45)]">{highlight}</span>}
        </h1>
        <p className="max-w-xl text-sm font-medium text-blue-50/95 drop-shadow-sm sm:text-base">{subtitle}</p>

        {features && features.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs font-semibold text-blue-50 sm:text-sm">
            {features.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 drop-shadow-sm">
                <span className="text-[#FFD700]">{f.icon}</span>
                <span>{f.label}</span>
              </span>
            ))}
          </div>
        )}

        {ctaLabel && onCtaClick && (
          <div className="pt-2">
            <GoldButton onClick={onCtaClick}>{ctaLabel}</GoldButton>
          </div>
        )}
      </div>
    </div>
  );
}

export function PackageBadge({ tier }) {
  const styles = {
    Starter: 'bg-sky-100 text-sky-900 border-sky-300',
    Bronze: 'bg-orange-100 text-orange-900 border-orange-300',
    Silver: 'bg-slate-100 text-slate-800 border-slate-300',
    Gold: 'bg-amber-100 text-amber-900 border-amber-400',
    Platinum: 'bg-purple-100 text-purple-900 border-purple-300',
    Diamond: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    DAO: 'bg-gradient-to-r from-[#FFE98A] to-[#FFB800] text-[#061B50] border-[#D89500]',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${styles[tier] || styles.Gold}`}>
      {tier}
    </span>
  );
}

export function StatusBadge({ status }) {
  if (status === 'Success' || status === 'Achieved' || status === 'Claimed' || status === 'Active') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {status}
      </span>
    );
  }
  if (status === 'Current' || status === 'Claimable') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400 bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
        <CheckCircle2 className="h-3.5 w-3.5 text-amber-600" />
        {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#0645C5]">
      <Clock className="h-3.5 w-3.5" />
      {status}
    </span>
  );
}

export function ProgressBar({
  percent,
  variant = 'gold',
  showLabel = true,
  height = 'h-3.5',
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className="flex items-center gap-3">
      <div className={`w-full overflow-hidden rounded-full border border-[#0755E8]/20 bg-[#DCEBFF] p-0.5 ${height}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${variant === 'gold' ? 'hana-progress-gold' : 'hana-progress-blue'}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="shrink-0 text-sm font-extrabold text-[#032B91] tabular-nums">{clamped}%</span>
      )}
    </div>
  );
}

export function TxHashChip({ hash }) {
  const { activeContracts } = useHana();
  if (!hash) return <span className="text-xs text-[#0645C5]/60">—</span>;
  const short = `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  return (
    <a
      href={`${activeContracts.explorerBase}/tx/${hash}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-[#FFB800]/70 bg-gradient-to-r from-[#FFF6D1] to-[#FFE89E] px-2.5 py-1 font-mono text-xs font-semibold text-[#061B50] transition hover:brightness-95"
      title={`View ${hash} on BscScan`}
    >
      <span>Tx {short}</span>
      <ExternalLink className="h-3 w-3 text-[#0645C5]" />
    </a>
  );
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm Transaction',
  loadingLabel = 'Processing...',
  onConfirm,
  onClose,
  children,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  if (!open) return null;

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#061B50]/60 p-4 backdrop-blur-sm">
      <div className="hana-card w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-extrabold text-[#032B91]">{title}</h3>
            {description && <p className="mt-1 text-sm text-[#0645C5]/80">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-[#0645C5] hover:bg-blue-100 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full border border-[#0755E8]/30 bg-white px-4 py-2 text-sm font-semibold text-[#032B91] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <GoldButton
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {loadingLabel}
              </>
            ) : confirmLabel}
          </GoldButton>
        </div>
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-20 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 rounded-2xl border p-3.5 shadow-xl backdrop-blur-md ${
            t.variant === 'error'
              ? 'border-red-300 bg-red-50/95 text-red-900'
              : t.variant === 'info'
              ? 'border-[#168BFF]/40 bg-white/95 text-[#032B91]'
              : 'border-[#FFB800]/70 bg-[#FFFDF5]/95 text-[#061B50]'
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {t.variant === 'error' ? (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            ) : t.variant === 'info' ? (
              <Info className="h-5 w-5 text-[#0755E8]" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{t.title}</p>
            {t.description && <p className="mt-0.5 text-xs opacity-80 break-words">{t.description}</p>}
          </div>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="rounded p-1 opacity-60 hover:opacity-100 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
