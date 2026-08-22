import type { Collection } from 'mongodb';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { currentDiscordUser, resolvePlayerIdentity } from '@/lib/whitelistServer';
import type { Call, Officer, OfficerRank, Division, UnitStatus, Person, Vehicle, Warrant, BOLO, Arrest, Citation, Report, Evidence, Message, AuditLog, CaseFile } from '@/lib/mdtTypes';

export interface MDTOfficerDoc extends Officer {
  discordId: string;
  updatedAt: Date;
}

/** username = Roblox verificado (@handle) · displayName = nombre del personaje (RP). */
export async function currentMDTUser(): Promise<{ id: string; username: string; displayName: string; avatar?: string } | null> {
  const user = currentDiscordUser();
  if (!user) return null;
  const discordAvatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
  const identity = await resolvePlayerIdentity(user.id, { username: user.global_name || user.username, avatar: discordAvatar });
  return { id: user.id, ...identity };
}

export async function mdtOfficersCollection(): Promise<Collection<MDTOfficerDoc>> {
  const db = await connectToDatabase();
  const col = db.collection<MDTOfficerDoc>('mdt_officers');
  await col.createIndex({ discordId: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ onDuty: 1 }).catch(() => {});
  return col;
}

export async function mdtCallsCollection(): Promise<Collection<Call>> {
  const db = await connectToDatabase();
  const col = db.collection<Call>('mdt_calls');
  await col.createIndex({ createdAt: -1 }).catch(() => {});
  await col.createIndex({ status: 1 }).catch(() => {});
  return col;
}

export async function mdtPersonsCollection(): Promise<Collection<Person>> {
  const db = await connectToDatabase();
  const col = db.collection<Person>('mdt_persons');
  await col.createIndex({ firstName: 1, lastName: 1 }).catch(() => {});
  return col;
}

export async function mdtVehiclesCollection(): Promise<Collection<Vehicle>> {
  const db = await connectToDatabase();
  const col = db.collection<Vehicle>('mdt_vehicles');
  await col.createIndex({ plate: 1 }).catch(() => {});
  return col;
}

export async function mdtWarrantsCollection(): Promise<Collection<Warrant>> {
  const db = await connectToDatabase();
  const col = db.collection<Warrant>('mdt_warrants');
  await col.createIndex({ isActive: 1 }).catch(() => {});
  await col.createIndex({ personName: 1 }).catch(() => {});
  return col;
}

export async function mdtBolosCollection(): Promise<Collection<BOLO>> {
  const db = await connectToDatabase();
  const col = db.collection<BOLO>('mdt_bolos');
  await col.createIndex({ status: 1 }).catch(() => {});
  return col;
}

export async function mdtArrestsCollection(): Promise<Collection<Arrest>> {
  const db = await connectToDatabase();
  const col = db.collection<Arrest>('mdt_arrests');
  await col.createIndex({ arrestedAt: -1 }).catch(() => {});
  await col.createIndex({ personId: 1 }).catch(() => {});
  return col;
}

export async function mdtCitationsCollection(): Promise<Collection<Citation>> {
  const db = await connectToDatabase();
  const col = db.collection<Citation>('mdt_citations');
  await col.createIndex({ issuedAt: -1 }).catch(() => {});
  await col.createIndex({ personId: 1 }).catch(() => {});
  return col;
}

export async function mdtReportsCollection(): Promise<Collection<Report>> {
  const db = await connectToDatabase();
  const col = db.collection<Report>('mdt_reports');
  await col.createIndex({ createdAt: -1 }).catch(() => {});
  await col.createIndex({ status: 1 }).catch(() => {});
  return col;
}

export async function mdtEvidenceCollection(): Promise<Collection<Evidence>> {
  const db = await connectToDatabase();
  const col = db.collection<Evidence>('mdt_evidence');
  await col.createIndex({ collectedAt: -1 }).catch(() => {});
  await col.createIndex({ caseNumber: 1 }).catch(() => {});
  return col;
}

export async function mdtMessagesCollection(): Promise<Collection<Message>> {
  const db = await connectToDatabase();
  const col = db.collection<Message>('mdt_messages');
  await col.createIndex({ sentAt: -1 }).catch(() => {});
  await col.createIndex({ to: 1 }).catch(() => {});
  return col;
}

export async function mdtCasesCollection(): Promise<Collection<CaseFile>> {
  const db = await connectToDatabase();
  const col = db.collection<CaseFile>('mdt_cases');
  await col.createIndex({ createdAt: -1 }).catch(() => {});
  await col.createIndex({ status: 1 }).catch(() => {});
  await col.createIndex({ caseNumber: 1 }).catch(() => {});
  await col.createIndex({ relatedPersonIds: 1 }).catch(() => {});
  await col.createIndex({ relatedVehicleIds: 1 }).catch(() => {});
  return col;
}

export async function mdtAuditCollection(): Promise<Collection<AuditLog>> {
  const db = await connectToDatabase();
  const col = db.collection<AuditLog>('mdt_audit');
  await col.createIndex({ timestamp: -1 }).catch(() => {});
  return col;
}

export type DocumentSourceType = 'report' | 'arrest' | 'citation' | 'warrant' | 'bolo';

/**
 * Personalización + bloqueo de un documento generado. Mientras no exista
 * (o exista con locked:false), el documento sigue reflejando los datos en
 * vivo del registro de origen. Al bloquear, fieldOverrides/sectionTextOverride
 * guardan una copia congelada de lo que se veía en ese momento — cambios
 * posteriores al registro original ya no lo afectan.
 */
export interface DocumentOverrideDoc {
  id: string;
  sourceType: DocumentSourceType;
  sourceId: string;
  fieldOverrides: Record<string, string>;
  sectionTextOverride?: string;
  locked: boolean;
  lockedAt?: Date;
  lockedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function mdtDocumentsCollection(): Promise<Collection<DocumentOverrideDoc>> {
  const db = await connectToDatabase();
  const col = db.collection<DocumentOverrideDoc>('mdt_documents');
  await col.createIndex({ sourceType: 1, sourceId: 1 }, { unique: true }).catch(() => {});
  return col;
}

function randomBadge(): string {
  return String(1000 + Math.floor(Math.random() * 9000));
}

/** Crea el perfil de oficial la primera vez que alguien entra al MDT (no crea rango/insignias falsas: empieza como Cadete). */
export async function ensureOfficerProfile(user: { id: string; username: string; displayName: string; avatar?: string }): Promise<MDTOfficerDoc> {
  const col = await mdtOfficersCollection();
  const existing = await col.findOne({ discordId: user.id });
  if (existing) return existing;

  const [firstName, ...rest] = user.displayName.split(' ');
  const doc: MDTOfficerDoc = {
    id: user.id,
    discordId: user.id,
    badgeNumber: randomBadge(),
    firstName: firstName || user.displayName,
    lastName: rest.join(' ') || '—',
    rank: 'Officer' as OfficerRank,
    division: 'Patrol' as Division,
    status: '10-8' as UnitStatus,
    onDuty: false,
    hireDate: new Date(),
    photoUrl: user.avatar,
    updatedAt: new Date(),
  };
  await col.insertOne(doc);
  return doc;
}
