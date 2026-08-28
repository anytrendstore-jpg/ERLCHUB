import type { Collection, ClientSession } from 'mongodb';
import crypto from 'crypto';
import { connectToDatabase, getMongoClient, supportsTransactions } from '@/lib/mongodb';
import { recordDepartmentBudgetEntry } from '@/lib/departmentBudgetServer';
import { fdBudgetCollection } from '@/lib/fdServer';
import type { FDBudgetEntry } from '@/lib/fdTypes';

/** Tesoro del gobierno — mismo patrón que hubPayServer.ts/cashServer.ts: un balance + un ledger, un único camino de escritura. */
export interface TreasuryLedgerEntry {
  id: string;
  amount: number; // delta — negativo = salida (distribución, gasto)
  type: 'tax_revenue' | 'distribution' | 'manual_adjustment' | 'expense';
  description: string;
  departmentCode?: string;
  actorId?: string;
  actorName?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

interface TreasuryStateDoc { id: 'singleton'; balance: number; updatedAt: Date }

export async function treasuryStateCollection(): Promise<Collection<TreasuryStateDoc>> {
  const db = await connectToDatabase();
  const col = db.collection<TreasuryStateDoc>('government_treasury_state');
  await col.createIndex({ id: 1 }, { unique: true }).catch(() => {});
  return col;
}

export async function treasuryLedgerCollection(): Promise<Collection<TreasuryLedgerEntry>> {
  const db = await connectToDatabase();
  const col = db.collection<TreasuryLedgerEntry>('government_treasury_ledger');
  await col.createIndex({ timestamp: -1 }).catch(() => {});
  await col.createIndex({ type: 1 }).catch(() => {});
  return col;
}

export async function getTreasuryBalance(): Promise<number> {
  const col = await treasuryStateCollection();
  const doc = await col.findOne({ id: 'singleton' });
  return doc?.balance || 0;
}

export async function adjustTreasury(entry: {
  delta: number;
  type: TreasuryLedgerEntry['type'];
  description: string;
  departmentCode?: string;
  actorId?: string;
  actorName?: string;
  metadata?: Record<string, unknown>;
}, session?: ClientSession): Promise<TreasuryLedgerEntry> {
  const stateCol = await treasuryStateCollection();
  await stateCol.updateOne(
    { id: 'singleton' },
    { $inc: { balance: entry.delta }, $set: { updatedAt: new Date() } },
    { upsert: true, session }
  );

  const { delta, ...rest } = entry;
  const doc: TreasuryLedgerEntry = { id: crypto.randomUUID(), timestamp: new Date(), amount: delta, ...rest };
  const ledgerCol = await treasuryLedgerCollection();
  await ledgerCol.insertOne(doc, { session });
  return doc;
}

/** Porcentaje de distribución fiscal por departamento — todo configurable, nunca hardcodeado en el reparto. */
export interface TreasuryDistributionRate {
  departmentCode: string; // texto libre: 'LSPD','LSFD','EMS','DOT','DOJ','USCIS','FEDERAL','RESERVE',...
  percentage: number;
  label: string;
  updatedAt: Date;
  updatedBy: string;
}

export async function treasuryDistributionRatesCollection(): Promise<Collection<TreasuryDistributionRate>> {
  const db = await connectToDatabase();
  const col = db.collection<TreasuryDistributionRate>('treasury_distribution_rates');
  await col.createIndex({ departmentCode: 1 }, { unique: true }).catch(() => {});
  return col;
}

const DEFAULT_RATES: { departmentCode: string; percentage: number; label: string }[] = [
  { departmentCode: 'RESERVE', percentage: 20, label: 'Reserva General del Gobierno' },
  { departmentCode: 'LSPD', percentage: 18, label: 'Policía / Seguridad Pública' },
  { departmentCode: 'LSFD', percentage: 12, label: 'Fire Department' },
  { departmentCode: 'EMS', percentage: 12, label: 'Medical Services' },
  { departmentCode: 'DOT', percentage: 8, label: 'Transit / DOT' },
  { departmentCode: 'DOJ', percentage: 7, label: 'Departamento de Justicia' },
  { departmentCode: 'USCIS', percentage: 5, label: 'USCIS / Administración Civil' },
  { departmentCode: 'FEDERAL', percentage: 8, label: 'Agencias Federales' },
  { departmentCode: 'INFRASTRUCTURE', percentage: 5, label: 'Infraestructura y ciudad' },
  { departmentCode: 'EMERGENCY_FUND', percentage: 5, label: 'Fondo de Emergencia' },
];

/** Siembra los valores por defecto del spec UNA sola vez (colección vacía) — nunca pisa configuración ya guardada. */
export async function seedDefaultDistributionRates(updatedBy = 'system'): Promise<void> {
  const col = await treasuryDistributionRatesCollection();
  const count = await col.estimatedDocumentCount();
  if (count > 0) return;
  const now = new Date();
  await col.insertMany(DEFAULT_RATES.map((r) => ({ ...r, updatedAt: now, updatedBy }))).catch(() => {});
}

export async function listDistributionRates(): Promise<TreasuryDistributionRate[]> {
  await seedDefaultDistributionRates();
  const col = await treasuryDistributionRatesCollection();
  return col.find({}).sort({ percentage: -1 }).toArray();
}

export async function upsertDistributionRate(input: { departmentCode: string; percentage: number; label: string; updatedBy: string }): Promise<TreasuryDistributionRate> {
  const col = await treasuryDistributionRatesCollection();
  const doc: TreasuryDistributionRate = {
    departmentCode: input.departmentCode.trim().toUpperCase(),
    percentage: Math.max(0, Math.min(100, input.percentage)),
    label: input.label.trim(),
    updatedAt: new Date(),
    updatedBy: input.updatedBy,
  };
  await col.updateOne({ departmentCode: doc.departmentCode }, { $set: doc }, { upsert: true });
  return doc;
}

export async function removeDistributionRate(departmentCode: string): Promise<void> {
  const col = await treasuryDistributionRatesCollection();
  await col.deleteOne({ departmentCode: departmentCode.trim().toUpperCase() });
}

/**
 * Distribución manual del tesoro (el ciclo semanal automático es una fase posterior). Reparte
 * `amount` (por defecto: todo el balance actual) proporcional a las tasas configuradas,
 * normalizando hacia abajo si la suma de porcentajes excede 100 — nunca reparte más de lo que
 * hay. LSFD es un caso especial: su parte se acredita en la colección `fd_budget` ya existente
 * (no en la nueva `department_budgets`), así FDBudget.tsx sigue funcionando sin tocarlo.
 */
export async function distributeTreasuryFunds(input: { amount?: number; actorId: string; actorName: string }): Promise<{
  totalDistributed: number;
  perDepartment: { departmentCode: string; amount: number }[];
}> {
  const rates = await listDistributionRates();
  if (rates.length === 0) return { totalDistributed: 0, perDepartment: [] };

  const treasuryBalance = await getTreasuryBalance();
  const requested = input.amount ?? treasuryBalance;
  const amount = Math.max(0, Math.min(requested, treasuryBalance));
  if (amount <= 0) return { totalDistributed: 0, perDepartment: [] };

  const sumPct = rates.reduce((s, r) => s + r.percentage, 0);
  const scale = sumPct > 100 ? 100 / sumPct : 1;

  const perDepartment = rates
    .map((r) => ({ departmentCode: r.departmentCode, label: r.label, amount: Math.floor(amount * (r.percentage * scale) / 100) }))
    .filter((d) => d.amount > 0);
  const totalDistributed = perDepartment.reduce((s, d) => s + d.amount, 0);
  if (totalDistributed <= 0) return { totalDistributed: 0, perDepartment: [] };

  const applyDistribution = async (session?: ClientSession) => {
    await adjustTreasury({
      delta: -totalDistributed, type: 'distribution', description: 'Distribución fiscal a departamentos',
      actorId: input.actorId, actorName: input.actorName,
    }, session);

    for (const dep of perDepartment) {
      if (dep.departmentCode === 'LSFD') {
        const col = await fdBudgetCollection();
        const doc: FDBudgetEntry = {
          id: crypto.randomUUID(), type: 'Allocation', amount: dep.amount,
          description: 'Distribución fiscal del Tesoro de Gobierno', category: 'treasury_distribution',
          recordedById: input.actorId, recordedByName: input.actorName, date: new Date(), createdAt: new Date(),
        };
        await col.insertOne(doc, { session });
      } else {
        await recordDepartmentBudgetEntry({
          departmentCode: dep.departmentCode, type: 'Allocation', amount: dep.amount,
          description: 'Distribución fiscal del Tesoro de Gobierno', source: 'treasury_distribution',
          recordedById: input.actorId, recordedByName: input.actorName, date: new Date(),
        }, session);
      }
    }
  };

  if (await supportsTransactions()) {
    const client = await getMongoClient();
    const session = client.startSession();
    try {
      await session.withTransaction(() => applyDistribution(session));
    } finally {
      await session.endSession();
    }
  } else {
    await applyDistribution();
  }

  return { totalDistributed, perDepartment: perDepartment.map(({ departmentCode, amount }) => ({ departmentCode, amount })) };
}
