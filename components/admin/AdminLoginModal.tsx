'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle, Loader2, X, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { UnimedLogo } from '../UnimedLogo';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export function AdminLoginModal({ isOpen, onClose, onSuccess }: AdminLoginModalProps) {
  const [checking, setChecking] = useState(false);
  const [detectedEmail, setDetectedEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [inputEmail, setInputEmail] = useState('');
  const [showManualVerify, setShowManualVerify] = useState(false);

  // Check Google session when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    async function detectGoogleSession() {
      setChecking(true);
      setStatusMessage(null);
      try {
        const res = await fetch('/api/auth/google-session');
        if (res.ok && !isCancelled) {
          const data = await res.json();
          if (data.email) {
            setDetectedEmail(data.email);
            setIsAdmin(data.isAdmin);
            setStatusMessage(data.message);
            if (data.isAdmin) {
              // Auto-grant access if already identified as admin!
              setTimeout(() => {
                onSuccess(data.email);
              }, 600);
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao checar sessão Google:', err);
      } finally {
        if (!isCancelled) setChecking(false);
      }
    }

    detectGoogleSession();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, onSuccess]);

  if (!isOpen) return null;

  const handleVerifyEmail = async (emailToVerify: string) => {
    setChecking(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/auth/google-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToVerify }),
      });

      const data = await res.json();
      setDetectedEmail(emailToVerify);
      setIsAdmin(data.isAdmin);
      setStatusMessage(data.message);

      if (data.isAdmin) {
        setTimeout(() => {
          onSuccess(emailToVerify);
        }, 500);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setStatusMessage(`Erro ao verificar: ${errorMsg}`);
      setIsAdmin(false);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand & Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <UnimedLogo />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#005C40] text-xs font-bold border border-emerald-200/80 mb-2">
            <Lock className="w-3.5 h-3.5 text-[#00995D]" />
            <span>Acesso Restrito ao Painel</span>
          </div>
          <h3 className="text-xl font-black text-gray-900">
            Validação de Administrador
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-1.5 leading-relaxed">
            Somente contas do Google cadastradas como <strong>ADMIN</strong> no banco de dados da cooperativa possuem acesso. Os demais navegadores podem responder o quiz normalmente.
          </p>
        </div>

        {/* Status Box */}
        {checking ? (
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 text-center space-y-2 mb-6">
            <Loader2 className="w-6 h-6 animate-spin text-[#00995D] mx-auto" />
            <p className="text-xs font-bold text-gray-700">
              Identificando conta Google conectada no navegador...
            </p>
          </div>
        ) : detectedEmail && isAdmin ? (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2 mb-6 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#00995D]" />
              <span className="text-xs font-black uppercase tracking-wider text-[#005C40]">
                Administrador Identificado
              </span>
            </div>
            <p className="text-sm font-mono font-bold text-[#005C40]">
              {detectedEmail}
            </p>
            <p className="text-xs text-emerald-800">
              Acesso autorizado! Carregando painel de controle...
            </p>
          </div>
        ) : detectedEmail && isAdmin === false ? (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2 mb-6 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#F47920]" />
              <span className="text-xs font-black uppercase tracking-wider text-amber-800">
                Acesso Não Permitido
              </span>
            </div>
            <p className="text-xs font-mono font-bold text-gray-800">
              {detectedEmail}
            </p>
            <p className="text-xs text-amber-900 leading-relaxed">
              Esta conta Google não possui perfil de Administrador cadastrado em <strong>User</strong>. Apenas o Quiz está liberado para este navegador.
            </p>
            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                Voltar e Responder o Quiz
              </button>
            </div>
          </div>
        ) : (
          /* Contas Pré-Autorizadas para Conexão Imediata (1-Click) */
          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Contas Google com Acesso de Administrador:
              </span>

              {/* Botão analistavendas.ji@gmail.com */}
              <button
                type="button"
                onClick={() => handleVerifyEmail('analistavendas.ji@gmail.com')}
                disabled={checking}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white hover:bg-emerald-50 border border-gray-200 hover:border-[#00995D] text-left transition-all mb-2 group shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#00995D] flex items-center justify-center font-bold text-xs">
                    G
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-gray-900 group-hover:text-[#005C40] block">
                      analistavendas.ji@gmail.com
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Administrador Ativo
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#00995D] transition-colors" />
              </button>

              {/* Botão rrochapablo@gmail.com */}
              <button
                type="button"
                onClick={() => handleVerifyEmail('rrochapablo@gmail.com')}
                disabled={checking}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white hover:bg-emerald-50 border border-gray-200 hover:border-[#00995D] text-left transition-all group shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#00995D] flex items-center justify-center font-bold text-xs">
                    G
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-gray-900 group-hover:text-[#005C40] block">
                      rrochapablo@gmail.com
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Administrador POL.INT.7.3
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#00995D] transition-colors" />
              </button>
            </div>
          </div>
        )}

        {/* Opção de checar outro e-mail do Google */}
        <div className="border-t border-gray-100 pt-4">
          {!showManualVerify ? (
            <button
              type="button"
              onClick={() => setShowManualVerify(true)}
              className="w-full text-center text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
            >
              Verificar outro e-mail Google cadastrado em User...
            </button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (inputEmail) handleVerifyEmail(inputEmail);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  E-mail da sua conta Google:
                </label>
                <input
                  type="email"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="seu-email@gmail.com"
                  className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00995D]"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={checking}
                  className="flex-1 py-2 rounded-xl bg-[#005C40] hover:bg-[#007B4B] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  {checking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>Validar Permissão</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualVerify(false)}
                  className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
