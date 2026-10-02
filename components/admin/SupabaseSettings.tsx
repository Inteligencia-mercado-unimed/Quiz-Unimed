'use client';

import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertTriangle, RefreshCw, Copy, Check, ExternalLink, ShieldCheck, Zap } from 'lucide-react';

interface SupabaseSettingsProps {
  adminEmail: string;
}

export function SupabaseSettings({ adminEmail }: SupabaseSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [status, setStatus] = useState<{
    configured: boolean;
    connected: boolean;
    url?: string;
    error?: string;
    envVariablesDetected?: {
      SUPABASE_URL: boolean;
      SUPABASE_SECRET_KEY: boolean;
      SUPABASE_PUBLISHABLE_KEY: boolean;
      SUPABASE_JWKS_URL: boolean;
    };
    tables?: Record<string, boolean>;
  } | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/admin/supabase-status', {
        headers: { 'x-admin-email': adminEmail },
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Erro ao verificar status do Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    async function initStatus() {
      try {
        const res = await fetch('/api/admin/supabase-status', {
          headers: { 'x-admin-email': adminEmail },
        });
        if (!isCancelled && res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch (err) {
        console.error('Erro ao verificar status do Supabase:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }
    initStatus();
    return () => {
      isCancelled = true;
    };
  }, [adminEmail]);

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/admin/supabase-status', {
        method: 'POST',
        headers: { 'x-admin-email': adminEmail },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncMessage({ text: data.message || 'Sincronizado com sucesso!', type: 'success' });
        checkStatus();
      } else {
        setSyncMessage({ text: data.message || data.error || 'Erro ao sincronizar', type: 'error' });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setSyncMessage({ text: `Falha na requisição: ${errorMsg}`, type: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  const handleCopySqlInstructions = () => {
    const sqlUrl = window.location.origin + '/supabase/schema.sql';
    navigator.clipboard.writeText(
      `-- Acesse o painel do Supabase -> SQL Editor e execute o script schema.sql disponível no projeto.`
    );
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00995D] flex items-center justify-center shrink-0 border border-emerald-100 shadow-2xs">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Banco de Dados em Nuvem
              </span>
              {status?.connected ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                  <CheckCircle2 className="w-3 h-3 text-[#00995D]" /> CONECTADO
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                  <AlertTriangle className="w-3 h-3 text-[#F47920]" /> PENDENTE CONFIGURAÇÃO
                </span>
              )}
            </div>
            <h3 className="text-xl font-black text-gray-900 mt-1">
              Conexão com o Supabase
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              Persistência direta na nuvem para tentativas de quiz, respostas, setores e perguntas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={checkStatus}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold border border-gray-200 shadow-2xs transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#00995D]' : ''}`} />
            <span>Verificar Conexão</span>
          </button>

          <button
            onClick={handleSyncNow}
            disabled={syncing || !status?.configured}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold shadow-xs transition-all active:scale-95 ${
              status?.configured
                ? 'bg-[#00995D] hover:bg-[#007B4B] text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Zap className={`w-4 h-4 ${syncing ? 'animate-bounce' : ''}`} />
            <span>{syncing ? 'Sincronizando...' : 'Sincronizar Dados Agora'}</span>
          </button>
        </div>
      </div>

      {syncMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 animate-fade-in ${
            syncMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          {syncMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#00995D] shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{syncMessage.text}</span>
        </div>
      )}

      {/* Grid: Variáveis de Ambiente & Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Variáveis detectadas */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100">
          <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00995D]" />
            <span>Variáveis de Ambiente (.env)</span>
          </h4>

          <div className="space-y-3 font-mono text-xs">
            {/* SUPABASE_URL */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div>
                <span className="font-bold text-gray-900">SUPABASE_URL</span>
                <p className="text-[10px] text-gray-500 font-sans mt-0.5">
                  {status?.url || 'https://[projeto].supabase.co'}
                </p>
              </div>
              {status?.envVariablesDetected?.SUPABASE_URL ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Definido
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">
                  Não configurado
                </span>
              )}
            </div>

            {/* SUPABASE_SECRET_KEY */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div>
                <span className="font-bold text-gray-900">SUPABASE_SECRET_KEY</span>
                <p className="text-[10px] text-gray-500 font-sans mt-0.5">
                  Chave de serviço (Service Role) para gravação segura
                </p>
              </div>
              {status?.envVariablesDetected?.SUPABASE_SECRET_KEY ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Definido
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  Aguardando chave
                </span>
              )}
            </div>

            {/* SUPABASE_PUBLISHABLE_KEY */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div>
                <span className="font-bold text-gray-900">SUPABASE_PUBLISHABLE_KEY</span>
                <p className="text-[10px] text-gray-500 font-sans mt-0.5">
                  Chave pública anon
                </p>
              </div>
              {status?.envVariablesDetected?.SUPABASE_PUBLISHABLE_KEY ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Definido
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold">
                  Opcional
                </span>
              )}
            </div>

            {/* SUPABASE_JWKS_URL */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div>
                <span className="font-bold text-gray-900">SUPABASE_JWKS_URL</span>
                <p className="text-[10px] text-gray-500 font-sans mt-0.5">
                  Endpoint de verificação de tokens JWT
                </p>
              </div>
              {status?.envVariablesDetected?.SUPABASE_JWKS_URL ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Definido
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold">
                  Opcional
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Status das Tabelas no Supabase */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100">
          <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-[#00995D]" />
            <span>Tabelas no Supabase</span>
          </h4>

          {status?.tables ? (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(status.tables).map(([table, ok]) => (
                <div
                  key={table}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    ok
                      ? 'bg-emerald-50/50 border-emerald-200/60 text-emerald-900'
                      : 'bg-gray-50 border-gray-200/60 text-gray-500'
                  }`}
                >
                  <span className="font-bold font-mono">{table}</span>
                  {ok ? (
                    <CheckCircle2 className="w-4 h-4 text-[#00995D]" />
                  ) : (
                    <span className="text-[10px] font-semibold text-gray-400">Pendente</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-gray-50 text-center text-xs text-gray-500">
              Aguardando configuração das variáveis no arquivo .env
            </div>
          )}

          {status?.error && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 text-amber-900 text-xs border border-amber-200">
              <p className="font-semibold">{status.error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Como configurar passo a passo */}
      <div className="bg-gradient-to-br from-[#005C40] to-[#00995D] rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <h4 className="text-lg font-black tracking-tight mb-2">
          Como vincular seu Supabase em 2 passos rápidos:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 text-xs sm:text-sm text-emerald-50">
          <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
            <div className="flex items-center gap-2 font-black text-white text-base mb-2">
              <span className="w-6 h-6 rounded-full bg-[#B1D34B] text-[#005C40] flex items-center justify-center text-xs font-black">
                1
              </span>
              <span>Criar as Tabelas no Supabase</span>
            </div>
            <p className="mb-3 text-emerald-100">
              No painel do Supabase, clique em <strong>SQL Editor</strong> &gt; <strong>New Query</strong>, cole o script <code>supabase/schema.sql</code> e clique em <strong>Run</strong>.
            </p>
            <button
              onClick={handleCopySqlInstructions}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-[#B1D34B]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copiado!' : 'Copiar Instrução'}</span>
            </button>
          </div>

          <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
            <div className="flex items-center gap-2 font-black text-white text-base mb-2">
              <span className="w-6 h-6 rounded-full bg-[#B1D34B] text-[#005C40] flex items-center justify-center text-xs font-black">
                2
              </span>
              <span>Preencher o arquivo .env</span>
            </div>
            <p className="text-emerald-100 mb-2">
              Em <strong>Project Settings &gt; API</strong> no Supabase, copie a URL e a <strong>service_role (secret)</strong> e adicione no arquivo <code>.env</code>:
            </p>
            <pre className="p-2.5 rounded-lg bg-black/30 font-mono text-[11px] text-emerald-200 overflow-x-auto">
{`SUPABASE_URL="https://seu-projeto.supabase.co"
SUPABASE_SECRET_KEY="sua-chave-service-role"`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
