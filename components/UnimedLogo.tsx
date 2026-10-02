'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface UnimedLogoProps {
  className?: string;
  height?: number;
  width?: number;
}

export function UnimedLogo({ className = 'h-10 w-auto', height = 44, width = 160 }: UnimedLogoProps) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    // Beautiful institutional Unimed brand badge fallback
    return (
      <div className={`flex items-center gap-2.5 bg-[#00995D] text-white px-3.5 py-1.5 rounded-lg shadow-sm font-bold tracking-tight select-none ${className}`}>
        <div className="flex flex-col items-center justify-center leading-none">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-base font-extrabold tracking-wide uppercase">Unimed</span>
          <span className="text-[9px] font-semibold tracking-wider uppercase text-emerald-100 -mt-0.5">Centro Rondônia</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://i.ibb.co/cHhHYqF/Logo-Nova-Unimed-CR.png"
        alt="Unimed Centro Rondônia"
        className="h-10 w-auto object-contain drop-shadow-sm"
        onError={() => setImageError(true)}
      />
    </div>
  );
}
