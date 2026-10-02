import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7FAF8] p-4 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <span className="text-4xl font-black text-[#00995D]">404</span>
        <h2 className="text-xl font-bold text-gray-900 mt-2 mb-3">Página não encontrada</h2>
        <p className="text-xs text-gray-500 mb-6">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#005C40] hover:bg-[#007B4B] text-white text-xs font-bold transition-all shadow-xs"
        >
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}
