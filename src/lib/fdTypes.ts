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
