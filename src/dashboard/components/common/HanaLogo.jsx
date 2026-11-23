import React from 'react';
import { HANA_IMAGES } from '../../assets/images';

export function HanaLogo({ compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center justify-center select-none">
        <img
          src={HANA_IMAGES.tokenCoin}
          alt="HANA Decentralized Token"
          referrerPolicy="no-referrer"
          className="h-11 w-11 rounded-full object-contain drop-shadow-[0_4px_12px_rgba(255,184,0,0.45)]"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center select-none">
      <img
        src={HANA_IMAGES.brandLogo}
        alt="HANA Decentralized Token"
        referrerPolicy="no-referrer"
        className="h-12 w-auto max-w-[205px] object-contain drop-shadow-[0_3px_10px_rgba(0,0,0,0.35)]"
      />
    </div>
  );
}
