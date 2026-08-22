import crypto from 'crypto';
import type { Collection } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';

/* ------------------------------------------------------------------ *
 * Asuntos Internos — investigaciones sobre el propio equipo de staff.
 * Módulo de alta sensibilidad: solo Directores pueden acceder (ver
 * requireDirector() en las rutas), y cada acceso queda auditado.
 * ------------------------------------------------------------------ */

export type IACaseType =
  | 'abuse_of_power'
  | 'negligence'
  | 'corruption'
  | 'unprofessional_conduct'
  | 'policy_violation'
  | 'other';

export type IAPriority = 'low' | 'medium' | 'high' | 'critical';
export type IAStatus = 'open' | 'investigating' | 'review' | 'resolved' | 'archived';

export interface IAEvidence {
  id: string;
  text: string;
  url?: string;
  addedBy: string;
  addedAt: Date;
}

export interface IANote {
  id: string;
  body: string;
  author: string;
  createdAt: Date;
}

export interface IATimelineEvent {
  id: string;
  label: string;
  createdAt: Date;
}

export interface InternalAffairsCase {
  id: string;
  caseNumber: number;
  targetStaffId?: string;
  targetStaffName: string;
  department?: string;
  type: IACaseType;
  priority: IAPriority;
  status: IAStatus;
  investigatorId?: string;
  investigatorName?: string;
  description: string;
  evidence: IAEvidence[];
  notes: IANote[];
  timeline: IATimelineEvent[];
  resolution?: string;
  createdBy: string;
  createdById?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function iaCasesCollection(): Promise<Collection<InternalAffairsCase>> {
  const db = await connectToDatabase();
  const col = db.collection<InternalAffairsCase>('staff_internal_affairs_cases');
  await col.createIndex({ createdAt: -1 }).catch(() => {});
  await col.createIndex({ status: 1 }).catch(() => {});
  return col;
}

export async function nextIACaseNumber(col: Collection<InternalAffairsCase>): Promise<number> {
  const last = await col.find({}).sort({ caseNumber: -1 }).limit(1).toArray();
  return (last[0]?.caseNumber || 0) + 1;
}

export function newIACase(input: {
  targetStaffId?: string;
  targetStaffName: string;
  department?: string;
  type: IACaseType;
  priority: IAPriority;
  description: string;
  createdBy: string;
  createdById?: string;
  caseNumber: number;
}): InternalAffairsCase {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    caseNumber: input.caseNumber,
    targetStaffId: input.targetStaffId,
    targetStaffName: input.targetStaffName,
    department: input.department,
    type: input.type,
    priority: input.priority,
    status: 'open',
    description: input.description,
    evidence: [],
    notes: [],
    timeline: [{ id: crypto.randomUUID(), label: 'Caso abierto', createdAt: now }],
    createdBy: input.createdBy,
    createdById: input.createdById,
    createdAt: now,
    updatedAt: now,
  };
}
