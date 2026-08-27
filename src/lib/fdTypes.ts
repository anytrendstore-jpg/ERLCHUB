/**
 * Tipos propios de LSFD — identidad separada de la policía a propósito
 * (ver plan): sin enum de rango fijo, el rango real vive en la facción
 * (legalFactionsCollection, ver factionsServer.ts) y se resuelve en vivo.
 */

export type FireUnitType = "Engine" | "Truck" | "Rescue" | "EMS" | "Battalion";
export type FireUnitStatus = "Available" | "Dispatched" | "En Route" | "On Scene" | "Transporting" | "Out of Service";

export interface Firefighter {
  id: string;
  badgeNumber: string;
  firstName: string;
  lastName: string;
  unit?: FireUnitType;
  callsign?: string;
  status: FireUnitStatus;
  onDuty: boolean;
  hireDate: Date;
  photoUrl?: string;
}

export type FireReportType = "Structure Fire" | "Medical" | "Hazmat" | "Rescue" | "Vehicle Fire" | "Investigation" | "Training" | "Other";
export type FireReportStatus = "Draft" | "Pending Review" | "Approved" | "Rejected";

export interface FireIncidentReport {
  id: string;
  reportNumber: string;
  type: FireReportType;
  status: FireReportStatus;
  title: string;
  narrative: string;
  firefighterId: string;
  firefighterName: string;
  location: string;
  dateTime: Date;
  unitsInvolved: string[];
  signature?: string;
  signedAt?: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type FDMessagePriority = "Normal" | "Urgent";

export interface FDMessage {
  id: string;
  from: string;
  fromName: string;
  to: string;
  toName: string;
  subject: string;
  body: string;
  priority: FDMessagePriority;
  isRead: boolean;
  sentAt: Date;
  readAt?: Date;
}

/**
 * Sistema de Comando de Incidentes — organigrama estándar (Comandante +
 * plana mayor Operaciones/Planificación/Logística/Seguridad) atado a un
 * incidente puntual. Concepto sin análogo en el MDT de policía.
 */
export type CommandRoleKey = "commander" | "operations" | "planning" | "logistics" | "safety";

export interface CommandAssignment {
  role: CommandRoleKey;
  firefighterId?: string;
  firefighterName?: string;
}

export interface IncidentCommand {
  id: string;
  callId: string;
  assignments: CommandAssignment[];
  establishedBy: string;
  establishedAt: Date;
  updatedAt: Date;
}

/** Inventario de equipo/flota — SCBA, mangueras, aparatos, EPP. Concepto sin análogo en el MDT de policía. */
export type FDEquipmentCategory = "Apparatus" | "SCBA" | "Hose" | "Medical" | "Tool" | "PPE" | "Other";
export type FDEquipmentStatus = "In Service" | "Out of Service" | "Maintenance" | "Reserve";

export interface FDEquipment {
  id: string;
  name: string;
  category: FDEquipmentCategory;
  assetTag?: string;
  unit?: string;
  status: FDEquipmentStatus;
  lastInspection?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Academia — certificaciones del personal, con vencimiento real (nunca "certificado para siempre"). */
export type FDCertificationStatus = "Active" | "Expired" | "Revoked";

export interface FDCertification {
  id: string;
  firefighterId: string;
  firefighterName: string;
  name: string;
  issuedAt: Date;
  expiresAt?: Date;
  instructor?: string;
  status: FDCertificationStatus;
  createdAt: Date;
}

/** Pacientes/EMS — registro de atención prehospitalaria (PCR), separado de FireIncidentReport (ese es el reporte del incidente, no del paciente). */
export type FDPatientStatus = "Treated on Scene" | "Transported" | "Refused Care" | "DOA";

export interface FDVitals {
  bp?: string;
  hr?: string;
  rr?: string;
  spo2?: string;
  gcs?: string;
}

export interface FDPatient {
  id: string;
  callId?: string;
  name: string;
  ageEstimate?: string;
  chiefComplaint: string;
  vitals: FDVitals;
  treatment?: string;
  hospital?: string;
  status: FDPatientStatus;
  treatedById: string;
  treatedByName: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Investigaciones — casos de incendio sospechoso/causa a determinar, distintos de un reporte de incidente de rutina. */
export type FDCaseStatus = "Open" | "Under Investigation" | "Closed" | "Referred";

export interface FDCase {
  id: string;
  caseNumber: string;
  title: string;
  narrative: string;
  status: FDCaseStatus;
  relatedCallId?: string;
  leadFirefighterId: string;
  leadFirefighterName: string;
  location: string;
  openedAt: Date;
  closedAt?: Date;
  findings?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type FDAuditAction =
  | "login" | "logout" | "create_report" | "edit_report" | "assign_command"
  | "issue_certification" | "revoke_certification" | "update_equipment" | "send_message" | "modify_call"
  | "open_case" | "update_case" | "log_patient" | "update_patient" | "other";

export interface FDAuditLog {
  id: string;
  firefighterId: string;
  firefighterName: string;
  action: FDAuditAction;
  description: string;
  timestamp: Date;
}

export interface FDState {
  isAuthenticated: boolean;
  currentFirefighter: (Firefighter & { rankName: string; rankLevel: number }) | null;
  activeScreen: FDScreen;
  calls: import("./mdtTypes").Call[];
  reports: FireIncidentReport[];
  personnel: Firefighter[];
  messages: FDMessage[];
}

export type FDScreen = "splash" | "login" | "dashboard" | "cad" | "personnel" | "reports" | "messages";
