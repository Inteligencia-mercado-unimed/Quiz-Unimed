'use client';

import React, { useState } from 'react';
import { Trophy, Award, Clock, Calendar, CheckCircle2, Save, Loader2, AlertCircle, Building2, User, Sparkles } from 'lucide-react';
import { AttemptType, AppConfigType } from '@/lib/types';

interface WinnersManagementProps {
  ranking: (AttemptType & { position: number })[];
  winners: (AttemptType & { position: number })[];
  config: AppConfigType;
  onRefresh: () => Promise<void>;
  adminEmail: string;
}

export function WinnersManagement({
  ranking,
  winners,
  config,
  onRefresh,
  adminEmail,
}: WinnersManagementProps) {
  const [maxWinners, setMaxWinners] = useState(config.maxWinners);
  const [prizeDescription, setPrizeDescription] = useState(config.prizeDescription);
  const [loading, setLoading] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail,
        },
        body: JSON.stringify({
          maxWinners: Number(maxWinners),
          prizeDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar configuração');

      setSavedMsg('Configuração de premiação atualizada com sucesso!');
      setTimeout(() => setSavedMsg(null), 3000);
      await onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Configuration Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-[#F47920]">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900">Configuração da Premiação</h3>
            <p className="text-xs text-gray-500 font-medium">
              Defina a quantidade de vagas de premiação e a descrição do benefício institucional.
            </p>
          </div>
        </div>

        {savedMsg && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{savedMsg}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Quantidade de Ganhadores
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={maxWinners}
              onChange={(e) => setMaxWinners(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00995D]"
              required
            />
          </div>

          <div className="sm:col-span-6">
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Descrição do Prêmio na Tela Inicial
            </label>
            <input
              type="text"
              value={prizeDescription}
              onChange={(e) => setPrizeDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00995D]"
              required
            />
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#005C40] hover:bg-[#007B4B] text-white text-xs sm:text-sm font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Salvar Vagas</span>
            </button>
          </div>
        </form>
      </div>

      {/* Featured Winners Podium / Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-gray-900">Ganhadores em Destaque</h3>
            <p className="text-xs text-gray-500 font-medium">
              Colaboradores que gabaritaram em sua 1ª participação oficial e estão dentro da cota de {config.maxWinners} vaga(s).
            </p>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-black rounded-full border border-amber-300">
            {winners.length} / {config.maxWinners} Ganhador(es)
          </span>
        </div>

        {winners.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 text-gray-400 space-y-2">
            <Trophy className="w-10 h-10 mx-auto text-gray-300 stroke-[1.5]" />
            <p className="text-sm font-semibold text-gray-600">Nenhum colaborador elegível ao prêmio ainda.</p>
            <p className="text-xs text-gray-400">
              O prêmio é atribuído à primeira participação oficial com 100% de acertos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {winners.map((winner, idx) => (
              <div
                key={winner.id}
                className="bg-gradient-to-b from-white to-amber-50/50 rounded-3xl p-6 border-2 border-amber-200 shadow-md relative overflow-hidden"
              >
                {/* Crown badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1 bg-[#F47920] text-white px-3 py-1 rounded-full text-xs font-black shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>#{winner.position}º Ganhador</span>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-[#F47920] mb-4 shadow-2xs">
                  <Trophy className="w-6 h-6" />
                </div>

                <h4 className="text-lg font-black text-gray-900 tracking-tight leading-tight">
                  {winner.userName}
                </h4>

                <div className="flex items-center gap-1.5 text-xs font-bold text-[#007B4B] mt-1 mb-4">
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{winner.sectorName}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-amber-100 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Pontuação</span>
                    <strong className="text-base text-[#00995D] font-black">
                      {winner.score}/{winner.totalQuestions} (100%)
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Tempo Recorde</span>
                    <strong className="text-base text-gray-900 font-black">
                      {formatDuration(winner.durationSeconds)}
                    </strong>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-amber-100/70 text-[11px] text-gray-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>
                    {winner.endTime ? new Date(winner.endTime).toLocaleString('pt-BR') : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Ranking Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h4 className="text-base font-black text-gray-900">Ranking Completo de Participações Oficiais</h4>
            <p className="text-xs text-gray-500">
              Ordenado por: 1º Maior Pontuação → 2º Menor Tempo → 3º Data Mais Antiga
            </p>
          </div>
          <span className="text-xs font-bold text-gray-500">
            {ranking.length} participante(s) oficial(is)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 text-center">Posição</th>
                <th className="py-3.5 px-6">Colaborador</th>
                <th className="py-3.5 px-4">Setor</th>
                <th className="py-3.5 px-4 text-center">Pontuação</th>
                <th className="py-3.5 px-4 text-center">Tempo Total</th>
                <th className="py-3.5 px-6">Data Conclusão</th>
                <th className="py-3.5 px-6 text-center">Premiação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ranking.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Nenhum colaborador no ranking ainda.
                  </td>
                </tr>
              ) : (
                ranking.map((att) => {
                  const isWinner = att.isEligiblePrize;
                  const isTop3 = att.position <= 3;

                  return (
                    <tr
                      key={att.id}
                      className={`hover:bg-gray-50/70 transition-colors ${
                        isWinner ? 'bg-amber-50/40 font-medium' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-black text-xs ${
                            att.position === 1
                              ? 'bg-amber-400 text-amber-950 shadow-xs'
                              : att.position === 2
                              ? 'bg-gray-300 text-gray-800'
                              : att.position === 3
                              ? 'bg-amber-700/30 text-amber-900'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {att.position}º
                        </span>
                      </td>

                      <td className="py-3.5 px-6 font-bold text-gray-900">
                        {att.userName}
                      </td>

                      <td className="py-3.5 px-4 text-gray-600">
                        {att.sectorName}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-extrabold text-[#005C40]">
                          {att.score}/{att.totalQuestions}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-gray-800">
                        {formatDuration(att.durationSeconds)}
                      </td>

                      <td className="py-3.5 px-6 text-gray-500 font-mono text-[11px]">
                        {att.endTime ? new Date(att.endTime).toLocaleString('pt-BR') : '-'}
                      </td>

                      <td className="py-3.5 px-6 text-center">
                        {isWinner ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-[10px] border border-amber-300 shadow-2xs">
                            <Trophy className="w-3 h-3 text-[#F47920]" /> Elegível ao Prêmio
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
