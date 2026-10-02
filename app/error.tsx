'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7FAF8] p-4 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Ocorreu um erro</h2>
        <p className="text-xs text-gray-500 mb-6">
          Não foi possível carregar a página solicitada.
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#005C40] hover:bg-[#007B4B] text-white text-xs font-bold transition-all shadow-xs"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
