'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ArrowRight, Loader2, Sparkles, Clock, AlertTriangle } from 'lucide-react';
import { AttemptType, AttemptQuestionSnapshot } from '@/lib/types';

interface QuizViewProps {
  attempt: AttemptType;
  onAnswerQuestion: (questionId: string, selectedOption: 'A' | 'B' | 'C' | 'D') => Promise<{
    isCorrect: boolean;
    correctOption: string;
    explanation: string;
  }>;
  onFinishQuiz: () => Promise<void>;
}

export function QuizView({ attempt, onAnswerQuestion, onFinishQuiz }: QuizViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time duration timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const startTime = new Date(attempt.startTime).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - startTime) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [attempt.startTime]);

  const questions = attempt.questions;
  const currentQuestion = questions[currentIndex] as AttemptQuestionSnapshot | undefined;
  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  // Derive answered state directly from attempt snapshot or local state
  const existingAnswer = currentQuestion
    ? attempt.answers.find((a) => a.questionId === currentQuestion.questionId)
    : undefined;

  const [localSelectedOption, setLocalSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [localAnswerResult, setLocalAnswerResult] = useState<{
    isCorrect: boolean;
    correctOption: string;
    explanation: string;
  } | null>(null);

  const selectedOption = existingAnswer ? existingAnswer.selectedOption : localSelectedOption;
  const answerResult = existingAnswer && currentQuestion
    ? {
        isCorrect: existingAnswer.isCorrect,
        correctOption: currentQuestion.correctOption,
        explanation: currentQuestion.explanation,
      }
    : localAnswerResult;

  if (!currentQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00995D]" />
      </div>
    );
  }

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelect = (option: 'A' | 'B' | 'C' | 'D') => {
    if (answerResult) return; // Locked once answered
    setLocalSelectedOption(option);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedOption || answerResult || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await onAnswerQuestion(currentQuestion.questionId, selectedOption);
      setLocalAnswerResult(res);
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar resposta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (isLastQuestion) {
      try {
        setIsSubmitting(true);
        await onFinishQuiz();
      } catch (err: any) {
        alert(err.message || 'Erro ao finalizar quiz.');
        setIsSubmitting(false);
      }
    } else {
      setLocalSelectedOption(null);
      setLocalAnswerResult(null);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const options: Array<{ key: 'A' | 'B' | 'C' | 'D'; text: string }> = [
    { key: 'A', text: currentQuestion.optionA },
    { key: 'B', text: currentQuestion.optionB },
    { key: 'C', text: currentQuestion.optionC },
    { key: 'D', text: currentQuestion.optionD },
  ];

  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-8 sm:py-12 max-w-4xl mx-auto w-full">
      {/* Top Progress and Metadata Header */}
      <div className="w-full max-w-3xl mb-6">
        <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-gray-700 mb-2.5">
          <span className="text-[#005C40]">
            Pergunta {currentIndex + 1} de {totalQuestions}
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-gray-500 font-mono text-xs bg-white px-2.5 py-1 rounded-full border border-gray-200 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-[#00995D]" />
              <span>{formatTimer(elapsedSeconds)}</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#E8F5EC] border border-[#00995D]/30 text-[#005C40] font-black text-xs uppercase tracking-wider">
              {currentQuestion.pill}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-gray-200/80 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#00995D] to-[#B1D34B] transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl shadow-emerald-950/5 border border-emerald-950/5 p-6 sm:p-10 transition-all">
        {/* Enunciado */}
        <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-snug tracking-tight mb-8">
          {currentQuestion.question}
        </h2>

        {/* Alternatives */}
        <div className="space-y-3.5 mb-8">
          {options.map(({ key, text }) => {
            const isSelected = selectedOption === key;
            const isCorrect = answerResult?.correctOption === key;
            const isUserWrongChoice = answerResult && isSelected && !answerResult.isCorrect;

            let cardStyles =
              'border border-gray-200/90 bg-gray-50/60 hover:bg-emerald-50/40 hover:border-emerald-200 text-gray-800';
            let badgeStyles = 'bg-gray-200/80 text-gray-700 font-bold';

            if (!answerResult && isSelected) {
              cardStyles = 'border-2 border-[#00995D] bg-emerald-50/70 shadow-xs text-gray-900 font-semibold';
              badgeStyles = 'bg-[#00995D] text-white font-black';
            } else if (answerResult) {
              if (isCorrect) {
                cardStyles = 'border-2 border-[#00995D] bg-emerald-50 shadow-sm text-gray-900 font-bold';
                badgeStyles = 'bg-[#00995D] text-white font-black';
              } else if (isUserWrongChoice) {
                cardStyles = 'border-2 border-red-500 bg-red-50/60 text-gray-900 font-medium';
                badgeStyles = 'bg-red-500 text-white font-black';
              } else {
                cardStyles = 'border border-gray-200/60 bg-gray-50/40 opacity-60 text-gray-500';
                badgeStyles = 'bg-gray-200 text-gray-400';
              }
            }

            return (
              <div
                key={key}
                onClick={() => handleSelect(key)}
                className={`p-4 sm:p-4.5 rounded-2xl cursor-pointer transition-all duration-150 flex items-start gap-4 select-none ${cardStyles}`}
              >
                <div
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${badgeStyles}`}
                >
                  {key}
                </div>
                <div className="flex-1 text-sm sm:text-base leading-relaxed pt-1">
                  {text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action: Enviar Resposta (Before Answered) */}
        {!answerResult && (
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedOption || isSubmitting}
              className="inline-flex items-center justify-center gap-2 bg-[#00995D] hover:bg-[#007B4B] text-white text-sm sm:text-base font-bold px-8 py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <span>Enviar resposta</span>
              )}
            </button>
          </div>
        )}

        {/* Feedback Section (After Answered) */}
        {answerResult && (
          <div className="space-y-6 pt-2 animate-fade-in">
            {/* Feedback Box */}
            <div
              className={`p-5 sm:p-6 rounded-2xl border ${
                answerResult.isCorrect
                  ? 'bg-[#E8F5EC] border-[#00995D]/30 text-[#005C40]'
                  : 'bg-red-50/90 border-red-200 text-red-950'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                {answerResult.isCorrect ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-[#00995D]" />
                    <span className="text-base font-extrabold text-[#005C40]">
                      Resposta Correta
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-base font-extrabold text-red-700">
                      Resposta Incorreta
                    </span>
                  </>
                )}
              </div>

              <p className="text-sm sm:text-base leading-relaxed text-gray-800 font-medium mb-3">
                {answerResult.isCorrect
                  ? `Correto! ${answerResult.explanation}`
                  : `Atenção: A alternativa correta é a letra ${answerResult.correctOption}. ${answerResult.explanation}`}
              </p>

              <div className="text-xs text-gray-500 font-semibold border-t border-black/5 pt-2.5">
                Referência: Código de Conduta Ética e POL.INT.7.3 — {currentQuestion.pill}
              </div>
            </div>

            {/* Advance Button */}
            <div className="flex justify-end">
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2.5 bg-[#005C40] hover:bg-[#007B4B] text-white text-sm sm:text-base font-bold px-8 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-150 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Calculando resultado...</span>
                  </>
                ) : isLastQuestion ? (
                  <>
                    <span>Ver Resultado Final</span>
                    <Sparkles className="w-4 h-4 text-[#B1D34B]" />
                  </>
                ) : (
                  <>
                    <span>Próxima Pergunta</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
