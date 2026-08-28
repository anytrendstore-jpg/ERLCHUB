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

/** Presupuesto — asignaciones/gastos del departamento. Solo mando registra movimientos (ver COMMAND_LEVEL en /api/fd/budget). */
export type FDBudgetEntryType = "Allocation" | "Expense";

export interface FDBudgetEntry {
  id: string;
  type: FDBudgetEntryType;
  amount: number;
  description: string;
  category?: string;
  recordedById: string;
  recordedByName: string;
  date: Date;
  createdAt: Date;
}

/** Órdenes de servicio — pedidos de mantenimiento/trabajo, puede referenciar un ítem de fd_equipment. Baja fricción: cualquier miembro activo abre/actualiza, como los reportes. */
export type FDServiceOrderPriority = "Low" | "Medium" | "High";
export type FDServiceOrderStatus = "Open" | "In Progress" | "Completed" | "Cancelled";

export interface FDServiceOrder {
  id: string;
  orderNumber: string;
  subject: string;
  description: string;
  priority: FDServiceOrderPriority;
  status: FDServiceOrderStatus;
  relatedEquipment?: string;
  requestedById: string;
  requestedByName: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/** Mutual Aid — asistencia solicitada a otra agencia (LSPD, condados vecinos, etc.) durante un incidente mayor. La agencia es texto libre: no hay otro FD en el sistema para referenciar. */
export type FDMutualAidStatus = "Requested" | "En Route" | "On Scene" | "Completed" | "Cancelled";

export interface FDMutualAidRequest {
  id: string;
  requestNumber: string;
  agency: string;
  reason: string;
  callId?: string;
  status: FDMutualAidStatus;
  requestedById: string;
  requestedByName: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

/** Timeline de incidentes — eventos reales agregados server-side desde fd/calls y fd/command (cambios de estado, unidades, comando), no un log inventado. */
export interface FDIncidentTimelineEntry {
  id: string;
  callId: string;
  event: string;
  description: string;
  actorId: string;
  actorName: string;
  timestamp: Date;
}

/** Estaciones de bomberos — directorio de parques, sin análogo en el MDT de policía. */
export interface FDStation {
  id: string;
  name: string;
  address: string;
  apparatus: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Turnos — asignación de horario por bombero. Solo mando programa turnos, cualquiera ve los propios y los del resto. */
export type FDShiftStatus = "Scheduled" | "Active" | "Completed" | "Missed";

export interface FDShift {
  id: string;
  firefighterId: string;
  firefighterName: string;
  start: Date;
  end: Date;
  station?: string;
  status: FDShiftStatus;
  createdById: string;
  createdByName: string;
  createdAt: Date;
}

/** Promociones — historial de ascensos. Cualquiera lo consulta, solo mando registra un ascenso real. */
export type FDPromotionStatus = "Pending" | "Approved" | "Denied";

export interface FDPromotion {
  id: string;
  firefighterId: string;
  firefighterName: string;
  fromRank: string;
  toRank: string;
  reason: string;
  status: FDPromotionStatus;
  requestedById: string;
  requestedByName: string;
  decidedById?: string;
  decidedByName?: string;
  createdAt: Date;
  decidedAt?: Date;
}

/** Sanciones — expediente disciplinario, sensible: solo mando lo ve y lo emite (mismo umbral que Auditoría). */
export type FDSanctionSeverity = "Verbal" | "Escrita" | "Suspensión" | "Baja";

export interface FDSanction {
  id: string;
  firefighterId: string;
  firefighterName: string;
  reason: string;
  severity: FDSanctionSeverity;
  issuedById: string;
  issuedByName: string;
  createdAt: Date;
}

export type FDAuditAction =
  | "login" | "logout" | "create_report" | "edit_report" | "assign_command"
  | "issue_certification" | "revoke_certification" | "update_equipment" | "send_message" | "modify_call"
  | "open_case" | "update_case" | "log_patient" | "update_patient"
  | "record_budget_entry" | "create_service_order" | "update_service_order"
  | "log_mutual_aid" | "update_mutual_aid"
  | "create_station" | "update_station" | "schedule_shift" | "update_shift"
  | "record_promotion" | "issue_sanction" | "other";

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
