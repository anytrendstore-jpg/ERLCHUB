import type { Collection } from 'mongodb';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { resolvePlayerIdentity } from '@/lib/whitelistServer';
import { notifyUser } from '@/lib/notificationsServer';
import { careerProfilesCollection } from '@/lib/hubCareerServer';

/** Empresas, vacantes y postulaciones dentro de HubCareer. */

export interface Company {
  id: string;
  name: string;
  logo?: string;
  description: string;
  category: string;
  location: string;
  employeeCount: number;
  website?: string;
  contactInfo?: string;
  ownerId: string;
  admins: string[];
  followers: string[];
  verified: boolean;
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type JobType = 'Tiempo completo' | 'Medio tiempo' | 'Temporal' | 'Prácticas';

export interface JobPosting {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  salary: number;
  location: string;
  type: JobType;
  schedule: string;
  requirements: string;
  description: string;
  positions: number;
  positionsFilled: number;
  closesAt?: Date;
  status: 'open' | 'closed';
  createdAt: Date;
}

export type ApplicationStatus = 'submitted' | 'reviewing' | 'interview' | 'accepted' | 'rejected' | 'closed';

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyId: string;
  companyName: string;
  applicantId: string;
  applicantName: string;
  status: ApplicationStatus;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function companiesCollection(): Promise<Collection<Company>> {
  const db = await connectToDatabase();
  const col = db.collection<Company>('career_companies');
  await col.createIndex({ name: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ category: 1 }).catch(() => {});
  return col;
}

export async function jobPostingsCollection(): Promise<Collection<JobPosting>> {
  const db = await connectToDatabase();
  const col = db.collection<JobPosting>('career_jobs');
  await col.createIndex({ companyId: 1 }).catch(() => {});
  await col.createIndex({ status: 1, createdAt: -1 }).catch(() => {});
  return col;
}

export async function applicationsCollection(): Promise<Collection<JobApplication>> {
  const db = await connectToDatabase();
  const col = db.collection<JobApplication>('career_applications');
  await col.createIndex({ jobId: 1, applicantId: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ applicantId: 1, createdAt: -1 }).catch(() => {});
  await col.createIndex({ companyId: 1, status: 1 }).catch(() => {});
  return col;
}

export function isCompanyAdmin(company: Company, discordId: string): boolean {
  return company.ownerId === discordId || company.admins.includes(discordId);
}

export async function createCompany(ownerId: string, data: { name: string; description: string; category: string; location: string; website?: string; contactInfo?: string; logo?: string }): Promise<{ ok: boolean; error?: string; company?: Company }> {
  const col = await companiesCollection();
  const existing = await col.findOne({ name: data.name });
  if (existing) return { ok: false, error: 'Ya existe una empresa con ese nombre' };

  const now = new Date();
  const company: Company = {
    id: crypto.randomUUID(), ...data, employeeCount: 1, ownerId, admins: [], followers: [],
    verified: false, approved: true, createdAt: now, updatedAt: now,
  };
  await col.insertOne(company);
  return { ok: true, company };
}

export async function postJob(companyId: string, actorId: string, data: Omit<JobPosting, 'id' | 'companyId' | 'companyName' | 'positionsFilled' | 'status' | 'createdAt'>): Promise<{ ok: boolean; error?: string; job?: JobPosting }> {
  const companiesCol = await companiesCollection();
  const company = await companiesCol.findOne({ id: companyId });
  if (!company) return { ok: false, error: 'Empresa no encontrada' };
  if (!isCompanyAdmin(company, actorId)) return { ok: false, error: 'No tienes permisos en esta empresa' };

  const job: JobPosting = {
    id: crypto.randomUUID(), companyId, companyName: company.name, positionsFilled: 0, status: 'open',
    createdAt: new Date(), ...data,
  };
  const col = await jobPostingsCollection();
  await col.insertOne(job);
  return { ok: true, job };
}

export async function applyToJob(applicantId: string, jobId: string, note?: string): Promise<{ ok: boolean; error?: string }> {
  const jobsCol = await jobPostingsCollection();
  const job = await jobsCol.findOne({ id: jobId });
  if (!job) return { ok: false, error: 'Vacante no encontrada' };
  if (job.status !== 'open') return { ok: false, error: 'Esta vacante ya está cerrada' };

  const col = await applicationsCollection();
  const existing = await col.findOne({ jobId, applicantId });
  if (existing) return { ok: false, error: 'Ya te postulaste a esta vacante' };

  const identity = await resolvePlayerIdentity(applicantId, { username: applicantId });
  const now = new Date();
  await col.insertOne({
    id: crypto.randomUUID(), jobId, jobTitle: job.title, companyId: job.companyId, companyName: job.companyName,
    applicantId, applicantName: identity.displayName, status: 'submitted', note, createdAt: now, updatedAt: now,
  });

  const companiesCol = await companiesCollection();
  const company = await companiesCol.findOne({ id: job.companyId });
  if (company) {
    await notifyUser(company.ownerId, { title: 'Nueva postulación', message: `${identity.displayName} se postuló a "${job.title}"`, type: 'info', appId: 'hubcareer' });
  }
  return { ok: true };
}

export async function updateApplicationStatus(actorId: string, applicationId: string, status: ApplicationStatus): Promise<{ ok: boolean; error?: string }> {
  const col = await applicationsCollection();
  const app = await col.findOne({ id: applicationId });
  if (!app) return { ok: false, error: 'Postulación no encontrada' };

  const companiesCol = await companiesCollection();
  const company = await companiesCol.findOne({ id: app.companyId });
  if (!company || !isCompanyAdmin(company, actorId)) return { ok: false, error: 'No tienes permisos en esta empresa' };

  await col.updateOne({ id: applicationId }, { $set: { status, updatedAt: new Date() } });

  if (status === 'accepted') {
    const jobsCol = await jobPostingsCollection();
    const job = await jobsCol.findOne({ id: app.jobId });
    await jobsCol.updateOne({ id: app.jobId }, { $inc: { positionsFilled: 1 } });
    if (job && job.positionsFilled + 1 >= job.positions) {
      await jobsCol.updateOne({ id: app.jobId }, { $set: { status: 'closed' } });
    }
    await companiesCol.updateOne({ id: app.companyId }, { $inc: { employeeCount: 1 } });

    const profilesCol = await careerProfilesCollection();
    await profilesCol.updateOne(
      { discordId: app.applicantId },
      { $set: { currentJob: { title: app.jobTitle, companyId: app.companyId, companyName: app.companyName, since: new Date() }, updatedAt: new Date() } }
    );
  }

  const statusLabel: Record<ApplicationStatus, string> = {
    submitted: 'Enviada', reviewing: 'En revisión', interview: 'Entrevista', accepted: 'Aceptada', rejected: 'Rechazada', closed: 'Cerrada',
  };
  await notifyUser(app.applicantId, {
    title: status === 'accepted' ? '¡Felicidades, fuiste contratado!' : 'Actualización de postulación',
    message: `Tu postulación a "${app.jobTitle}" en ${app.companyName} ahora está: ${statusLabel[status]}`,
    type: status === 'accepted' ? 'success' : status === 'rejected' ? 'error' : 'info', appId: 'hubcareer',
  });
  return { ok: true };
}

export async function toggleFollowCompany(discordId: string, companyId: string): Promise<{ ok: boolean; following?: boolean; error?: string }> {
  const col = await companiesCollection();
  const company = await col.findOne({ id: companyId });
  if (!company) return { ok: false, error: 'Empresa no encontrada' };

  const following = company.followers.includes(discordId);
  await col.updateOne({ id: companyId }, following ? { $pull: { followers: discordId } } : { $addToSet: { followers: discordId } });
  return { ok: true, following: !following };
}

/** Eventos profesionales — siempre organizados por una empresa. */
export interface CareerEvent {
  id: string;
  companyId: string;
  companyName: string;
  name: string;
  date: string;
  time?: string;
  location: string;
  description: string;
  attending: string[];
  notAttending: string[];
  createdAt: Date;
}

export async function careerEventsCollection(): Promise<Collection<CareerEvent>> {
  const db = await connectToDatabase();
  const col = db.collection<CareerEvent>('career_events');
  await col.createIndex({ companyId: 1 }).catch(() => {});
  await col.createIndex({ date: 1 }).catch(() => {});
  return col;
}

export async function createEvent(companyId: string, actorId: string, data: { name: string; date: string; time?: string; location: string; description: string }): Promise<{ ok: boolean; error?: string; event?: CareerEvent }> {
  const companiesCol = await companiesCollection();
  const company = await companiesCol.findOne({ id: companyId });
  if (!company) return { ok: false, error: 'Empresa no encontrada' };
  if (!isCompanyAdmin(company, actorId)) return { ok: false, error: 'No tienes permisos en esta empresa' };

  const event: CareerEvent = {
    id: crypto.randomUUID(), companyId, companyName: company.name, attending: [], notAttending: [], createdAt: new Date(), ...data,
  };
  const col = await careerEventsCollection();
  await col.insertOne(event);

  for (const followerId of company.followers) {
    await notifyUser(followerId, { title: 'Nuevo evento', message: `${company.name} organiza "${data.name}" el ${data.date}`, type: 'info', appId: 'hubcareer' });
  }
  return { ok: true, event };
}

export async function rsvpEvent(discordId: string, eventId: string, attending: boolean): Promise<{ ok: boolean; error?: string }> {
  const col = await careerEventsCollection();
  const event = await col.findOne({ id: eventId });
  if (!event) return { ok: false, error: 'Evento no encontrado' };

  if (attending) {
    await col.updateOne({ id: eventId }, { $addToSet: { attending: discordId }, $pull: { notAttending: discordId } });
  } else {
    await col.updateOne({ id: eventId }, { $addToSet: { notAttending: discordId }, $pull: { attending: discordId } });
  }
  return { ok: true };
}
