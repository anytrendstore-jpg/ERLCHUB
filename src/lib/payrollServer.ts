import type { Collection, ClientSession } from 'mongodb';
import crypto from 'crypto';
import { connectToDatabase, getMongoClient, supportsTransactions } from '@/lib/mongodb';
import { legalFactionsCollection } from '@/lib/factionsServer';
import { careerProfilesCollection } from '@/lib/hubCareerServer';
import { jobPostingsCollection } from '@/lib/hubCareerJobsServer';
import { adjustBalance } from '@/lib/hubPayServer';
import { adjustTreasury } from '@/lib/treasuryServer';
import { recordDepartmentBudgetEntry, getDepartmentBudgetBalance } from '@/lib/departmentBudgetServer';
import { fdBudgetCollection } from '@/lib/fdServer';
import type { FDBudgetEntry } from '@/lib/fdTypes';
import { economyTaxRates } from '@/lib/staffServer';

/**
 * Motor de nómina — primer camino real de dinero automático del hub, sin que un Director
 * apriete un botón cada vez. Cubre dos poblaciones que hoy no se comunican entre sí:
 * facciones de gobierno (legal_factions, salario ya definido por rango) y empleos civiles
 * de HubCareer (career_profiles.currentJob + JobPosting.salary). Reutiliza adjustBalance(),
 * adjustTreasury() y recordDepartmentBudgetEntry()/fdBudgetCollection() ya existentes —
 * ningún camino de escritura nuevo, solo la orquestación semanal encima de ellos.
 */

export interface PayrollRun {
  id: string;
  periodKey: string; // ISO semana UTC, ej. '2026-W35' — guard de idempotencia del cron
  trigger: 'cron' | 'manual';
  actorId?: string;
  actorName?: string;
  startedAt: Date;
  finishedAt?: Date;
  status: 'running' | 'completed' | 'failed';
  totals: { factionGross: number; careerGross: number; taxWithheld: number; paid: number; skipped: number; failed: number };
  error?: string;
}

export interface PayrollEntry {
  id: string;
  runId: string;
  system: 'faction' | 'career';
  recipientId: string;
  recipientName: string;
  sourceCode: string; // faction.abbreviation ó company.id
  sourceLabel: string; // faction.name ó "company.name — puesto"
  grossAmount: number;
  taxWithheld: number;
  netAmount: number;
  status: 'paid' | 'skipped' | 'failed';
  reason?: string; // obligatorio si no es 'paid'
  createdAt: Date;
}

export async function payrollRunsCollection(): Promise<Collection<PayrollRun>> {
  const db = await connectToDatabase();
  const col = db.collection<PayrollRun>('payroll_runs');
  await col.createIndex({ startedAt: -1 }).catch(() => {});
  return col;
}

export async function payrollEntriesCollection(): Promise<Collection<PayrollEntry>> {
  const db = await connectToDatabase();
  const col = db.collection<PayrollEntry>('payroll_entries');
  await col.createIndex({ runId: 1 }).catch(() => {});
  await col.createIndex({ recipientId: 1, createdAt: -1 }).catch(() => {});
  return col;
}

/** ISO semana UTC (ej. '2026-W35') — clave de idempotencia para no pagar dos veces la misma semana por cron. */
/** Semana ISO en UTC (ej. '2026-W35') — se exporta para que treasuryServer.ts use el mismo
 * calendario fiscal semanal al guardar contra doble distribución automática. */
export function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Lee economy_tax_rates{category:'trabajos'} — 0 si no hay doc todavía. Mismo criterio que /api/hubpay/transfer. */
export async function getTrabajosTaxRate(): Promise<number> {
  const col = await economyTaxRates();
  const doc = await col.findOne({ category: 'trabajos' });
  return (doc?.percentage ?? 0) / 100;
}

async function getLsfdBudgetBalance(): Promise<number> {
  const col = await fdBudgetCollection();
  const docs = await col.find({}).toArray();
  const allocated = docs.filter((d) => d.type === 'Allocation').reduce((s, d) => s + d.amount, 0);
  const spent = docs.filter((d) => d.type === 'Expense').reduce((s, d) => s + d.amount, 0);
  return allocated - spent;
}

type BudgetDebit = { kind: 'fd' } | { kind: 'department'; departmentCode: string } | null;

/**
 * Unidad atómica de pago de UN destinatario: retiene 'trabajos', acredita hubPayBalance neto
 * (adjustBalance type:'salary'), acredita el impuesto retenido al Tesoro (adjustTreasury
 * type:'tax_revenue'), y si aplica debita el presupuesto de origen (fd_budget para LSFD,
 * department_budgets para cualquier otro departmentCode). budgetDebit=null para nómina civil
 * (se acuña, no se descuenta de ningún lado — ver runCareerPayroll). Mismo patrón que
 * moveCashToBank: session.withTransaction() si supportsTransactions(), si no, escritura
 * secuencial (debitar presupuesto -> acreditar Tesoro -> acreditar jugador) con reversión de
 * mejor esfuerzo hacia atrás en cuanto un paso falla.
 */
async function payOneSalary(input: {
  runId: string;
  system: 'faction' | 'career';
  recipientId: string;
  recipientName: string;
  sourceCode: string;
  sourceLabel: string;
  grossAmount: number;
  description: string;
  budgetDebit: BudgetDebit;
}): Promise<PayrollEntry> {
  const entriesCol = await payrollEntriesCollection();
  const now = new Date();

  const skip = async (reason: string): Promise<PayrollEntry> => {
    const entry: PayrollEntry = {
      id: crypto.randomUUID(), runId: input.runId, system: input.system,
      recipientId: input.recipientId, recipientName: input.recipientName,
      sourceCode: input.sourceCode, sourceLabel: input.sourceLabel,
      grossAmount: input.grossAmount, taxWithheld: 0, netAmount: 0,
      status: 'skipped', reason, createdAt: now,
    };
    await entriesCol.insertOne(entry);
    return entry;
  };

  if (input.budgetDebit) {
    const balance = input.budgetDebit.kind === 'fd'
      ? await getLsfdBudgetBalance()
      : await getDepartmentBudgetBalance(input.budgetDebit.departmentCode);
    if (balance < input.grossAmount) return skip('Presupuesto departamental insuficiente');
  }

  const rate = await getTrabajosTaxRate();
  const tax = Math.round(input.grossAmount * rate * 100) / 100;
  const net = Math.round((input.grossAmount - tax) * 100) / 100;

  const debitBudget = async (session?: ClientSession) => {
    if (!input.budgetDebit) return;
    if (input.budgetDebit.kind === 'fd') {
      const col = await fdBudgetCollection();
      const doc: FDBudgetEntry = {
        id: crypto.randomUUID(), type: 'Expense', amount: input.grossAmount, description: input.description,
        category: 'payroll', recordedById: 'system', recordedByName: 'Nómina automática', date: now, createdAt: now,
      };
      await col.insertOne(doc, { session });
    } else {
      await recordDepartmentBudgetEntry({
        departmentCode: input.budgetDebit.departmentCode, type: 'Expense', amount: input.grossAmount,
        description: input.description, category: 'payroll', source: 'payroll',
        recordedById: 'system', recordedByName: 'Nómina automática', date: now,
      }, session);
    }
  };

  const run = async (session?: ClientSession) => {
    await debitBudget(session);
    await adjustTreasury({
      delta: tax, type: 'tax_revenue', description: `Impuesto de trabajos — ${input.description}`,
      departmentCode: input.sourceCode, actorId: 'system', actorName: 'Nómina automática',
    }, session);
    await adjustBalance({
      discordId: input.recipientId, delta: net, type: 'salary', description: input.description,
    }, session);
  };

  if (await supportsTransactions()) {
    const client = await getMongoClient();
    const session = client.startSession();
    try {
      await session.withTransaction(() => run(session));
    } catch (error) {
      await session.endSession();
      return skip(error instanceof Error ? error.message : 'Error desconocido al pagar');
    }
    await session.endSession();
  } else {
    try {
      await run();
    } catch (error) {
      // Reversión de mejor esfuerzo: si el pago al jugador falló después de debitar el
      // presupuesto y/o acreditar el Tesoro, se revierte en orden inverso — mismo criterio
      // que moveCashToBank/moveBankToCash cuando el driver no soporta transacciones reales.
      await adjustTreasury({
        delta: -tax, type: 'expense', description: `Reversión automática — pago fallido (${input.description})`,
        actorId: 'system', actorName: 'Nómina automática',
      }).catch(() => {});
      if (input.budgetDebit) {
        if (input.budgetDebit.kind === 'fd') {
          const col = await fdBudgetCollection();
          await col.insertOne({
            id: crypto.randomUUID(), type: 'Allocation', amount: input.grossAmount,
            description: `Reversión automática — pago fallido (${input.description})`, category: 'payroll',
            recordedById: 'system', recordedByName: 'Nómina automática', date: new Date(), createdAt: new Date(),
          }).catch(() => {});
        } else {
          await recordDepartmentBudgetEntry({
            departmentCode: input.budgetDebit.departmentCode, type: 'Allocation', amount: input.grossAmount,
            description: `Reversión automática — pago fallido (${input.description})`, source: 'payroll',
            recordedById: 'system', recordedByName: 'Nómina automática', date: new Date(),
          }).catch(() => {});
        }
      }
      return skip(error instanceof Error ? error.message : 'Error desconocido al pagar');
    }
  }

  const entry: PayrollEntry = {
    id: crypto.randomUUID(), runId: input.runId, system: input.system,
    recipientId: input.recipientId, recipientName: input.recipientName,
    sourceCode: input.sourceCode, sourceLabel: input.sourceLabel,
    grossAmount: input.grossAmount, taxWithheld: tax, netAmount: net,
    status: 'paid', createdAt: now,
  };
  await entriesCol.insertOne(entry);
  return entry;
}

/** Recorre legal_factions -> miembros status:'active' con playerId y rango con salary>0. */
export async function runFactionPayroll(runId: string): Promise<PayrollEntry[]> {
  const col = await legalFactionsCollection();
  const factions = await col.find({}).toArray();
  const entries: PayrollEntry[] = [];
  const entriesCol = await payrollEntriesCollection();

  for (const faction of factions) {
    const code = faction.abbreviation.trim().toUpperCase();
    for (const member of faction.members) {
      if (member.status !== 'active') continue;
      if (!member.playerId) {
        entries.push(await insertSkip(entriesCol, runId, 'faction', member.playerName || 'Sin nombre', member.playerName || '', code, faction.name, 0, 'Miembro sin cuenta de Discord vinculada'));
        continue;
      }
      const rank = faction.ranks.find((r) => r.id === member.rankId);
      if (!rank || rank.salary <= 0) {
        entries.push(await insertSkip(entriesCol, runId, 'faction', member.playerId, member.playerName, code, faction.name, 0, 'Rango sin salario configurado'));
        continue;
      }
      const entry = await payOneSalary({
        runId, system: 'faction', recipientId: member.playerId, recipientName: member.playerName,
        sourceCode: code, sourceLabel: faction.name, grossAmount: rank.salary,
        description: `Sueldo semanal — ${faction.name} (${rank.name})`,
        budgetDebit: code === 'LSFD' ? { kind: 'fd' } : { kind: 'department', departmentCode: code },
      });
      entries.push(entry);
    }
  }
  return entries;
}

/** Recorre career_profiles con currentJob.jobId definido; busca el JobPosting por id para el salario real. */
export async function runCareerPayroll(runId: string): Promise<PayrollEntry[]> {
  const profilesCol = await careerProfilesCollection();
  const profiles = await profilesCol.find({ 'currentJob.companyId': { $exists: true } }).toArray();
  const jobsCol = await jobPostingsCollection();
  const entries: PayrollEntry[] = [];
  const entriesCol = await payrollEntriesCollection();

  for (const profile of profiles) {
    const job = profile.currentJob;
    if (!job) continue;
    if (!job.jobId) {
      entries.push(await insertSkip(entriesCol, runId, 'career', profile.discordId, profile.displayName, job.companyId, job.companyName, 0, 'Perfil sin jobId (vínculo anterior a Fase B)'));
      continue;
    }
    const posting = await jobsCol.findOne({ id: job.jobId });
    if (!posting || posting.salary <= 0) {
      entries.push(await insertSkip(entriesCol, runId, 'career', profile.discordId, profile.displayName, job.companyId, job.companyName, 0, 'Vacante sin salario configurado'));
      continue;
    }
    const entry = await payOneSalary({
      runId, system: 'career', recipientId: profile.discordId, recipientName: profile.displayName,
      sourceCode: job.companyId, sourceLabel: `${job.companyName} — ${job.title}`, grossAmount: posting.salary,
      description: `Sueldo semanal — ${job.companyName} (${job.title})`,
      budgetDebit: null, // se acuña: no existe billetera de empresa hoy — ver plan Fase B
    });
    entries.push(entry);
  }
  return entries;
}

async function insertSkip(
  col: Collection<PayrollEntry>, runId: string, system: 'faction' | 'career',
  recipientId: string, recipientName: string, sourceCode: string, sourceLabel: string,
  grossAmount: number, reason: string,
): Promise<PayrollEntry> {
  const entry: PayrollEntry = {
    id: crypto.randomUUID(), runId, system, recipientId, recipientName, sourceCode, sourceLabel,
    grossAmount, taxWithheld: 0, netAmount: 0, status: 'skipped', reason, createdAt: new Date(),
  };
  await col.insertOne(entry);
  return entry;
}

/**
 * Punto de entrada único (cron y manual). trigger='cron' hace no-op si ya existe un
 * PayrollRun{trigger:'cron', periodKey: semana actual, status:'completed'} — evita doble pago
 * si el cron se dispara dos veces la misma semana. trigger='manual' nunca se bloquea. Nunca
 * lanza — status:'failed'+error queda en el propio PayrollRun en vez de tumbar la ruta.
 */
export async function runFullPayroll(trigger: 'cron' | 'manual', actor?: { id: string; name: string }): Promise<PayrollRun> {
  const runsCol = await payrollRunsCollection();
  const periodKey = isoWeekKey(new Date());

  if (trigger === 'cron') {
    const existing = await runsCol.findOne({ trigger: 'cron', periodKey, status: 'completed' });
    if (existing) return existing;
  }

  const run: PayrollRun = {
    id: crypto.randomUUID(), periodKey, trigger, actorId: actor?.id, actorName: actor?.name,
    startedAt: new Date(), status: 'running',
    totals: { factionGross: 0, careerGross: 0, taxWithheld: 0, paid: 0, skipped: 0, failed: 0 },
  };
  await runsCol.insertOne(run);

  try {
    const [factionEntries, careerEntries] = [await runFactionPayroll(run.id), await runCareerPayroll(run.id)];
    const all = [...factionEntries, ...careerEntries];

    const totals = {
      factionGross: factionEntries.filter((e) => e.status === 'paid').reduce((s, e) => s + e.grossAmount, 0),
      careerGross: careerEntries.filter((e) => e.status === 'paid').reduce((s, e) => s + e.grossAmount, 0),
      taxWithheld: all.reduce((s, e) => s + e.taxWithheld, 0),
      paid: all.filter((e) => e.status === 'paid').length,
      skipped: all.filter((e) => e.status === 'skipped').length,
      failed: all.filter((e) => e.status === 'failed').length,
    };

    await runsCol.updateOne({ id: run.id }, { $set: { status: 'completed', finishedAt: new Date(), totals } });
    return { ...run, status: 'completed', finishedAt: new Date(), totals };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    await runsCol.updateOne({ id: run.id }, { $set: { status: 'failed', finishedAt: new Date(), error: message } });
    return { ...run, status: 'failed', finishedAt: new Date(), error: message };
  }
}

export async function listPayrollRuns(limit = 50): Promise<PayrollRun[]> {
  const col = await payrollRunsCollection();
  return col.find({}).sort({ startedAt: -1 }).limit(limit).toArray();
}

export async function listPayrollEntries(runId: string, limit = 500): Promise<PayrollEntry[]> {
  const col = await payrollEntriesCollection();
  return col.find({ runId }).sort({ createdAt: -1 }).limit(limit).toArray();
}
