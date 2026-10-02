import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth';
import { loadStore, recalculateAttemptsRankings } from '@/lib/quiz-service';

export async function GET(req: NextRequest) {
  const adminCheck = requireAdminApi(req);
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const store = loadStore();
    recalculateAttemptsRankings(store.attempts, store.config.maxWinners);

    const headers = [
      'ID Tentativa',
      'Nome do Colaborador',
      'Setor',
      'Data de Início',
      'Data de Conclusão',
      'Duração (segundos)',
      'Duração Formatada',
      'Acertos',
      'Total Perguntas',
      'Aproveitamento (%)',
      'Participação',
      'Elegível ao Prêmio',
      'Status',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = store.attempts.map((a) => {
      const formatDuration = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      };

      const percent = a.totalQuestions > 0 ? ((a.score / a.totalQuestions) * 100).toFixed(0) : '0';

      return [
        escapeCsv(a.id),
        escapeCsv(a.userName),
        escapeCsv(a.sectorName),
        escapeCsv(a.startTime ? new Date(a.startTime).toLocaleString('pt-BR') : ''),
        escapeCsv(a.endTime ? new Date(a.endTime).toLocaleString('pt-BR') : ''),
        escapeCsv(a.durationSeconds),
        escapeCsv(formatDuration(a.durationSeconds)),
        escapeCsv(a.score),
        escapeCsv(a.totalQuestions),
        escapeCsv(`${percent}%`),
        escapeCsv(a.isOfficial ? 'Oficial (1ª)' : 'Adicional'),
        escapeCsv(a.isEligiblePrize ? 'SIM' : 'NÃO'),
        escapeCsv(a.status === 'COMPLETED' ? 'Concluído' : a.status),
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="pilulas-de-integridade-unimed-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao exportar CSV' }, { status: 500 });
  }
}
