import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { listAllDepartmentBalances, listDepartmentBudgetEntries, recordDepartmentBudgetEntry } from '@/lib/departmentBudgetServer';
import { fdBudgetCollection } from '@/lib/fdServer';
import type { FDBudgetEntry } from '@/lib/fdTypes';
import { logStaffAction, staffIdentity } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

async function getLsfdBalance(): Promise<number> {
  const col = await fdBudgetCollection();
  const docs = await col.find({}).toArray();
  const allocated = docs.filter((d) => d.type === 'Allocation').reduce((s, d) => s + d.amount, 0);
  const spent = docs.filter((d) => d.type === 'Expense').reduce((s, d) => s + d.amount, 0);
  return allocated - spent;
}

/**
 * GET sin query: balance de todos los departamentos, incluida una fila sintética de LSFD
 * calculada desde `fd_budget` (colección aparte, ver treasuryServer.ts). GET ?departmentCode=X:
 * el historial de movimientos de ese departamento (LSFD lee de `fd_budget`, el resto de `department_budgets`).
 */
export async function GET(request: NextRequest) {
  const denied = await requirePermission('economy.view');
  if (denied) return denied;

  try {
    const departmentCode = request.nextUrl.searchParams.get('departmentCode');

    if (departmentCode) {
      const code = departmentCode.trim().toUpperCase();
      if (code === 'LSFD') {
        const col = await fdBudgetCollection();
        const entries = await col.find({}).sort({ date: -1 }).limit(200).toArray();
        return NextResponse.json({ success: true, entries: entries.map(({ _id, ...e }: any) => e) });
      }
      const entries = await listDepartmentBudgetEntries(code);
      return NextResponse.json({ success: true, entries });
    }

    const [balances, lsfdBalance] = await Promise.all([listAllDepartmentBalances(), getLsfdBalance()]);
    const merged = [...balances.filter((b) => b.departmentCode !== 'LSFD'), { departmentCode: 'LSFD', balance: lsfdBalance }]
      .sort((a, b) => a.departmentCode.localeCompare(b.departmentCode));

    return NextResponse.json({ success: true, balances: merged });
  } catch (error) {
    console.error('Error leyendo presupuestos departamentales:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requirePermission('economy.manage');
  if (denied) return denied;

  try {
    const { departmentCode, type, amount, description, category } = await request.json();
    const amt = Number(amount);
    if (!departmentCode?.trim() || !['Allocation', 'Expense'].includes(type) || !Number.isFinite(amt) || amt <= 0 || !description?.trim()) {
      return NextResponse.json({ success: false, error: 'Faltan datos válidos' }, { status: 400 });
    }

    const identity = staffIdentity();
    const code = departmentCode.trim().toUpperCase();
    const now = new Date();

    if (code === 'LSFD') {
      const col = await fdBudgetCollection();
      const doc: FDBudgetEntry = {
        id: crypto.randomUUID(), type, amount: amt, description: description.trim(), category: category?.trim() || undefined,
        recordedById: identity?.id || 'staff', recordedByName: identity?.name || 'Director', date: now, createdAt: now,
      };
      await col.insertOne(doc);
    } else {
      await recordDepartmentBudgetEntry({
        departmentCode: code, type, amount: amt, description: description.trim(), category: category?.trim() || undefined,
        source: 'manual', recordedById: identity?.id || 'staff', recordedByName: identity?.name || 'Director', date: now,
      });
    }

    await logStaffAction({
      type: 'department_budget_entry_recorded',
      category: 'ECONOMIA',
      actor: identity?.name || 'Director',
      actorId: identity?.id,
      description: `${identity?.name || 'Director'} registró ${type === 'Allocation' ? 'una asignación' : 'un gasto'} de $${amt} en ${code} — ${description.trim()}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error registrando movimiento de presupuesto departamental:', error);
    return NextResponse.json({ success: false, error: 'No se pudo registrar' }, { status: 500 });
  }
}
