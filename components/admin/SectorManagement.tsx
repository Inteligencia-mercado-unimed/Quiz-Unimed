'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Loader2, Building2, AlertCircle } from 'lucide-react';
import { SectorType } from '@/lib/types';

interface SectorManagementProps {
  sectors: SectorType[];
  onRefresh: () => Promise<void>;
  adminEmail: string;
}

export function SectorManagement({ sectors, onRefresh, adminEmail }: SectorManagementProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newSectorName, setNewSectorName] = useState('');
  const [editingSector, setEditingSector] = useState<SectorType | null>(null);
  const [editName, setEditName] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectorName.trim()) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/sectors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail,
        },
        body: JSON.stringify({ name: newSectorName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar setor');

      setNewSectorName('');
      setIsCreating(false);
      showNotification('Setor criado com sucesso!');
      await onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSector || !editName.trim()) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/sectors', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail,
        },
        body: JSON.stringify({
          id: editingSector.id,
          name: editName.trim(),
          active: editActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar setor');

      setEditingSector(null);
      showNotification('Setor atualizado com sucesso!');
      await onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir o setor "${name}"?`)) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/sectors?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-email': adminEmail },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir setor');

      showNotification('Setor excluído com sucesso!');
      await onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <h3 className="text-xl font-black text-gray-900">Gerenciar Setores</h3>
          <p className="text-xs text-gray-500 font-medium">
            Cadastre, edite ou desative os setores da Unimed Centro Rondônia participantes do quiz.
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreating(true);
            setError(null);
          }}
          className="inline-flex items-center gap-2 bg-[#005C40] hover:bg-[#007B4B] text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-full shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Setor</span>
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

      {/* Create Modal / Form */}
      {isCreating && (
        <div className="bg-white p-6 rounded-3xl border-2 border-[#00995D]/30 shadow-md animate-fade-in">
          <h4 className="text-sm font-black text-gray-900 mb-4">Adicionar Novo Setor</h4>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nome do Setor
              </label>
              <input
                type="text"
                value={newSectorName}
                onChange={(e) => setNewSectorName(e.target.value)}
                placeholder="Ex: Recursos Humanos"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00995D]"
                required
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-full"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-bold bg-[#00995D] hover:bg-[#007B4B] text-white rounded-full flex items-center gap-2 shadow-xs"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Salvar Setor</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Modal / Form */}
      {editingSector && (
        <div className="bg-white p-6 rounded-3xl border-2 border-[#00995D]/30 shadow-md animate-fade-in">
          <h4 className="text-sm font-black text-gray-900 mb-4">Editar Setor</h4>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nome do Setor
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00995D]"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editActive"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
                className="w-4 h-4 text-[#00995D] rounded border-gray-300 focus:ring-[#00995D]"
              />
              <label htmlFor="editActive" className="text-xs font-bold text-gray-700">
                Setor Ativo (visível no formulário de identificação)
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingSector(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-full"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-bold bg-[#00995D] hover:bg-[#007B4B] text-white rounded-full flex items-center gap-2 shadow-xs"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Atualizar Setor</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sectors Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Setor</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sectors.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-400">
                    Nenhum setor cadastrado.
                  </td>
                </tr>
              ) : (
                sectors.map((sec) => (
                  <tr key={sec.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-gray-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      <span>{sec.name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {sec.active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#00995D] font-bold text-[11px] border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-bold text-[11px] border border-gray-200">
                          <XCircle className="w-3 h-3" /> Inativo
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingSector(sec);
                          setEditName(sec.name);
                          setEditActive(sec.active);
                          setIsCreating(false);
                        }}
                        className="p-1.5 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(sec.id, sec.name)}
                        className="p-1.5 text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
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
  );
}
