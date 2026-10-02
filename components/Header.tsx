'use client';

import React from 'react';
import { UnimedLogo } from './UnimedLogo';
import { ShieldCheck, LogOut, LayoutDashboard, Home } from 'lucide-react';

interface HeaderProps {
  currentView: 'home' | 'identify' | 'quiz' | 'result' | 'admin';
  onNavigateHome: () => void;
  onOpenAdmin: () => void;
  adminEmail: string | null;
  onAdminLogout?: () => void;
}

export function Header({
  currentView,
  onNavigateHome,
  onOpenAdmin,
  adminEmail,
  onAdminLogout,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-950/10 shadow-xs">
      <div className="h-1 bg-gradient-to-r from-[#005C40] via-[#00995D] to-[#B1D34B]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={onNavigateHome}
          className="flex items-center gap-3.5 cursor-pointer group transition-opacity hover:opacity-90"
        >
          <UnimedLogo />
          <div className="hidden sm:block h-6 w-px bg-gray-200" />
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-extrabold text-[#005C40] tracking-tight group-hover:text-[#00995D] transition-colors">
              Pílulas de Integridade
            </span>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden md:block">
              Compliance & Ética Corporativa
            </span>
          </div>
        </div>

        {/* Right Nav */}
        <div className="flex items-center gap-2 sm:gap-4" suppressHydrationWarning>
          {adminEmail && (
            <div className="flex items-center gap-2 sm:gap-3 bg-emerald-50 border border-emerald-200/80 rounded-full px-3 py-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-[#00995D]" />
              <span className="font-semibold text-[#005C40] max-w-[140px] sm:max-w-[200px] truncate">
                {adminEmail}
              </span>
              {onAdminLogout && (
                <button
                  onClick={onAdminLogout}
                  title="Desconectar do painel"
                  className="text-gray-400 hover:text-red-600 transition-colors ml-1 p-0.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {currentView === 'admin' ? (
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-[#005C40] bg-[#E8F5EC] hover:bg-emerald-100 transition-all border border-[#00995D]/20 shadow-xs active:scale-95"
            >
              <Home className="w-4 h-4" />
              <span>Voltar ao Quiz</span>
            </button>
          ) : (
            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-[#005C40] bg-[#E8F5EC] hover:bg-emerald-100 transition-all border border-[#00995D]/20 shadow-xs active:scale-95"
            >
              <LayoutDashboard className="w-4 h-4 text-[#00995D]" />
              <span>Área administrativa</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
