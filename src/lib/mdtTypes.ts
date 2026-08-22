export type OfficerRank = "Officer" | "Sergeant" | "Lieutenant" | "Captain" | "Chief";
export type Division = "Patrol" | "Traffic" | "K9" | "SWAT" | "Detectives" | "Administration";
export type UnitStatus = "10-8" | "10-7" | "10-6" | "10-97" | "10-15" | "10-23";

export interface MDTUser {
  id: string;
  badgeNumber: string;
  username: string;
  password: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Officer {
  id: string;
  badgeNumber: string;
  firstName: string;
  lastName: string;
  rank: OfficerRank;
  division: Division;
  currentUnit?: string;
  status: UnitStatus;
  radioChannel?: string;
  onDuty: boolean;
  hireDate: Date;
  photoUrl?: string;
}

export type CallPriority = "Low" | "Medium" | "High" | "Emergency";
export type CallType = "Traffic Stop" | "Suspicious Activity" | "Robbery" | "Assault" | "Shots Fired" | "Welfare Check" | "Disturbance" | "Traffic Accident" | "Cyber Crime" | "Other";
export type CallStatus = "Pending" | "En Route" | "On Scene" | "Resolved" | "Cancelled";

export interface CallSuspect {
  plate: string;
  name: string;
}

export interface Call {
  id: string;
  callNumber: string;
  type: CallType;
  priority: CallPriority;
  status: CallStatus;
  location: string;
  coordinates?: { x: number; y: number };
  description: string;
  caller?: string;
  assignedUnits: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  notes: string[];
  /** Campos del panel "Datos" (redisño CAD). */
  title?: string;
  scene?: string;
  incidentStart?: Date;
  incidentEnd?: Date;
  details?: string;
  /** Campos del panel "Información Adicional". */
  officersInvolved?: string[];
  victims?: string[];
  suspects?: CallSuspect[];
  witnesses?: string[];
  boloSuspect?: string;
  boloVehicle?: string;
  vehicleImpound?: string;
  citizenStatement?: string;
  forensicsReport?: string;
  evidenceLogged?: string[];
}

export type RiskLevel = "None" | "Caution" | "Dangerous" | "Armed & Dangerous";
export type Gender = "Male" | "Female" | "Other";
export type LicenseStatus = "Valid" | "Suspended" | "Revoked" | "Expired";

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: Gender;
  height: string;
  weight: string;
  eyeColor: string;
  hairColor: string;
  address: string;
  phoneNumber?: string;
  riskLevel: RiskLevel;
  flags: string[];
  licenses: {
    driver: LicenseStatus;
    weapon: LicenseStatus;
    pilot: LicenseStatus;
  };
  mugshot?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  make: string;
  year: number;
  color: string;
  vin?: string;
  registeredOwner: string;
  isStolen: boolean;
  flags: string[];
  insurance: "Valid" | "Expired" | "None";
  registration: "Valid" | "Expired";
  lastSeenLocation?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Weapon {
  id: string;
  serialNumber: string;
  type: string;
  make: string;
  model: string;
  caliber?: string;
  registeredOwner?: string;
  isStolen: boolean;
  flags: string[];
  createdAt: Date;
}

export interface Warrant {
  id: string;
  warrantNumber: string;
  personId: string;
  personName: string;
  type: "Arrest" | "Search" | "Bench";
  charges: string[];
  issuedBy: string;
  issuedDate: Date;
  expiryDate?: Date;
  isActive: boolean;
  bailAmount?: number;
  notes: string;
}

export type BOLOType = "Person" | "Vehicle" | "Other";
export type BOLOStatus = "Active" | "Cancelled" | "Resolved";

export interface BOLO {
  id: string;
  boloNumber: string;
  type: BOLOType;
  title: string;
  description: string;
  subject: string;
  location?: string;
  issuedBy: string;
  status: BOLOStatus;
  priority: CallPriority;
  createdAt: Date;
  expiresAt?: Date;
}

export type ReportType = "Incident" | "Arrest" | "Traffic" | "Investigation" | "Use of Force";
export type ReportStatus = "Draft" | "Pending Review" | "Approved" | "Rejected";

export interface Report {
  id: string;
  reportNumber: string;
  type: ReportType;
  status: ReportStatus;
  title: string;
  narrative: string;
  officerId: string;
  officerName: string;
  location: string;
  dateTime: Date;
  involvedPersons: string[];
  involvedVehicles: string[];
  evidence: string[];
  signature?: string;
  signedAt?: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ViolationType = "Moving" | "Parking" | "Equipment" | "Administrative";
export type CitationStatus = "Issued" | "Paid" | "Overdue" | "Contested" | "Dismissed";

export interface Citation {
  id: string;
  citationNumber: string;
  violationType: ViolationType;
  violation: string;
  personId: string;
  personName: string;
  vehicleId?: string;
  vehiclePlate?: string;
  location: string;
  fineAmount: number;
  dueDate: Date;
  status: CitationStatus;
  issuedBy: string;
  issuedAt: Date;
  notes?: string;
}

export type ChargeSeverity = "Infraction" | "Misdemeanor" | "Felony";

export interface Charge {
  id: string;
  code: string;
  title: string;
  description: string;
  severity: ChargeSeverity;
  fine: number;
  jailTime: number; 
  category: string;
}

export interface Arrest {
  id: string;
  arrestNumber: string;
  caseNumber: string;
  personId: string;
  personName: string;
  mugshot?: string;
  charges: {
    chargeId: string;
    chargeCode: string;
    chargeTitle: string;
    severity: ChargeSeverity;
    fine: number;
    jailTime: number;
  }[];
  totalFine: number;
  totalJailTime: number;
  arrestedBy: string;
  arrestedAt: Date;
  location: string;
  narrative: string;
  confiscatedItems: string[];
  signature?: string;
  signedAt?: Date;
  processed: boolean;
}

export type EvidenceType = "Photo" | "Video" | "Document" | "Physical" | "Digital" | "Testimony";
export type CustodyStatus = "Collected" | "In Storage" | "In Analysis" | "Released" | "Destroyed";

export interface Evidence {
  id: string;
  evidenceNumber: string;
  caseNumber: string;
  type: EvidenceType;
  description: string;
  location: string;
  collectedBy: string;
  collectedAt: Date;
  custodyStatus: CustodyStatus;
  chainOfCustody: {
    officerId: string;
    officerName: string;
    action: string;
    timestamp: Date;
    notes?: string;
  }[];
  tags: string[];
  attachments?: string[];
}

export type CaseType = "Investigation" | "Homicide" | "Robbery" | "Narcotics" | "Fraud" | "Missing Person" | "Gang Activity" | "Other";
export type CaseStatus = "Open" | "Active" | "Cold" | "Closed" | "Referred";
export type CasePriority = "Low" | "Medium" | "High" | "Critical";

export interface CaseActivityEntry {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  timestamp: Date;
}

export interface CaseNote {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: Date;
}

/**
 * El expediente central del RMS: conecta personas, vehículos, evidencias e
 * incidentes (calls) por id, sin duplicar sus datos — cada tab del caso
 * resuelve esos ids contra las colecciones ya cargadas en el MDTContext.
 */
export interface CaseFile {
  id: string;
  caseNumber: string;
  title: string;
  type: CaseType;
  status: CaseStatus;
  priority: CasePriority;
  summary: string;
  leadOfficerId: string;
  leadOfficerName: string;
  assignedOfficerIds: string[];
  assignedOfficerNames: string[];
  relatedPersonIds: string[];
  relatedVehicleIds: string[];
  relatedEvidenceIds: string[];
  relatedCallIds: string[];
  notes: CaseNote[];
  activity: CaseActivityEntry[];
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export type MessagePriority = "Normal" | "Urgent";

export interface Message {
  id: string;
  from: string;
  fromName: string;
  to: string;
  toName: string;
  subject: string;
  body: string;
  priority: MessagePriority;
  isRead: boolean;
  sentAt: Date;
  readAt?: Date;
}

export type AuditAction =
  | "login"
  | "logout"
  | "search_person"
  | "search_vehicle"
  | "search_weapon"
  | "create_report"
  | "edit_report"
  | "delete_report"
  | "create_arrest"
  | "issue_citation"
  | "create_bolo"
  | "access_evidence"
  | "send_message"
  | "modify_call"
  | "other";

export interface AuditLog {
  id: string;
  officerId: string;
  officerName: string;
  action: AuditAction;
  description: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface OfficerStats {
  officerId: string;
  totalCalls: number;
  callsThisWeek: number;
  totalArrests: number;
  arrestsThisWeek: number;
  totalCitations: number;
  citationsThisWeek: number;
  totalReports: number;
  averageResponseTime: number;
  activeWarrants: number;
  activeBOLOs: number;
}

export interface Permission {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export type PermissionSet = {
  [key in OfficerRank]: {
    calls: Permission;
    persons: Permission;
    vehicles: Permission;
    weapons: Permission;
    warrants: Permission;
    reports: Permission;
    arrests: Permission;
    citations: Permission;
    bolos: Permission;
    evidence: Permission;
    messages: Permission;
    audit: Permission;
  };
};

export interface MDTState {
  isAuthenticated: boolean;
  currentOfficer: Officer | null;
  activeScreen: MDTScreen;
  calls: Call[];
  persons: Person[];
  vehicles: Vehicle[];
  weapons: Weapon[];
  warrants: Warrant[];
  bolos: BOLO[];
  reports: Report[];
  citations: Citation[];
  arrests: Arrest[];
  evidence: Evidence[];
  messages: Message[];
  auditLogs: AuditLog[];
  charges: Charge[];
  cases: CaseFile[];
  stats: OfficerStats | null;
  /** Petición de "abrí este registro" desde la búsqueda global — la pantalla destino la consume y limpia. */
  focusRequest: { entity: "person" | "vehicle" | "case"; id: string } | null;
}

export type MDTScreen =
  | "splash"
  | "login"
  | "dashboard"
  | "cad"
  | "persons"
  | "vehicles"
  | "weapons"
  | "warrants"
  | "bolos"
  | "reports"
  | "citations"
  | "arrests"
  | "evidence"
  | "cases"
  | "messages"
  | "map"
  | "stats"
  | "audit"
  | "radio";