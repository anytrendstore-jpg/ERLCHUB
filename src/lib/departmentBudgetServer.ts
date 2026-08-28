import type { Collection, ClientSession } from 'mongodb';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';

/**
 * Presupuesto departamental generalizado — hermano de `fd_budget` (LSFD, con UI propia ya viva
 * en FDBudget.tsx, que se deja intacta) para todo departamento que NO sea LSFD: LSPD, EMS, DOT,
 * DOJ, USCIS, FEDERAL, ... `departmentCode` es texto libre porque no hay un enum fijo de
 * departamentos en el código hoy (las facciones se crean ad hoc desde Staff).
 */
export interface DepartmentBudgetLedgerEntry {
  id: string;
  departmentCode: string;
  type: 'Allocation' | 'Expense';
  amount: number;
  description: string;
  category?: string;
  source?: 'treasury_distribution' | 'manual' | 'payroll';
  recordedById: string;
  recordedByName: string;
  date: Date;
  createdAt: Date;
}

export async function departmentBudgetCollection(): Promise<Collection<DepartmentBudgetLedgerEntry>> {
  const db = await connectToDatabase();
  const col = db.collection<DepartmentBudgetLedgerEntry>('department_budgets');
  await col.createIndex({ departmentCode: 1, date: -1 }).catch(() => {});
  return col;
}

export async function recordDepartmentBudgetEntry(entry: Omit<DepartmentBudgetLedgerEntry, 'id' | 'createdAt'>, session?: ClientSession): Promise<DepartmentBudgetLedgerEntry> {
  const col = await departmentBudgetCollection();
  const doc: DepartmentBudgetLedgerEntry = { id: crypto.randomUUID(), createdAt: new Date(), ...entry };
  await col.insertOne(doc, { session });
  return doc;
}

export async function listDepartmentBudgetEntries(departmentCode: string, limit = 200): Promise<DepartmentBudgetLedgerEntry[]> {
  const col = await departmentBudgetCollection();
  return col.find({ departmentCode: departmentCode.trim().toUpperCase() }).sort({ date: -1 }).limit(limit).toArray();
}

/** Balance = suma de Allocation - suma de Expense. El ledger es la fuente de verdad, el balance se deriva, mismo criterio que FDBudget.tsx. */
export async function getDepartmentBudgetBalance(departmentCode: string): Promise<number> {
  const col = await departmentBudgetCollection();
  const rows = await col.aggregate<{ _id: string; total: number }>([
    { $match: { departmentCode: departmentCode.trim().toUpperCase() } },
    { $group: { _id: '$type', total: { $sum: '$amount' } } },
  ]).toArray();
  const allocated = rows.find((r) => r._id === 'Allocation')?.total || 0;
  const spent = rows.find((r) => r._id === 'Expense')?.total || 0;
  return allocated - spent;
}

/** Balance de todos los departamentos (menos LSFD, que se fusiona del lado de la ruta admin desde fd_budget) — para la tabla del Economy Control Center. */
export async function listAllDepartmentBalances(): Promise<{ departmentCode: string; balance: number }[]> {
  const col = await departmentBudgetCollection();
  const rows = await col.aggregate<{ _id: { departmentCode: string; type: string }; total: number }>([
    { $group: { _id: { departmentCode: '$departmentCode', type: '$type' }, total: { $sum: '$amount' } } },
  ]).toArray();

  const balances = new Map<string, number>();
  for (const r of rows) {
    const current = balances.get(r._id.departmentCode) || 0;
    balances.set(r._id.departmentCode, current + (r._id.type === 'Allocation' ? r.total : -r.total));
  }
  return Array.from(balances.entries()).map(([departmentCode, balance]) => ({ departmentCode, balance })).sort((a, b) => a.departmentCode.localeCompare(b.departmentCode));
}
