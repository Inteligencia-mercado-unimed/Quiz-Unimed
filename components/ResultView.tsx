'use client';

import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Award,
  Clock,
  Calendar,
  RotateCcw,
  Share2,
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { AttemptType } from '@/lib/types';
import { UnimedLogo } from './UnimedLogo';

interface ResultViewProps {
  attempt: AttemptType;
  onRetry: () => void;
  onViewRanking?: () => void;
}

export function ResultView({ attempt, onRetry, onViewRanking }: ResultViewProps) {
  const [copied, setCopied] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isPerfectScore = attempt.score === attempt.totalQuestions && attempt.totalQuestions > 0;
  const percentage = attempt.totalQuestions > 0 ? Math.round((attempt.score / attempt.totalQuestions) * 100) : 0;

  useEffect(() => {
    if (isPerfectScore) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00995D', '#B1D34B', '#F47920', '#005C40', '#ffffff'],
        });
      } catch (err) {
        console.warn('Confetti effect error:', err);
      }
    }
  }, [isPerfectScore]);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  const formattedDate = attempt.endTime
    ? new Date(attempt.endTime).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleString('pt-BR');

  const handleShare = async () => {
    const text = `🎯 Concluí o Quiz Pílulas de Integridade da Unimed Centro Rondônia!\n\n` +
      `👤 Colaborador: ${attempt.userName}\n` +
      `🏢 Setor: ${attempt.sectorName}\n` +
      `⭐ Acertos: ${attempt.score}/${attempt.totalQuestions} (${percentage}%)\n` +
      `⏱️ Tempo: ${formatDuration(attempt.durationSeconds)}\n` +
      `📌 Participação: ${attempt.isOfficial ? 'Oficial (1ª)' : 'Adicional'}\n` +
      (attempt.isEligiblePrize ? `🏆 Status: Elegível à Premiação Especial!\n\n` : `\n`) +
      `Teste seus conhecimentos e participe da campanha de compliance!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meu Resultado no Pílulas de Integridade — Unimed',
          text,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      alert('Resultado copiado para a área de transferência!');
    }
  };

  // Generate downloadable certificate image using HTML5 Canvas
  const handleDownloadImage = () => {
    setIsGeneratingImage(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 700;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 1200, 700);
      bgGrad.addColorStop(0, '#FFFFFF');
      bgGrad.addColorStop(0.5, '#F7FAF8');
      bgGrad.addColorStop(1, '#E8F5EC');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1200, 700);

      // Top green brand bar
      const topBar = ctx.createLinearGradient(0, 0, 1200, 0);
      topBar.addColorStop(0, '#005C40');
      topBar.addColorStop(0.5, '#00995D');
      topBar.addColorStop(1, '#B1D34B');
      ctx.fillStyle = topBar;
      ctx.fillRect(0, 0, 1200, 16);

      // Outer frame border
      ctx.strokeStyle = '#00995D';
      ctx.lineWidth = 3;
      ctx.strokeRect(30, 40, 1140, 630);

      // Unimed Badge Header
      ctx.fillStyle = '#00995D';
      ctx.beginPath();
      ctx.roundRect(80, 70, 240, 50, 10);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px "Nunito Sans", sans-serif';
      ctx.fillText('UNIMED', 100, 103);
      ctx.font = 'bold 12px "Nunito Sans", sans-serif';
      ctx.fillText('CENTRO RONDÔNIA', 100, 116);

      // Title & Subtitle
      ctx.fillStyle = '#005C40';
      ctx.font = 'bold 36px "Nunito Sans", sans-serif';
      ctx.fillText('Comprovante de Participação', 80, 170);

      ctx.fillStyle = '#4B5563';
      ctx.font = '18px "Nunito Sans", sans-serif';
      ctx.fillText('Pílulas de Integridade — Campanha de Compliance POL.INT.7.3', 80, 205);

      // Divider
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(80, 230);
      ctx.lineTo(1120, 230);
      ctx.stroke();

      // Collaborator info
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 28px "Nunito Sans", sans-serif';
      ctx.fillText(attempt.userName, 80, 290);

      ctx.fillStyle = '#007B4B';
      ctx.font = 'bold 20px "Nunito Sans", sans-serif';
      ctx.fillText(`Setor: ${attempt.sectorName}`, 80, 325);

      // Stats Cards
      // Box 1: Pontuação
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#D1D5DB';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(80, 360, 230, 140, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#6B7280';
      ctx.font = 'bold 14px "Nunito Sans", sans-serif';
      ctx.fillText('ACERTOS', 105, 395);

      ctx.fillStyle = isPerfectScore ? '#00995D' : '#111827';
      ctx.font = 'bold 44px "Nunito Sans", sans-serif';
      ctx.fillText(`${attempt.score} / ${attempt.totalQuestions}`, 105, 450);

      ctx.font = 'bold 16px "Nunito Sans", sans-serif';
      ctx.fillText(`${percentage}% de aproveitamento`, 105, 480);

      // Box 2: Duração
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(330, 360, 230, 140, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#6B7280';
      ctx.font = 'bold 14px "Nunito Sans", sans-serif';
      ctx.fillText('TEMPO TOTAL', 355, 395);

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 36px "Nunito Sans", sans-serif';
      ctx.fillText(formatDuration(attempt.durationSeconds), 355, 450);

      // Box 3: Participação & Prêmio
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(580, 360, 540, 140, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#6B7280';
      ctx.font = 'bold 14px "Nunito Sans", sans-serif';
      ctx.fillText('STATUS DA PARTICIPAÇÃO', 605, 395);

      ctx.fillStyle = attempt.isOfficial ? '#00995D' : '#F47920';
      ctx.font = 'bold 22px "Nunito Sans", sans-serif';
      ctx.fillText(attempt.isOfficial ? '✓ Participação Oficial (1ª tentativa)' : 'Participação Adicional (Treinamento)', 605, 435);

      if (attempt.isEligiblePrize) {
        ctx.fillStyle = '#F47920';
        ctx.font = 'bold 18px "Nunito Sans", sans-serif';
        ctx.fillText('🏆 Elegível à Premiação Especial da Unimed Centro Rondônia!', 605, 475);
      } else {
        ctx.fillStyle = '#4B5563';
        ctx.font = '16px "Nunito Sans", sans-serif';
        ctx.fillText(`Concluído em: ${formattedDate}`, 605, 475);
      }

      // Footer
      ctx.fillStyle = '#6B7280';
      ctx.font = '14px "Nunito Sans", sans-serif';
      ctx.fillText(`ID da Tentativa: ${attempt.id} • Registro auditável do sistema de integridade`, 80, 630);

      // Download trigger
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `resultado-quiz-unimed-${attempt.userName.replace(/\s+/g, '-').toLowerCase()}.png`;
      a.click();
    } catch (err) {
      console.error('Download error:', err);
      alert('Não foi possível gerar a imagem no seu navegador.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-10 max-w-4xl mx-auto w-full">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl shadow-emerald-950/5 border border-emerald-950/5 p-6 sm:p-10 transition-all text-center">
        {/* Top Status Icon */}
        <div className="flex justify-center mb-6">
          {isPerfectScore ? (
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#00995D] to-[#B1D34B] text-white flex items-center justify-center shadow-lg shadow-emerald-900/20 transform hover:scale-105 transition-transform">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#E8F5EC] text-[#005C40] flex items-center justify-center shadow-sm">
              <Award className="w-10 h-10 text-[#00995D]" />
            </div>
          )}
        </div>

        {/* Title & Celebration Message */}
        <div className="space-y-2 mb-8">
          <span className="text-xs font-black tracking-wider text-[#00995D] uppercase">
            Resultado do Quiz
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {isPerfectScore ? 'Parabéns! Você gabaritou!' : 'Quiz Concluído com Sucesso!'}
          </h2>
          <p className="text-sm text-gray-600 font-medium max-w-md mx-auto leading-relaxed">
            {isPerfectScore
              ? 'Excelente! Você demonstrou domínio total sobre as diretrizes éticas e de compliance da Unimed Centro Rondônia.'
              : 'Obrigado por sua dedicação! O conhecimento das pílulas de integridade fortalece as relações de transparência e respeito em nossa cooperativa.'}
          </p>
        </div>

        {/* Prize Eligibility Banner (When Applicable) */}
        {attempt.isEligiblePrize && (
          <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-[#F47920]/40 text-left flex items-start gap-4 shadow-sm animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-[#F47920] text-white flex items-center justify-center shrink-0 shadow-md">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-black tracking-wider text-[#F47920] uppercase block">
                Premiação Especial
              </span>
              <h4 className="text-base font-black text-gray-900">
                Você é elegível ao prêmio institucional!
              </h4>
              <p className="text-xs sm:text-sm text-gray-700 mt-1 leading-relaxed">
                Você foi o primeiro participante a acertar todas as perguntas em sua participação oficial. A equipe de Governança entrará em contato para entrega do prêmio!
              </p>
            </div>
          </div>
        )}

        {/* Additional attempt notice if 100% but was not official */}
        {isPerfectScore && !attempt.isOfficial && (
          <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-left text-xs sm:text-sm text-blue-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Tentativa Adicional Registrada</span>
              Parabéns pelo gabarito! Esta tentativa foi registrada como treinamento adicional, pois sua primeira participação foi a oficial para fins de premiação.
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 text-left">
          {/* Card 1: Score */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Acertos</span>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-black text-[#005C40]">
                {attempt.score}/{attempt.totalQuestions}
              </div>
              <span className="text-xs font-semibold text-[#00995D]">{percentage}% aproveitamento</span>
            </div>
          </div>

          {/* Card 2: Duration */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tempo Total</span>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-1">
                <span>{formatDuration(attempt.durationSeconds)}</span>
              </div>
              <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Registrado no servidor
              </span>
            </div>
          </div>

          {/* Card 3: Date */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Conclusão</span>
            <div className="mt-2">
              <div className="text-sm font-bold text-gray-900 leading-snug">
                {formattedDate}
              </div>
              <span className="text-xs font-semibold text-gray-500 flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3" /> Registro oficial
              </span>
            </div>
          </div>

          {/* Card 4: Participation Status */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Participação</span>
            <div className="mt-2">
              <div className="text-sm font-black text-gray-900 leading-snug">
                {attempt.isOfficial ? (
                  <span className="text-[#00995D] flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> Oficial (1ª)
                  </span>
                ) : (
                  <span className="text-[#F47920]">Adicional</span>
                )}
              </div>
              <span className="text-[11px] text-gray-500 block mt-1">
                {attempt.isOfficial ? 'Concorre a prêmio' : 'Treinamento'}
              </span>
            </div>
          </div>
        </div>

        {/* User Card Bar */}
        <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between text-xs sm:text-sm font-semibold text-[#005C40] mb-8">
          <span>Colaborador: <strong className="text-gray-900">{attempt.userName}</strong></span>
          <span>Setor: <strong className="text-gray-900">{attempt.sectorName}</strong></span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onRetry}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-gray-50 text-gray-800 text-sm font-bold border border-gray-200 shadow-2xs transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-gray-500" />
            <span>Tentar Novamente</span>
          </button>

          <button
            onClick={handleShare}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-emerald-100/70 hover:bg-emerald-100 text-[#005C40] text-sm font-bold border border-[#00995D]/20 shadow-2xs transition-all active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#00995D]" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-[#00995D]" />
                <span>Compartilhar Resultado</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadImage}
            disabled={isGeneratingImage}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-[#005C40] hover:bg-[#007B4B] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{isGeneratingImage ? 'Gerando...' : 'Baixar Comprovante'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
