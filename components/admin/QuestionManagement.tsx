'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Loader2, HelpCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { QuestionType } from '@/lib/types';

interface QuestionManagementProps {
  questions: QuestionType[];
  onRefresh: () => Promise<void>;
  adminEmail: string;
}

export function QuestionManagement({ questions, onRefresh, adminEmail }: QuestionManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionType | null>(null);

  // Form states
  const [pill, setPill] = useState('Pílula #05');
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('B');
  const [explanation, setExplanation] = useState('');
  const [active, setActive] = useState(true);
  const [order, setOrder] = useState(questions.length + 1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setPill(`Pílula #${String(questions.length + 1).padStart(2, '0')}`);
    setQuestionText('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setCorrectOption('B');
    setExplanation('');
    setActive(true);
    setOrder(questions.length + 1);
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (q: QuestionType) => {
    setEditingQuestion(q);
    setPill(q.pill);
    setQuestionText(q.question);
    setOptionA(q.optionA);
    setOptionB(q.optionB);
    setOptionC(q.optionC);
    setOptionD(q.optionD);
    setCorrectOption(q.correctOption);
    setExplanation(q.explanation);
    setActive(q.active);
    setOrder(q.order);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      pill: pill.trim(),
      question: questionText.trim(),
      optionA: optionA.trim(),
      optionB: optionB.trim(),
      optionC: optionC.trim(),
      optionD: optionD.trim(),
      correctOption,
      explanation: explanation.trim(),
      active,
      order: Number(order),
    };

    try {
      if (editingQuestion) {
        // Update
        const res = await fetch('/api/admin/questions', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-email': adminEmail,
          },
          body: JSON.stringify({ id: editingQuestion.id, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao atualizar pergunta');
        showNotification('Pergunta atualizada com sucesso!');
      } else {
        // Create
        const res = await fetch('/api/admin/questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-email': adminEmail,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao criar pergunta');
        showNotification('Pergunta criada com sucesso!');
      }

      setIsModalOpen(false);
      await onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, pillName: string) => {
    if (!confirm(`Deseja realmente excluir a "${pillName}"?`)) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/questions?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-email': adminEmail },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir pergunta');

      showNotification('Pergunta excluída com sucesso!');
      await onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (q: QuestionType) => {
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail,
        },
        body: JSON.stringify({ id: q.id, active: !q.active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao alternar status');

      showNotification(`Pergunta ${!q.active ? 'ativada' : 'desativada'} com sucesso!`);
      await onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <h3 className="text-xl font-black text-gray-900">Gerenciar Perguntas & Pílulas</h3>
          <p className="text-xs text-gray-500 font-medium">
            Cadastre os enunciados, alternativas, gabaritos e explicações de integridade.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 bg-[#005C40] hover:bg-[#007B4B] text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-full shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Pergunta</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((q) => (
          <div
            key={q.id}
            className={`p-6 rounded-3xl bg-white border transition-all ${
              q.active ? 'border-gray-200/80 shadow-xs' : 'border-gray-200/50 bg-gray-50/50 opacity-70'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-[#E8F5EC] text-[#005C40] font-black text-xs uppercase border border-[#00995D]/20">
                  {q.pill}
                </span>
                <span className="text-xs font-semibold text-gray-400">
                  Ordem: #{q.order}
                </span>
                {q.active ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00995D]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ativa para novos participantes
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400">
                    <XCircle className="w-3.5 h-3.5" /> Inativa
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  onClick={() => handleToggleActive(q)}
                  className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                    q.active ? 'text-gray-500 hover:text-amber-600 hover:bg-amber-50' : 'text-[#00995D] hover:bg-emerald-50'
                  }`}
                  title={q.active ? 'Desativar pergunta' : 'Ativar pergunta'}
                >
                  {q.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleOpenEdit(q)}
                  className="p-2 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
                  title="Editar pergunta"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(q.id, q.pill)}
                  className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                  title="Excluir pergunta"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Enunciado */}
            <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-4 leading-snug">
              {q.question}
            </h4>

            {/* Alternatives Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4 text-xs">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                const text = opt === 'A' ? q.optionA : opt === 'B' ? q.optionB : opt === 'C' ? q.optionC : q.optionD;
                const isCorrect = q.correctOption === opt;
                return (
                  <div
                    key={opt}
                    className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                      isCorrect
                        ? 'border-[#00995D] bg-emerald-50/70 font-bold text-gray-900'
                        : 'border-gray-100 bg-gray-50/70 text-gray-600'
                    }`}
                  >
                    <span
                      className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                        isCorrect ? 'bg-[#00995D] text-white' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {opt}
                    </span>
                    <span className="leading-snug">{text}</span>
                  </div>
                );
              })}
            </div>

            {/* Explanation box */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600">
              <strong className="text-gray-800">Explicação oficial: </strong>
              {q.explanation}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 my-8">
            <h3 className="text-xl font-black text-gray-900 mb-1">
              {editingQuestion ? 'Editar Pergunta' : 'Nova Pergunta'}
            </h3>
            <p className="text-xs text-gray-500 font-medium mb-6">
              Alterações afetarão apenas os novos participantes. Tentativas anteriores mantêm seu histórico intacto.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Identificação da Pílula
                  </label>
                  <input
                    type="text"
                    value={pill}
                    onChange={(e) => setPill(e.target.value)}
                    placeholder="Ex: Pílula #01"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00995D]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00995D]"
                    required
                    min={1}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Enunciado da Pergunta
                </label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  rows={3}
                  placeholder="De acordo com a Pílula..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00995D]"
                  required
                />
              </div>

              {/* Alternatives */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-700">
                  Alternativas (A, B, C, D)
                </label>
                {[
                  { key: 'A', val: optionA, set: setOptionA },
                  { key: 'B', val: optionB, set: setOptionB },
                  { key: 'C', val: optionC, set: setOptionC },
                  { key: 'D', val: optionD, set: setOptionD },
                ].map(({ key, val, set }) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-700">
                      {key}
                    </span>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      placeholder={`Texto da alternativa ${key}`}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00995D]"
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Alternativa Correta (Gabarito)
                  </label>
                  <select
                    value={correctOption}
                    onChange={(e) => setCorrectOption(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#00995D] focus:outline-none focus:ring-2 focus:ring-[#00995D]"
                    required
                  >
                    <option value="A">Alternativa A</option>
                    <option value="B">Alternativa B</option>
                    <option value="C">Alternativa C</option>
                    <option value="D">Alternativa D</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="w-4 h-4 text-[#00995D] rounded border-gray-300 focus:ring-[#00995D]"
                    />
                    <span className="text-xs font-bold text-gray-700">
                      Pergunta ativa para novos participantes
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Explicação da Resposta (Feedback formativo)
                </label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  rows={2}
                  placeholder="Explique o motivo da alternativa estar correta..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00995D]"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 text-xs font-bold bg-[#005C40] hover:bg-[#007B4B] text-white rounded-full flex items-center gap-2 shadow-xs"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingQuestion ? 'Atualizar Pergunta' : 'Criar Pergunta'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
