import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pílulas de Integridade — Unimed Centro Rondônia',
  description: 'Quiz interativo de compliance, ética e integridade corporativa da Unimed Centro Rondônia.',
  icons: {
    icon: 'https://i.ibb.co/cHhHYqF/Logo-Nova-Unimed-CR.png',
    shortcut: 'https://i.ibb.co/cHhHYqF/Logo-Nova-Unimed-CR.png',
    apple: 'https://i.ibb.co/cHhHYqF/Logo-Nova-Unimed-CR.png',
  },
  openGraph: {
    title: 'Pílulas de Integridade — Unimed Centro Rondônia',
    description: 'Quiz de compliance, ética e integridade corporativa da Unimed Centro Rondônia.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pílulas de Integridade — Unimed Centro Rondônia',
    description: 'Quiz de compliance, ética e integridade corporativa da Unimed Centro Rondônia.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen bg-[#F7FAF8] text-gray-800" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
