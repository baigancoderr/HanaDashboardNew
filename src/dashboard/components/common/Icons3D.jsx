import React from 'react';
import { HANA_IMAGES } from '../../assets/images';

export function RankMedalIcon({ tier, size = 44 }) {
  const palette = {
    Starter: { c1: '#E0F2FE', c2: '#38BDF8', c3: '#0284C7', star: '#FFFFFF' },
    Bronze: { c1: '#FDBA74', c2: '#EA580C', c3: '#9A3412', star: '#FFF7ED' },
    Silver: { c1: '#F8FAFC', c2: '#CBD5E1', c3: '#64748B', star: '#FFFFFF' },
    Gold: { c1: '#FFE98A', c2: '#FFD700', c3: '#D89500', star: '#FFFBEB' },
    Platinum: { c1: '#E9D5FF', c2: '#A855F7', c3: '#6B21A8', star: '#FAF5FF' },
    Diamond: { c1: '#BAE6FD', c2: '#0EA5E9', c3: '#0369A1', star: '#F0F9FF' },
    DAO: { c1: '#FFE98A', c2: '#FFB800', c3: '#032B91', star: '#FFD700' },
  };
  const p = palette[tier] || palette.Gold;
  const gradId = `medal-${tier}-${size}`;

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className="shrink-0 drop-shadow-[0_4px_10px_rgba(3,43,145,0.2)]">
      <defs>
        <linearGradient id={gradId} x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={p.c1} />
          <stop offset="50%" stopColor={p.c2} />
          <stop offset="100%" stopColor={p.c3} />
        </linearGradient>
      </defs>
      {/* Laurel leaves left & right */}
      <path d="M12 46C6 39 5 27 11 18C13 24 14 29 14 35C14 40 16 44 20 48L12 46Z" fill="#FFB800" opacity="0.85" />
      <path d="M52 46C58 39 59 27 53 18C51 24 50 29 50 35C50 40 48 44 44 48L52 46Z" fill="#FFB800" opacity="0.85" />
      <circle cx="32" cy="32" r="21" fill={`url(#${gradId})`} stroke="#FFFFFF" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="16" stroke={p.c3} strokeWidth="1.2" strokeOpacity="0.35" fill="none" />
      {tier === 'Diamond' ? (
        <path d="M32 20L42 29L32 45L22 29L32 20Z" fill={p.star} />
      ) : (
        <path
          d="M32 19L35.6 26.8L44 27.9L37.8 33.8L39.4 42.2L32 38.1L24.6 42.2L26.2 33.8L20 27.9L28.4 26.8L32 19Z"
          fill={p.star}
          stroke={p.c3}
          strokeOpacity="0.25"
          strokeWidth="1"
        />
      )}
    </svg>
  );
}

export function BnbIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none">
      <circle cx="16" cy="16" r="15" fill="#F3BA2F" />
      <path
        d="M16 7.5L19.8 11.3L16 15.1L12.2 11.3L16 7.5ZM9.8 13.7L12.1 16L9.8 18.3L7.5 16L9.8 13.7ZM22.2 13.7L24.5 16L22.2 18.3L19.9 16L22.2 13.7ZM16 16.9L19.8 20.7L16 24.5L12.2 20.7L16 16.9ZM16 13.6L18.4 16L16 18.4L13.6 16L16 13.6Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function MetaMaskIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none">
      <path d="M27.5 4.5L17.8 11.7L19.6 7.5L27.5 4.5Z" fill="#E2761B" stroke="#E2761B" strokeLinejoin="round" />
      <path d="M4.5 4.5L14.1 11.8L12.4 7.5L4.5 4.5Z" fill="#E4761B" stroke="#E4761B" strokeLinejoin="round" />
      <path d="M24 21.8L21.4 25.8L27 27.3L28.6 21.9L24 21.8Z" fill="#E4761B" />
      <path d="M3.4 21.9L5 27.3L10.6 25.8L8 21.8L3.4 21.9Z" fill="#E4761B" />
      <path d="M10.3 14.5L8.7 16.9L14.3 17.2L14.1 11.2L10.3 14.5Z" fill="#F6851B" />
      <path d="M21.7 14.5L17.8 11.1L17.7 17.2L23.3 16.9L21.7 14.5Z" fill="#F6851B" />
      <path d="M10.6 25.8L14 24.1L11.1 21.9L10.6 25.8Z" fill="#C0AD9E" />
      <path d="M18 24.1L21.4 25.8L20.9 21.9L18 24.1Z" fill="#C0AD9E" />
    </svg>
  );
}

export function UsdtBadgeIcon({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className="shrink-0">
      <circle cx="24" cy="24" r="22" fill="#26A17B" stroke="#FFFFFF" strokeWidth="2.5" />
      <path
        d="M26.2 21.4V18.2H33.5V13.5H14.5V18.2H21.8V21.4C15.9 21.7 11.5 23 11.5 24.5C11.5 26 15.9 27.3 21.8 27.6V35.5H26.2V27.6C32.1 27.3 36.5 26 36.5 24.5C36.5 23 32.1 21.7 26.2 21.4ZM24 26.5C18.8 26.5 15 25.6 15 24.5C15 23.4 18.8 22.5 24 22.5C29.2 22.5 33 23.4 33 24.5C33 25.6 29.2 26.5 24 26.5Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function HanaCoinBadgeIcon({ size = 40 }) {
  return (
    <img
      src={HANA_IMAGES.tokenCoin}
      alt="HANA Token"
      referrerPolicy="no-referrer"
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full object-contain drop-shadow-[0_4px_10px_rgba(255,184,0,0.45)]"
    />
  );
}

export function ReferralQRCode({ value, size = 108 }) {
  const grid = 15;
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const isFinder = (r, c) => {
    const inTopLeft = r < 5 && c < 5;
    const inTopRight = r < 5 && c >= grid - 5;
    const inBottomLeft = r >= grid - 5 && c < 5;
    if (inTopLeft || inTopRight || inBottomLeft) {
      const lr = r >= grid - 5 ? r - (grid - 5) : r;
      const lc = c >= grid - 5 ? c - (grid - 5) : c;
      if (lr === 0 || lr === 4 || lc === 0 || lc === 4) return true;
      if (lr === 2 && lc === 2) return true;
      return false;
    }
    return null;
  };

  const cells = [];
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const finder = isFinder(r, c);
      if (finder === true) {
        cells.push({ r, c });
      } else if (finder === null) {
        if (r >= 5 && r <= 9 && c >= 5 && c <= 9) continue;
        const bit = ((hash >>> ((r * 3 + c * 7) % 24)) ^ (r * 13 + c * 17)) & 1;
        if (bit === 1) cells.push({ r, c });
      }
    }
  }

  return (
    <div
      className="relative inline-flex items-center justify-center rounded-xl border border-[#0755E8]/25 bg-white p-2 shadow-sm"
      style={{ width: size, height: size }}
      aria-label={`Referral QR code for ${value}`}
    >
      <svg viewBox={`0 0 ${grid} ${grid}`} className="h-full w-full">
        {cells.map((cell) => (
          <rect
            key={`${cell.r}-${cell.c}`}
            x={cell.c}
            y={cell.r}
            width="0.92"
            height="0.92"
            rx="0.18"
            fill="#032B91"
          />
        ))}
      </svg>
      <img
        src={HANA_IMAGES.tokenCoin}
        alt="HANA"
        referrerPolicy="no-referrer"
        className="absolute h-8 w-8 rounded-full bg-[#061B50] object-contain p-0.5 shadow"
      />
    </div>
  );
}
