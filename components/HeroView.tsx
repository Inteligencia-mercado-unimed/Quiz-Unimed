'use client';

import React from 'react';
import { Gift, ArrowRight, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { UnimedLogo } from './UnimedLogo';

interface HeroViewProps {
  onStart: () => void;
  prizeDescription?: string;
  campaignCode?: string;
}

export function HeroView({
  onStart,
  prizeDescription = 'O primeiro participante a acertar todas as perguntas ganha um prêmio!',
  campaignCode = 'POL.INT.7.3',
}: HeroViewProps) {
  return (
    <div className="flex-1 flex flex-col justify-between">
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8F5EC] border border-[#00995D]/25 text-[#005C40] text-xs sm:text-sm font-bold shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-[#00995D]" />
              <span>{campaignCode} • Unimed Centro Rondônia</span>
            </div>

            {/* Main Title */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                Pílulas de Integridade: <br />
                <span className="text-[#00995D]">Quiz de Compliance</span>
              </h1>
              <p className="text-base sm:text-lg text-gray-600 font-medium max-w-xl leading-relaxed">
                Teste seus conhecimentos nas pílulas de integridade e fortaleça nossa cultura ética.
              </p>
            </div>

            {/* Special Prize Banner */}
            <div className="bg-gradient-to-r from-[#E8F5EC] via-[#F7FAF8] to-white border border-[#00995D]/25 rounded-2xl p-5 sm:p-6 shadow-sm flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-[#F47920] text-white flex items-center justify-center shadow-md">
                <Gift className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-black tracking-wider text-[#F47920] uppercase block">
                  Premiação Especial
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900 leading-snug">
                  {prizeDescription}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  A conclusão é registrada na planilha com data e hora do servidor. Só a primeira participação de cada pessoa concorre.
                </p>
              </div>
            </div>

            {/* CTA Button and Estimated Time */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
              <button
                onClick={onStart}
                className="inline-flex items-center justify-center gap-3 bg-[#005C40] hover:bg-[#007B4B] text-white text-base sm:text-lg font-bold px-8 py-3.5 rounded-full shadow-lg shadow-emerald-900/20 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Participar do quiz</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-500">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Duração estimada: 3 minutos</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md bg-gradient-to-b from-white to-[#E8F5EC]/40 rounded-3xl p-8 sm:p-10 border border-emerald-100 shadow-xl shadow-emerald-950/5 relative overflow-hidden text-center flex flex-col items-center">
              {/* Soft decorative background circles */}
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#B1D34B]/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-[#00995D]/15 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 w-full flex flex-col items-center space-y-6">
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-emerald-100/80">
                  <UnimedLogo height={52} width={200} />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-black text-[#005C40] tracking-tight">
                    Compromisso com a Ética
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">
                    Conhecimento que transforma nossa prática diária na saúde cooperativa.
                  </p>
                </div>

                {/* Badges */}
                <div className="w-full pt-4 border-t border-emerald-100 grid grid-cols-2 gap-3 text-left">
                  <div className="bg-white p-3 rounded-xl border border-emerald-100/70 shadow-2xs">
                    <span className="text-[11px] font-bold text-[#00995D] block">4 Pílulas</span>
                    <span className="text-xs text-gray-600 font-semibold">Ética & Conduta</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100/70 shadow-2xs">
                    <span className="text-[11px] font-bold text-[#F47920] block">Premiação</span>
                    <span className="text-xs text-gray-600 font-semibold">1º a Gabaritar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-950/10 bg-white/60 py-4 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs font-semibold text-gray-500 gap-2">
          <span>Unimed Centro Rondônia • Pílulas de Integridade</span>
          <span>Campanha {campaignCode}</span>
        </div>
      </footer>
    </div>
  );
}
