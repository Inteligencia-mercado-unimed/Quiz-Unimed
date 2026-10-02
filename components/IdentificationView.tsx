'use client';

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, AlertCircle, Building2, User } from 'lucide-react';
import { SectorType } from '@/lib/types';

interface IdentificationViewProps {
  sectors: SectorType[];
  onBack: () => void;
  onSubmit: (userName: string, sectorName: string, sectorId?: string) => Promise<void>;
  isLoadingSectors?: boolean;
}

export function IdentificationView({
  sectors,
  onBack,
  onSubmit,
  isLoadingSectors = false,
}: IdentificationViewProps) {
  const [userName, setUserName] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = userName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setError('Por favor, digite seu nome completo (mínimo de 2 caracteres).');
      return;
    }

    if (!selectedSector) {
      setError('Por favor, selecione o seu setor na cooperativa.');
      return;
    }

    const matchedSector = sectors.find((s) => s.name === selectedSector);

    try {
      setIsSubmitting(true);
      await onSubmit(trimmedName, selectedSector, matchedSector?.id);
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar quiz. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl shadow-emerald-950/5 border border-emerald-950/5 p-8 sm:p-10 transition-all">
        {/* Header */}
        <div className="space-y-1 mb-8">
          <span className="text-xs font-black tracking-wider text-[#00995D] uppercase">
            Identificação do Colaborador
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Quem está jogando?
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            Informe seu nome e setor antes de começar. Seu registro será criado na planilha.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome Completo */}
          <div className="space-y-2">
            <label htmlFor="userName" className="block text-sm font-bold text-gray-800">
              Nome completo
            </label>
            <div className="relative">
              <input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ex: Carlos Eduardo da Silva"
                className="w-full px-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#00995D] focus:border-transparent transition-all placeholder:text-gray-400 font-medium"
                required
                disabled={isSubmitting}
                autoFocus
              />
              <User className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Setor */}
          <div className="space-y-2">
            <label htmlFor="sector" className="block text-sm font-bold text-gray-800">
              Setor
            </label>
            <div className="relative">
              <select
                id="sector"
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#00995D] focus:border-transparent transition-all appearance-none cursor-pointer font-medium disabled:opacity-50"
                required
                disabled={isSubmitting || isLoadingSectors}
              >
                <option value="">Selecione seu setor...</option>
                {sectors.map((sec) => (
                  <option key={sec.id} value={sec.name}>
                    {sec.name}
                  </option>
                ))}
              </select>
              <Building2 className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-between gap-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors py-2 px-3 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 bg-[#005C40] hover:bg-[#007B4B] text-white text-sm sm:text-base font-bold px-7 py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Iniciando quiz...</span>
                </>
              ) : (
                <>
                  <span>Começar quiz</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
