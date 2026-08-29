import type { Collection } from 'mongodb';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { adjustBalance, getBalance, usersCollection } from '@/lib/hubPayServer';
import { notifyUser } from '@/lib/notificationsServer';
import { isoWeekKey } from '@/lib/payrollServer';

/**
 * Capa financiera sobre HubPay: préstamos con interés simple, credit score real (nace de la
 * historia de pagos, no se inventa) y embargo automático (reutiliza el freeze de HubPay que ya
 * existe — el mismo que usa Staff para congelar una cuenta) cuando un préstamo entra en default.
 * Deliberadamente UN solo tipo de préstamo (no personal/vehicular/hipotecario por separado) y sin
 * integración con MDT/Justicia — eso es un sistema aparte, no se fabrica acá.
 */

export interface LoanDoc {
  id: string;
  discordId: string;
  principal: number;
  interestRate: number; // % total del período, no compuesto
  termWeeks: number;
  weeklyPayment: number;
  remainingBalance: number;
  status: 'active' | 'paid' | 'defaulted';
  missedPayments: number;
  lastPaymentPeriodKey?: string;
  nextPaymentDate: Date;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  defaultedAt?: Date;
}

export interface CreditScoreDoc {
  discordId: string;
  score: number;
  updatedAt: Date;
}

export interface LoanConfigDoc {
  id: 'singleton';
  /** Score mínimo para poder pedir un préstamo. */
  minScoreToBorrow: number;
  /** Tramos de tasa de interés total (%) según credit score — de mejor a peor. */
  rateTiers: { minScore: number; ratePct: number; label: string }[];
  /** Múltiplo del saldo disponible en HubPay que define el monto máximo prestable. */
  maxLoanMultiplier: number;
  /** Tope absoluto, sin importar balance/score. */
  maxLoanAmount: number;
  termOptionsWeeks: number[];
  missedPaymentsBeforeDefault: number;
  pointsOnTimePayment: number;
  pointsOnMissedPayment: number;
  pointsOnPaidOff: number;
  pointsOnDefault: number;
  updatedAt: Date;
  updatedBy: string;
}

const DEFAULT_CONFIG: Omit<LoanConfigDoc, 'id' | 'updatedAt' | 'updatedBy'> = {
  minScoreToBorrow: 400,
  rateTiers: [
    { minScore: 750, ratePct: 5, label: 'Excelente' },
    { minScore: 650, ratePct: 8.5, label: 'Bueno' },
    { minScore: 550, ratePct: 12, label: 'Regular' },
    { minScore: 0, ratePct: 18, label: 'Riesgo alto' },
  ],
  maxLoanMultiplier: 3,
  maxLoanAmount: 500000,
  termOptionsWeeks: [4, 8, 12],
  missedPaymentsBeforeDefault: 3,
  pointsOnTimePayment: 2,
  pointsOnMissedPayment: -40,
  pointsOnPaidOff: 25,
  pointsOnDefault: -100,
};

const BASE_SCORE = 650;
const SCORE_MIN = 300;
const SCORE_MAX = 850;

export async function loansCollection(): Promise<Collection<LoanDoc>> {
  const db = await connectToDatabase();
  const col = db.collection<LoanDoc>('loans');
  await col.createIndex({ discordId: 1, status: 1 }).catch(() => {});
  return col;
}

export async function creditScoresCollection(): Promise<Collection<CreditScoreDoc>> {
  const db = await connectToDatabase();
  const col = db.collection<CreditScoreDoc>('credit_scores');
  await col.createIndex({ discordId: 1 }, { unique: true }).catch(() => {});
  return col;
}

async function loanConfigCollection(): Promise<Collection<LoanConfigDoc>> {
  const db = await connectToDatabase();
  const col = db.collection<LoanConfigDoc>('loan_config');
  await col.createIndex({ id: 1 }, { unique: true }).catch(() => {});
  return col;
}

export async function getLoanConfig(): Promise<LoanConfigDoc> {
  const col = await loanConfigCollection();
  const doc = await col.findOne({ id: 'singleton' });
  if (doc) return doc;
  return { id: 'singleton', ...DEFAULT_CONFIG, updatedAt: new Date(), updatedBy: 'system' };
}

export async function updateLoanConfig(input: Partial<Omit<LoanConfigDoc, 'id' | 'updatedAt' | 'updatedBy'>> & { updatedBy: string }): Promise<LoanConfigDoc> {
  const current = await getLoanConfig();
  const col = await loanConfigCollection();
  const { updatedBy, ...rest } = input;
  const doc: LoanConfigDoc = { ...current, ...rest, id: 'singleton', updatedAt: new Date(), updatedBy };
  await col.updateOne({ id: 'singleton' }, { $set: doc }, { upsert: true });
  return doc;
}

export async function getCreditScore(discordId: string): Promise<number> {
  const col = await creditScoresCollection();
  const doc = await col.findOne({ discordId });
  return doc?.score ?? BASE_SCORE;
}

async function adjustCreditScore(discordId: string, delta: number): Promise<number> {
  const col = await creditScoresCollection();
  const current = await getCreditScore(discordId);
  const next = Math.max(SCORE_MIN, Math.min(SCORE_MAX, current + delta));
  await col.updateOne({ discordId }, { $set: { score: next, updatedAt: new Date() } }, { upsert: true });
  return next;
}

function rateForScore(score: number, config: LoanConfigDoc): { ratePct: number; label: string } {
  const sorted = [...config.rateTiers].sort((a, b) => b.minScore - a.minScore);
  const tier = sorted.find((t) => score >= t.minScore) || sorted[sorted.length - 1];
  return { ratePct: tier.ratePct, label: tier.label };
}

export async function getActiveLoan(discordId: string): Promise<LoanDoc | null> {
  const col = await loansCollection();
  return col.findOne({ discordId, status: 'active' });
}

export async function getBorrowingProfile(discordId: string): Promise<{
  score: number; rate: { ratePct: number; label: string }; maxAmount: number; eligible: boolean; hasActiveLoan: boolean;
}> {
  const config = await getLoanConfig();
  const score = await getCreditScore(discordId);
  const rate = rateForScore(score, config);
  const balance = await getBalance(discordId);
  const maxAmount = Math.min(config.maxLoanAmount, Math.round(balance * config.maxLoanMultiplier));
  const activeLoan = await getActiveLoan(discordId);
  return { score, rate, maxAmount, eligible: score >= config.minScoreToBorrow, hasActiveLoan: !!activeLoan };
}

/** Interés simple sobre el capital, repartido en partes iguales por semana — sin capitalización. */
function computeWeeklyPayment(principal: number, ratePct: number, termWeeks: number): number {
  const totalToRepay = principal * (1 + ratePct / 100);
  return Math.ceil(totalToRepay / termWeeks);
}

export async function requestLoan(discordId: string, amount: number, termWeeks: number): Promise<{ ok: boolean; error?: string; loan?: LoanDoc }> {
  const config = await getLoanConfig();
  if (!config.termOptionsWeeks.includes(termWeeks)) return { ok: false, error: 'Plazo no válido' };

  const profile = await getBorrowingProfile(discordId);
  if (profile.hasActiveLoan) return { ok: false, error: 'Ya tenés un préstamo activo — pagalo antes de pedir otro' };
  if (!profile.eligible) return { ok: false, error: `Tu credit score (${profile.score}) no alcanza el mínimo para pedir un préstamo` };
  if (amount <= 0 || amount > profile.maxAmount) return { ok: false, error: `Monto no válido — máximo disponible: $${profile.maxAmount.toLocaleString('es-CO')}` };

  const weeklyPayment = computeWeeklyPayment(amount, profile.rate.ratePct, termWeeks);
  const now = new Date();
  const nextPaymentDate = new Date(now.getTime() + 7 * 86400000);

  const loan: LoanDoc = {
    id: crypto.randomUUID(),
    discordId,
    principal: amount,
    interestRate: profile.rate.ratePct,
    termWeeks,
    weeklyPayment,
    remainingBalance: Math.ceil(amount * (1 + profile.rate.ratePct / 100)),
    status: 'active',
    missedPayments: 0,
    nextPaymentDate,
    createdAt: now,
    updatedAt: now,
  };

  const col = await loansCollection();
  await col.insertOne(loan);

  await adjustBalance({
    discordId, delta: amount, type: 'deposit',
    description: `Préstamo aprobado (${termWeeks} semanas, ${profile.rate.ratePct}% interés)`,
    metadata: { loanId: loan.id },
  });

  await notifyUser(discordId, {
    title: 'Préstamo aprobado',
    message: `Recibiste $${amount.toLocaleString('es-CO')}. Cuota semanal: $${weeklyPayment.toLocaleString('es-CO')} por ${termWeeks} semanas.`,
    type: 'success', appId: 'hubpay',
  });

  return { ok: true, loan };
}

async function garnishAccount(discordId: string, reason: string): Promise<void> {
  const col = await usersCollection();
  await col.updateOne(
    { discordId },
    { $set: { hubPayFrozen: true, hubPayFrozenReason: reason, hubPayFrozenAt: new Date(), hubPayFrozenBy: 'Sistema de préstamos' } },
    { upsert: true }
  );
}

/**
 * Corrida semanal — mismo criterio de idempotencia que runFullPayroll()/runAutomaticTreasuryDistribution():
 * un préstamo ya cobrado en la semana ISO actual no se vuelve a tocar (lastPaymentPeriodKey).
 * Por cada préstamo activo con pago vencido: intenta cobrar la cuota. Si no hay saldo, cuenta como
 * atraso (baja el score); al llegar a missedPaymentsBeforeDefault, el préstamo pasa a 'defaulted'
 * y la cuenta de HubPay se congela (embargo real, mismo mecanismo que ya usa Staff) hasta que el
 * jugador pague la deuda o Staff libere la cuenta manualmente.
 */
export async function runWeeklyLoanPayments(): Promise<{ processed: number; paid: number; missed: number; defaulted: number; completed: number }> {
  const periodKey = isoWeekKey(new Date());
  const col = await loansCollection();
  const dueLoans = await col.find({ status: 'active', nextPaymentDate: { $lte: new Date() } }).toArray();

  let paid = 0, missed = 0, defaulted = 0, completed = 0;
  const config = await getLoanConfig();

  for (const loan of dueLoans) {
    if (loan.lastPaymentPeriodKey === periodKey) continue; // ya cobrado esta semana (reintento del cron)

    const balance = await getBalance(loan.discordId);
    const payment = Math.min(loan.weeklyPayment, loan.remainingBalance);
    const now = new Date();

    if (balance >= payment) {
      await adjustBalance({
        discordId: loan.discordId, delta: -payment, type: 'expense',
        description: 'Cuota de préstamo', metadata: { loanId: loan.id },
      });
      const remaining = loan.remainingBalance - payment;
      const newScore = await adjustCreditScore(loan.discordId, config.pointsOnTimePayment);

      if (remaining <= 0) {
        await col.updateOne({ id: loan.id }, { $set: { status: 'paid', remainingBalance: 0, updatedAt: now, paidAt: now, lastPaymentPeriodKey: periodKey } });
        await adjustCreditScore(loan.discordId, config.pointsOnPaidOff);
        await notifyUser(loan.discordId, { title: 'Préstamo pagado por completo', message: '¡Felicitaciones! Tu credit score mejoró.', type: 'success', appId: 'hubpay' });
        completed++;
      } else {
        await col.updateOne({ id: loan.id }, {
          $set: { remainingBalance: remaining, updatedAt: now, lastPaymentPeriodKey: periodKey, nextPaymentDate: new Date(now.getTime() + 7 * 86400000) },
        });
        await notifyUser(loan.discordId, { title: 'Cuota de préstamo pagada', message: `Se descontaron $${payment.toLocaleString('es-CO')}. Restante: $${remaining.toLocaleString('es-CO')}. Credit score: ${newScore}.`, type: 'info', appId: 'hubpay' });
      }
      paid++;
    } else {
      const missedPayments = loan.missedPayments + 1;
      const newScore = await adjustCreditScore(loan.discordId, config.pointsOnMissedPayment);

      if (missedPayments >= config.missedPaymentsBeforeDefault) {
        await col.updateOne({ id: loan.id }, { $set: { status: 'defaulted', missedPayments, updatedAt: now, defaultedAt: now, lastPaymentPeriodKey: periodKey } });
        await adjustCreditScore(loan.discordId, config.pointsOnDefault);
        await garnishAccount(loan.discordId, `Préstamo en default — $${loan.remainingBalance.toLocaleString('es-CO')} sin pagar tras ${missedPayments} cuotas perdidas`);
        await notifyUser(loan.discordId, {
          title: '⚠ Préstamo en default — cuenta embargada',
          message: `Tu cuenta de HubPay quedó congelada por falta de pago. Contactá a Staff para regularizar tu deuda de $${loan.remainingBalance.toLocaleString('es-CO')}.`,
          type: 'error', appId: 'hubpay',
        });
        defaulted++;
      } else {
        await col.updateOne({ id: loan.id }, {
          $set: { missedPayments, updatedAt: now, lastPaymentPeriodKey: periodKey, nextPaymentDate: new Date(now.getTime() + 7 * 86400000) },
        });
        await notifyUser(loan.discordId, {
          title: '⚠ Cuota de préstamo no pagada',
          message: `No tenías saldo suficiente ($${payment.toLocaleString('es-CO')}). Atraso ${missedPayments}/${config.missedPaymentsBeforeDefault}. Credit score: ${newScore}.`,
          type: 'warning', appId: 'hubpay',
        });
        missed++;
      }
    }
  }

  return { processed: dueLoans.length, paid, missed, defaulted, completed };
}

/** Pago anticipado voluntario de todo lo que queda — no hay penalidad por adelantar. */
export async function payOffLoan(discordId: string): Promise<{ ok: boolean; error?: string }> {
  const loan = await getActiveLoan(discordId);
  if (!loan) return { ok: false, error: 'No tenés un préstamo activo' };

  const balance = await getBalance(discordId);
  if (balance < loan.remainingBalance) return { ok: false, error: 'Saldo insuficiente para saldar el préstamo completo' };

  await adjustBalance({
    discordId, delta: -loan.remainingBalance, type: 'expense',
    description: 'Pago anticipado de préstamo', metadata: { loanId: loan.id },
  });
  const col = await loansCollection();
  await col.updateOne({ id: loan.id }, { $set: { status: 'paid', remainingBalance: 0, updatedAt: new Date(), paidAt: new Date() } });
  const config = await getLoanConfig();
  await adjustCreditScore(discordId, config.pointsOnPaidOff);

  return { ok: true };
}

export async function listAllLoans(status?: LoanDoc['status'], limit = 100): Promise<LoanDoc[]> {
  const col = await loansCollection();
  const query = status ? { status } : {};
  return col.find(query).sort({ updatedAt: -1 }).limit(limit).toArray();
}

/** Libera un embargo manualmente desde Staff, sin borrar la deuda (el préstamo sigue 'defaulted' — esto solo descongela la cuenta). */
export async function releaseGarnishment(discordId: string, staffName: string): Promise<void> {
  const col = await usersCollection();
  await col.updateOne(
    { discordId },
    { $set: { hubPayFrozen: false }, $unset: { hubPayFrozenReason: '', hubPayFrozenAt: '', hubPayFrozenBy: '' } }
  );
  await notifyUser(discordId, {
    title: 'Cuenta de HubPay liberada',
    message: `${staffName} liberó el embargo de tu cuenta.`,
    type: 'success', appId: 'hubpay',
  });
}
