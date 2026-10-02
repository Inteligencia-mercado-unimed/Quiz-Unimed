'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  Trophy,
  Copy,
  Download,
  Search,
  Filter,
  BarChart3,
  Layers,
  HelpCircle,
  Award,
  Clock,
  Calendar,
  Eye,
  X,
  RefreshCw,
  Building2,
  FileSpreadsheet,
  Database,
} from 'lucide-react';
import { AttemptType, SectorType, QuestionType, AppConfigType } from '@/lib/types';
import { SectorManagement } from './SectorManagement';
import { QuestionManagement } from './QuestionManagement';
import { WinnersManagement } from './WinnersManagement';
import { SupabaseSettings } from './SupabaseSettings';

interface AdminDashboardProps {
  adminEmail: string;
  onLogout: () => void;
  onBackToQuiz: () => void;
}

export function AdminDashboard({ adminEmail, onLogout, onBackToQuiz }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sectors' | 'questions' | 'winners' | 'supabase'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dashboard Data
  const [metrics, setMetrics] = useState<{
    totalCollaborators: number;
    totalCompleted: number;
    gabaritos: number;
    participacoesAdicionais: number;
    ranking: (AttemptType & { position: number })[];
    winners: (AttemptType & { position: number })[];
    sectorPerformance: Array<{ sector: string; attempts: number; avgScore: string; totalScore: number }>;
    scoreDistribution: Record<number, number>;
    config: AppConfigType;
    allAttempts: AttemptType[];
  } | null>(null);

  const [sectors, setSectors] = useState<SectorType[]>([]);
  const [questions, setQuestions] = useState<QuestionType[]>([]);

  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Attempt detail modal
  const [selectedAttempt, setSelectedAttempt] = useState<AttemptType | null>(null);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      const [metricsRes, sectorsRes, questionsRes] = await Promise.all([
        fetch('/api/admin/metrics', { headers: { 'x-admin-email': adminEmail } }),
        fetch('/api/admin/sectors', { headers: { 'x-admin-email': adminEmail } }),
        fetch('/api/admin/questions', { headers: { 'x-admin-email': adminEmail } }),
      ]);

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data);
      }
      if (sectorsRes.ok) {
        const data = await sectorsRes.json();
        setSectors(data.sectors || []);
      }
      if (questionsRes.ok) {
        const data = await questionsRes.json();
        setQuestions(data.questions || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [metricsRes, sectorsRes, questionsRes] = await Promise.all([
          fetch('/api/admin/metrics', { headers: { 'x-admin-email': adminEmail } }),
          fetch('/api/admin/sectors', { headers: { 'x-admin-email': adminEmail } }),
          fetch('/api/admin/questions', { headers: { 'x-admin-email': adminEmail } }),
        ]);

        if (!ignore && metricsRes.ok) {
          const data = await metricsRes.json();
          setMetrics(data);
        }
        if (!ignore && sectorsRes.ok) {
          const data = await sectorsRes.json();
          setSectors(data.sectors || []);
        }
        if (!ignore && questionsRes.ok) {
          const data = await questionsRes.json();
          setQuestions(data.questions || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [adminEmail]);

  // Filtered attempts
  const allAttempts = metrics?.allAttempts;
  const filteredAttempts = useMemo(() => {
    if (!allAttempts) return [];
    return allAttempts.filter((att) => {
      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = att.userName.toLowerCase().includes(term);
        const matchesSector = att.sectorName.toLowerCase().includes(term);
        if (!matchesName && !matchesSector) return false;
      }
      // Filter sector
      if (filterSector && att.sectorName !== filterSector) {
        return false;
      }
      // Filter status
      if (filterStatus === 'official') return att.isOfficial && att.status === 'COMPLETED';
      if (filterStatus === 'additional') return !att.isOfficial && att.status === 'COMPLETED';
      if (filterStatus === 'perfect') return att.score === att.totalQuestions && att.totalQuestions > 0;
      if (filterStatus === 'winners') return att.isEligiblePrize;
      if (filterStatus === 'in_progress') return att.status === 'IN_PROGRESS';

      return true;
    });
  }, [allAttempts, searchTerm, filterSector, filterStatus]);

  const handleExportCsv = () => {
    const url = `/api/admin/export`;
    // Create link with admin header/cookie or trigger download directly
    window.open(url, '_blank');
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Admin Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#00995D] text-white text-[10px] font-black uppercase tracking-wider">
              Admin
            </span>
            <span className="text-xs font-bold text-gray-500">Unimed Centro Rondônia</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
            Painel de Gestão e Integridade
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            Monitoramento de conformidade, ranking oficial, premiações e auditoria de respostas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshData()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold border border-gray-200 shadow-2xs transition-all active:scale-95"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#00995D]' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#005C40] hover:bg-[#007B4B] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#B1D34B]" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-8 pb-2 border-b border-gray-200/80">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'overview'
              ? 'bg-[#00995D] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Visão Geral & Tentativas</span>
        </button>

        <button
          onClick={() => setActiveTab('winners')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'winners'
              ? 'bg-[#00995D] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Ganhadores & Ranking ({metrics?.winners.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('sectors')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'sectors'
              ? 'bg-[#00995D] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Gerenciar Setores ({sectors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'questions'
              ? 'bg-[#00995D] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Gerenciar Perguntas ({questions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('supabase')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'supabase'
              ? 'bg-[#00995D] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Banco Supabase</span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00995D] flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Colaboradores Únicos
                </span>
                <span className="text-2xl sm:text-3xl font-black text-gray-900">
                  {metrics?.totalCollaborators ?? 0}
                </span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#005C40] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Tentativas Concluídas
                </span>
                <span className="text-2xl sm:text-3xl font-black text-gray-900">
                  {metrics?.totalCompleted ?? 0}
                </span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#F47920] flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Gabaritos (100%)
                </span>
                <span className="text-2xl sm:text-3xl font-black text-[#00995D]">
                  {metrics?.gabaritos ?? 0}
                </span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Copy className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Participações Adicionais
                </span>
                <span className="text-2xl sm:text-3xl font-black text-gray-900">
                  {metrics?.participacoesAdicionais ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Performance by Sector & Score Distribution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sector Performance */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-gray-100 shadow-xs">
              <h4 className="text-base font-black text-gray-900 mb-1">
                Desempenho por Setor
              </h4>
              <p className="text-xs text-gray-500 mb-6">
                Média de acertos e adesão de colaboradores por departamento.
              </p>

              {metrics?.sectorPerformance && metrics.sectorPerformance.length > 0 ? (
                <div className="space-y-4">
                  {metrics.sectorPerformance.map((item) => (
                    <div key={item.sector} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-800 truncate max-w-[240px]">
                          {item.sector}
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-gray-400">({item.attempts} part.)</span>
                          <strong className="text-[#005C40]">{item.avgScore}%</strong>
                        </div>
                      </div>
                      <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#00995D] to-[#B1D34B] rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(5, parseFloat(item.avgScore)))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-gray-400">
                  Nenhum dado por setor registrado ainda.
                </div>
              )}
            </div>

            {/* Score Distribution */}
            <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-3xl border border-gray-100 shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-base font-black text-gray-900 mb-1">
                  Distribuição de Pontuação
                </h4>
                <p className="text-xs text-gray-500 mb-6">
                  Quantidade de colaboradores por número de acertos.
                </p>

                <div className="space-y-3">
                  {[4, 3, 2, 1, 0].map((score) => {
                    const count = metrics?.scoreDistribution?.[score] || 0;
                    const total = metrics?.totalCompleted || 1;
                    const pct = Math.round((count / total) * 100);

                    return (
                      <div key={score} className="flex items-center gap-3 text-xs">
                        <span className="w-16 font-bold text-gray-700">
                          {score} {score === 1 ? 'acerto' : 'acertos'}
                        </span>
                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              score === 4 ? 'bg-[#00995D]' : score === 3 ? 'bg-[#007B4B]' : score === 2 ? 'bg-amber-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-12 text-right font-mono text-gray-500">
                          {count} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Taxa de Gabarito:</span>
                <strong className="text-[#00995D] font-black text-sm">
                  {metrics?.totalCompleted
                    ? Math.round((metrics.gabaritos / metrics.totalCompleted) * 100)
                    : 0}
                  %
                </strong>
              </div>
            </div>
          </div>

          {/* Filters & Attempts Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
            {/* Table Filter Controls */}
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-black text-gray-900">Histórico de Tentativas</h4>
                <p className="text-xs text-gray-500">
                  Listagem completa com auditoria de snapshot das perguntas e respostas.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar nome ou setor..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00995D]"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Filter Sector */}
                <select
                  value={filterSector}
                  onChange={(e) => setFilterSector(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00995D]"
                >
                  <option value="">Todos os Setores</option>
                  {sectors.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>

                {/* Filter Status */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00995D]"
                >
                  <option value="all">Todos os Status</option>
                  <option value="official">Participação Oficial (1ª)</option>
                  <option value="additional">Participação Adicional</option>
                  <option value="perfect">Gabaritos (100%)</option>
                  <option value="winners">Elegíveis ao Prêmio</option>
                  <option value="in_progress">Em Andamento</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-6">Colaborador</th>
                    <th className="py-3.5 px-4">Setor</th>
                    <th className="py-3.5 px-4 text-center">Acertos</th>
                    <th className="py-3.5 px-4 text-center">Tempo</th>
                    <th className="py-3.5 px-4">Tipo</th>
                    <th className="py-3.5 px-4">Prêmio</th>
                    <th className="py-3.5 px-6">Data</th>
                    <th className="py-3.5 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAttempts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400">
                        Nenhuma tentativa encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredAttempts.map((att) => (
                      <tr key={att.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-6 font-bold text-gray-900">
                          {att.userName}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">
                          {att.sectorName}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`font-black ${
                              att.score === att.totalQuestions ? 'text-[#00995D]' : 'text-gray-800'
                            }`}
                          >
                            {att.score}/{att.totalQuestions}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-gray-700">
                          {formatDuration(att.durationSeconds)}
                        </td>
                        <td className="py-3.5 px-4">
                          {att.isOfficial ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00995D]">
                              <CheckCircle2 className="w-3 h-3" /> Oficial
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-gray-400">
                              Adicional
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {att.isEligiblePrize ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-300">
                              <Trophy className="w-3 h-3 text-[#F47920]" /> Elegível
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-gray-500 font-mono text-[11px]">
                          {att.endTime ? new Date(att.endTime).toLocaleString('pt-BR') : 'Em andamento'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedAttempt(att)}
                            className="p-1.5 text-gray-500 hover:text-[#00995D] hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Ver detalhes e respostas"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Winners */}
      {activeTab === 'winners' && metrics && (
        <div className="animate-fade-in">
          <WinnersManagement
            ranking={metrics.ranking}
            winners={metrics.winners}
            config={metrics.config}
            onRefresh={refreshData}
            adminEmail={adminEmail}
          />
        </div>
      )}

      {/* Tab 3: Sectors */}
      {activeTab === 'sectors' && (
        <div className="animate-fade-in">
          <SectorManagement
            sectors={sectors}
            onRefresh={refreshData}
            adminEmail={adminEmail}
          />
        </div>
      )}

      {/* Tab 4: Questions */}
      {activeTab === 'questions' && (
        <div className="animate-fade-in">
          <QuestionManagement
            questions={questions}
            onRefresh={refreshData}
            adminEmail={adminEmail}
          />
        </div>
      )}

      {/* Tab 5: Supabase */}
      {activeTab === 'supabase' && (
        <div className="animate-fade-in">
          <SupabaseSettings adminEmail={adminEmail} />
        </div>
      )}

      {/* Attempt Details Modal (Auditoria de Respostas) */}
      {selectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <div>
                <span className="text-[11px] font-bold text-[#00995D] uppercase tracking-wider block">
                  Auditoria de Tentativa • Snapshot
                </span>
                <h3 className="text-xl font-black text-gray-900">
                  {selectedAttempt.userName}
                </h3>
                <p className="text-xs text-gray-500">
                  Setor: {selectedAttempt.sectorName} • Concluído em: {selectedAttempt.endTime ? new Date(selectedAttempt.endTime).toLocaleString('pt-BR') : '-'}
                </p>
              </div>

              <button
                onClick={() => setSelectedAttempt(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Attempt summary badge */}
            <div className="grid grid-cols-3 gap-3 mb-6 text-center text-xs">
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Acertos</span>
                <strong className="text-base text-[#005C40] font-black">
                  {selectedAttempt.score} / {selectedAttempt.totalQuestions}
                </strong>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Duração</span>
                <strong className="text-base text-gray-900 font-black">
                  {formatDuration(selectedAttempt.durationSeconds)}
                </strong>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Classificação</span>
                <strong className="text-xs text-[#00995D] font-bold block mt-1">
                  {selectedAttempt.isOfficial ? 'Oficial (1ª)' : 'Adicional'}
                </strong>
              </div>
            </div>

            {/* Questions Snapshot list */}
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {selectedAttempt.questions.map((q, idx) => {
                const answer = selectedAttempt.answers.find((a) => a.questionId === q.questionId);
                const isCorrect = answer?.isCorrect;

                return (
                  <div key={q.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-[#005C40] font-bold text-[10px]">
                        {q.pill}
                      </span>
                      {answer ? (
                        isCorrect ? (
                          <span className="text-[#00995D] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Acertou
                          </span>
                        ) : (
                          <span className="text-red-600 font-bold flex items-center gap-1">
                            ✕ Errou
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400">Não respondida</span>
                      )}
                    </div>

                    <p className="font-bold text-gray-900 text-xs sm:text-sm">
                      {idx + 1}. {q.question}
                    </p>

                    <div className="pt-1 text-[11px] space-y-1">
                      <div>
                        <strong className="text-gray-700">Resposta do colaborador: </strong>
                        <span className={isCorrect ? 'text-[#00995D] font-bold' : 'text-red-600 font-bold'}>
                          Opção {answer?.selectedOption || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <strong className="text-gray-700">Gabarito correto: </strong>
                        <span className="text-[#005C40] font-bold">Opção {q.correctOption}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedAttempt(null)}
                className="px-6 py-2 rounded-full bg-gray-900 text-white text-xs font-bold hover:bg-black"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
