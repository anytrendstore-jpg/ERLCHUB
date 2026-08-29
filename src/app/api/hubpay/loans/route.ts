import { NextRequest, NextResponse } from 'next/server';
import { currentBankUser, getHubPayFreeze } from '@/lib/hubPayServer';
import { getActiveLoan, getBorrowingProfile, requestLoan, payOffLoan, getLoanConfig, loansCollection } from '@/lib/loansServer';

export const dynamic = 'force-dynamic';

/** Mi perfil de crédito + préstamo activo (si hay) + historial reciente. */
export async function GET() {
  const me = await currentBankUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const [profile, activeLoan, freeze, config, col] = await Promise.all([
      getBorrowingProfile(me.id),
      getActiveLoan(me.id),
      getHubPayFreeze(me.id),
      getLoanConfig(),
      loansCollection(),
    ]);
    const history = await col.find({ discordId: me.id, status: { $ne: 'active' } }).sort({ updatedAt: -1 }).limit(10).toArray();

    return NextResponse.json({
      success: true,
      profile,
      activeLoan,
      frozen: freeze.frozen,
      frozenReason: freeze.reason,
      termOptions: config.termOptionsWeeks,
      history: history.map(({ _id, ...h }: any) => h),
    });
  } catch (error) {
    console.error('Error leyendo perfil de préstamos:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** action: 'request' | 'payoff' */
export async function POST(request: NextRequest) {
  const me = await currentBankUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const freeze = await getHubPayFreeze(me.id);
    if (freeze.frozen) {
      return NextResponse.json({ success: false, error: `Tu cuenta de HubPay está congelada${freeze.reason ? `: ${freeze.reason}` : ''}` }, { status: 403 });
    }

    const { action, amount, termWeeks } = await request.json();

    if (action === 'request') {
      const parsedAmount = Number(amount);
      const parsedTerm = Number(termWeeks);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || !Number.isFinite(parsedTerm)) {
        return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
      }
      const result = await requestLoan(me.id, Math.round(parsedAmount), parsedTerm);
      if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      return NextResponse.json({ success: true, loan: result.loan });
    }

    if (action === 'payoff') {
      const result = await payOffLoan(me.id);
      if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('Error procesando préstamo:', error);
    return NextResponse.json({ success: false, error: 'No se pudo procesar' }, { status: 500 });
  }
}
