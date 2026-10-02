'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { HeroView } from '@/components/HeroView';
import { IdentificationView } from '@/components/IdentificationView';
import { QuizView } from '@/components/QuizView';
import { ResultView } from '@/components/ResultView';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminLoginModal } from '@/components/admin/AdminLoginModal';
import { AttemptType, SectorType } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [currentView, setCurrentView] = useState<'home' | 'identify' | 'quiz' | 'result' | 'admin'>('home');
  const [sectors, setSectors] = useState<SectorType[]>([]);
  const [isLoadingSectors, setIsLoadingSectors] = useState(true);
  const [currentAttempt, setCurrentAttempt] = useState<AttemptType | null>(null);

  // Admin auth with lazy state initialization
  const [adminEmail, setAdminEmail] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('unimed_admin_email');
    }
    return null;
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Load sectors on mount
  useEffect(() => {
    async function loadSectors() {
      try {
        const res = await fetch('/api/sectors');
        if (res.ok) {
          const data = await res.json();
          setSectors(data.sectors || []);
        }
      } catch (err) {
        console.error('Erro ao buscar setores:', err);
      } finally {
        setIsLoadingSectors(false);
      }
    }
    loadSectors();
  }, []);

  // Auto-detect connected Google account on mount (não precisa fazer login manual no app)
  useEffect(() => {
    async function checkGoogleAccount() {
      try {
        const res = await fetch('/api/auth/google-session');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.isAdmin && data.email) {
            localStorage.setItem('unimed_admin_email', data.email);
            window.dispatchEvent(new Event('unimed_admin_change'));
          } else if (data.authenticated && !data.isAdmin) {
            localStorage.removeItem('unimed_admin_email');
            window.dispatchEvent(new Event('unimed_admin_change'));
          }
        }
      } catch (err) {
        console.warn('Erro ao verificar conta Google conectada:', err);
      }
    }
    checkGoogleAccount();
  }, []);

  const handleStartIdentification = () => {
    setCurrentView('identify');
  };

  const handleStartQuiz = async (userName: string, sectorName: string, sectorId?: string) => {
    const res = await fetch('/api/quiz/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName, sectorName, sectorId }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao iniciar o quiz');
    }

    setCurrentAttempt(data.attempt);
    setCurrentView('quiz');
  };

  const handleAnswerQuestion = async (
    questionId: string,
    selectedOption: 'A' | 'B' | 'C' | 'D'
  ) => {
    if (!currentAttempt) throw new Error('Nenhuma tentativa ativa');

    const res = await fetch('/api/quiz/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attemptId: currentAttempt.id,
        questionId,
        selectedOption,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao responder pergunta');
    }

    setCurrentAttempt(data.attempt);
    return {
      isCorrect: data.isCorrect,
      correctOption: data.correctOption,
      explanation: data.explanation,
    };
  };

  const handleFinishQuiz = async () => {
    if (!currentAttempt) throw new Error('Nenhuma tentativa ativa');

    const res = await fetch('/api/quiz/finish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attemptId: currentAttempt.id }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao finalizar o quiz');
    }

    setCurrentAttempt(data.attempt);
    setCurrentView('result');
  };

  const handleRetry = () => {
    setCurrentAttempt(null);
    setCurrentView('identify');
  };

  const handleOpenAdmin = () => {
    if (adminEmail) {
      setCurrentView('admin');
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const handleAdminLoginSuccess = (email: string) => {
    setAdminEmail(email);
    localStorage.setItem('unimed_admin_email', email);
    setIsAdminLoginOpen(false);
    setCurrentView('admin');
  };

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
    } catch {
      // Ignore
    }
    setAdminEmail(null);
    localStorage.removeItem('unimed_admin_email');
    if (currentView === 'admin') {
      setCurrentView('home');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAF8] selection:bg-[#00995D] selection:text-white">
      <Header
        currentView={currentView}
        onNavigateHome={() => setCurrentView('home')}
        onOpenAdmin={handleOpenAdmin}
        adminEmail={adminEmail}
        onAdminLogout={handleAdminLogout}
      />

      {currentView === 'home' && (
        <HeroView onStart={handleStartIdentification} />
      )}

      {currentView === 'identify' && (
        <IdentificationView
          sectors={sectors}
          isLoadingSectors={isLoadingSectors}
          onBack={() => setCurrentView('home')}
          onSubmit={handleStartQuiz}
        />
      )}

      {currentView === 'quiz' && currentAttempt && (
        <QuizView
          attempt={currentAttempt}
          onAnswerQuestion={handleAnswerQuestion}
          onFinishQuiz={handleFinishQuiz}
        />
      )}

      {currentView === 'result' && currentAttempt && (
        <ResultView
          attempt={currentAttempt}
          onRetry={handleRetry}
          onViewRanking={handleOpenAdmin}
        />
      )}

      {currentView === 'admin' && adminEmail && (
        <AdminDashboard
          adminEmail={adminEmail}
          onLogout={handleAdminLogout}
          onBackToQuiz={() => setCurrentView('home')}
        />
      )}

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
}
