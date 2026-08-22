"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import type {
  MDTState,
  MDTScreen,
  Officer,
  Call,
  Person,
  Vehicle,
  Weapon,
  Warrant,
  BOLO,
  Report,
  Citation,
  Arrest,
  Evidence,
  Message,
  AuditLog,
  Charge,
  CaseFile,
  OfficerStats,
  AuditAction,
  OfficerRank,
} from "@/lib/mdtTypes";


const MOCK_CHARGES: Charge[] = [
  { id: "c1", code: "VC22350", title: "Speeding", description: "Exceeding posted speed limit", severity: "Infraction", fine: 250, jailTime: 0, category: "Traffic" },
  { id: "c2", code: "VC21453", title: "Running Red Light", description: "Failure to stop at red signal", severity: "Infraction", fine: 300, jailTime: 0, category: "Traffic" },
  { id: "c3", code: "VC22107", title: "Unsafe Lane Change", description: "Improper lane change", severity: "Infraction", fine: 200, jailTime: 0, category: "Traffic" },
  { id: "c4", code: "VC27150", title: "Illegal Tint", description: "Window tint too dark", severity: "Infraction", fine: 150, jailTime: 0, category: "Equipment" },

  { id: "c5", code: "PC242", title: "Battery", description: "Unlawful use of force or violence", severity: "Misdemeanor", fine: 1000, jailTime: 6, category: "Violent" },
  { id: "c6", code: "PC415", title: "Disturbing the Peace", description: "Unlawfully fighting or loud noise", severity: "Misdemeanor", fine: 500, jailTime: 3, category: "Public Order" },
  { id: "c7", code: "PC148", title: "Resisting Arrest", description: "Resisting, delaying, or obstructing officer", severity: "Misdemeanor", fine: 1500, jailTime: 12, category: "Obstruction" },
  { id: "c8", code: "PC594", title: "Vandalism", description: "Malicious damage to property", severity: "Misdemeanor", fine: 800, jailTime: 6, category: "Property" },
  { id: "c9", code: "VC23152", title: "DUI", description: "Driving under the influence", severity: "Misdemeanor", fine: 2000, jailTime: 6, category: "Traffic" },
  { id: "c10", code: "PC484", title: "Petty Theft", description: "Theft of property under $950", severity: "Misdemeanor", fine: 1000, jailTime: 6, category: "Property" },

  { id: "c11", code: "PC211", title: "Robbery", description: "Taking property by force or fear", severity: "Felony", fine: 5000, jailTime: 36, category: "Violent" },
  { id: "c12", code: "PC245", title: "Assault with Deadly Weapon", description: "Assault with weapon likely to cause great bodily injury", severity: "Felony", fine: 7500, jailTime: 48, category: "Violent" },
  { id: "c13", code: "PC487", title: "Grand Theft Auto", description: "Theft of vehicle", severity: "Felony", fine: 4000, jailTime: 24, category: "Property" },
  { id: "c14", code: "HS11350", title: "Possession of Controlled Substance", description: "Unlawful possession of narcotics", severity: "Felony", fine: 3000, jailTime: 18, category: "Narcotics" },
  { id: "c15", code: "PC246", title: "Shooting at Inhabited Dwelling", description: "Maliciously discharging firearm at building", severity: "Felony", fine: 10000, jailTime: 60, category: "Violent" },
  { id: "c16", code: "PC187", title: "Murder", description: "Unlawful killing with malice aforethought", severity: "Felony", fine: 25000, jailTime: 240, category: "Violent" },
  { id: "c17", code: "PC459", title: "Burglary", description: "Unlawful entry with intent to commit theft", severity: "Felony", fine: 3500, jailTime: 24, category: "Property" },
  { id: "c18", code: "PC69", title: "Resisting Executive Officer", description: "Threatening or attempting to deter officer", severity: "Felony", fine: 5000, jailTime: 24, category: "Obstruction" },
];

const CALLS_POLL_MS = 6000;


interface MDTContextType {
  state: MDTState;

  login: (username: string, password: string) => Promise<boolean>;
  /** Solo desarrollo — entra con un oficial simulado, sin pasar por Discord/DB. */
  loginDemo: () => void;
  logout: () => void;

  setScreen: (screen: MDTScreen) => void;

  addCall: (call: Omit<Call, "id" | "callNumber" | "createdAt" | "updatedAt">) => void;
  updateCall: (id: string, updates: Partial<Call>) => void;
  deleteCall: (id: string) => void;
  assignUnitToCall: (callId: string, unit: string) => void;

  searchPerson: (query: string) => Person[];
  addPerson: (person: Omit<Person, "id" | "createdAt" | "updatedAt">) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;

  searchVehicle: (query: string) => Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, "id" | "createdAt" | "updatedAt">) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;

  createWarrant: (warrant: Omit<Warrant, "id" | "warrantNumber" | "issuedDate">) => void;
  updateWarrant: (id: string, updates: Partial<Warrant>) => void;

  createBOLO: (bolo: Omit<BOLO, "id" | "boloNumber" | "createdAt">) => void;
  updateBOLO: (id: string, updates: Partial<BOLO>) => void;

  createReport: (report: Omit<Report, "id" | "reportNumber" | "createdAt" | "updatedAt">) => void;
  updateReport: (id: string, updates: Partial<Report>) => void;
  signReport: (id: string, signature: string) => void;

  issueCitation: (citation: Omit<Citation, "id" | "citationNumber" | "issuedAt">) => void;
  updateCitation: (id: string, updates: Partial<Citation>) => void;

  createArrest: (arrest: Omit<Arrest, "id" | "arrestNumber" | "caseNumber" | "arrestedAt">) => void;

  addEvidence: (evidence: Omit<Evidence, "id" | "evidenceNumber" | "collectedAt" | "chainOfCustody">) => void;
  updateEvidenceCustody: (id: string, action: string, notes?: string) => void;

  sendMessage: (message: Omit<Message, "id" | "sentAt" | "isRead">) => void;
  markMessageRead: (id: string) => void;

  logAction: (action: AuditAction, description: string, metadata?: Record<string, any>) => void;

  hasPermission: (action: "view" | "create" | "edit" | "delete", resource: string) => boolean;

  searchCharges: (query: string, severity?: string) => Charge[];

  createCase: (data: Pick<CaseFile, "title" | "type" | "priority" | "summary"> & Partial<CaseFile>) => Promise<CaseFile | null>;
  updateCase: (id: string, updates: Partial<CaseFile>) => void;
  addCaseNote: (id: string, text: string) => void;
  addCaseActivity: (id: string, action: string) => void;
  linkToCase: (id: string, field: "relatedPersonIds" | "relatedVehicleIds" | "relatedEvidenceIds" | "relatedCallIds", refId: string) => void;

  /** La búsqueda global pide "abrí este registro": navega a la pantalla y deja `state.focusRequest` para que esa pantalla lo lea y llame a `clearFocusRequest`. */
  openRecord: (entity: "person" | "vehicle" | "case", id: string, screen: MDTScreen) => void;
  clearFocusRequest: () => void;
}

const MDTContext = createContext<MDTContextType | undefined>(undefined);

export function MDTProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MDTState>({
    isAuthenticated: false,
    currentOfficer: null,
    activeScreen: "splash",
    calls: [],
    persons: [],
    vehicles: [],
    weapons: [],
    warrants: [],
    bolos: [],
    reports: [],
    citations: [],
    arrests: [],
    evidence: [],
    messages: [],
    auditLogs: [],
    charges: MOCK_CHARGES,
    cases: [],
    focusRequest: null,
    stats: null,
  });

  const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Varias funciones (issueCitation, createReport, sendMessage...) se memoizan una sola vez con
  // useCallback(..., []) y llaman a logAction desde un .then() posterior: si logAction leyera
  // state.currentOfficer directamente, esas llamadas verían siempre el valor del primer render
  // (null) y la auditoría quedaría atribuida a "System" en vez del oficial real. Por eso se lee
  // desde un ref, que sí refleja el valor más reciente sin importar cuándo se ejecute el closure.
  const currentOfficerRef = useRef(state.currentOfficer);
  useEffect(() => { currentOfficerRef.current = state.currentOfficer; }, [state.currentOfficer]);

  // Las fechas viajan como texto ISO en el JSON de la API; se reconstruyen a Date para que
  // el resto de la UI (getFullYear, toLocaleString, etc.) siga funcionando como con el mock.
  const hydrateCall = (c: any): Call => ({
    ...c,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
    resolvedAt: c.resolvedAt ? new Date(c.resolvedAt) : undefined,
    incidentStart: c.incidentStart ? new Date(c.incidentStart) : undefined,
    incidentEnd: c.incidentEnd ? new Date(c.incidentEnd) : undefined,
  });
  const hydrateOfficer = (o: any) => ({ ...o, hireDate: new Date(o.hireDate), updatedAt: new Date(o.updatedAt) });
  const hydratePerson = (p: any): Person => ({ ...p, dateOfBirth: new Date(p.dateOfBirth), createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) });
  const hydrateVehicle = (v: any): Vehicle => ({ ...v, createdAt: new Date(v.createdAt), updatedAt: new Date(v.updatedAt) });
  const hydrateWarrant = (w: any): Warrant => ({ ...w, issuedDate: new Date(w.issuedDate), expiryDate: w.expiryDate ? new Date(w.expiryDate) : undefined });
  const hydrateBolo = (b: any): BOLO => ({ ...b, createdAt: new Date(b.createdAt), expiresAt: b.expiresAt ? new Date(b.expiresAt) : undefined });
  const hydrateArrest = (a: any): Arrest => ({ ...a, arrestedAt: new Date(a.arrestedAt), signedAt: a.signedAt ? new Date(a.signedAt) : undefined });
  const hydrateCitation = (c: any): Citation => ({ ...c, issuedAt: new Date(c.issuedAt), dueDate: new Date(c.dueDate) });
  const hydrateEvidence = (e: any): Evidence => ({
    ...e,
    collectedAt: new Date(e.collectedAt),
    chainOfCustody: (e.chainOfCustody || []).map((c: any) => ({ ...c, timestamp: new Date(c.timestamp) })),
  });
  const hydrateMessage = (m: any): Message => ({ ...m, sentAt: new Date(m.sentAt), readAt: m.readAt ? new Date(m.readAt) : undefined });
  const hydrateAuditLog = (l: any): AuditLog => ({ ...l, timestamp: new Date(l.timestamp) });
  const hydrateCase = (c: any): CaseFile => ({
    ...c,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
    closedAt: c.closedAt ? new Date(c.closedAt) : undefined,
    notes: (c.notes || []).map((n: any) => ({ ...n, createdAt: new Date(n.createdAt) })),
    activity: (c.activity || []).map((a: any) => ({ ...a, timestamp: new Date(a.timestamp) })),
  });
  const hydrateReport = (r: any): Report => ({
    ...r,
    dateTime: new Date(r.dateTime),
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
    signedAt: r.signedAt ? new Date(r.signedAt) : undefined,
    reviewedAt: r.reviewedAt ? new Date(r.reviewedAt) : undefined,
  });

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const loadCalls = useCallback(async () => {
    const res = await fetch("/api/mdt/calls", { cache: "no-store" });
    const data = await res.json();
    if (data.success) setState(prev => ({ ...prev, calls: data.calls.map(hydrateCall) }));
  }, []);

  const loadPersons = useCallback(async () => {
    const res = await fetch("/api/mdt/persons", { cache: "no-store" });
    const data = await res.json();
    if (data.success) setState(prev => ({ ...prev, persons: data.persons.map(hydratePerson) }));
  }, []);

  const loadVehicles = useCallback(async () => {
    const res = await fetch("/api/mdt/vehicles", { cache: "no-store" });
    const data = await res.json();
    if (data.success) setState(prev => ({ ...prev, vehicles: data.vehicles.map(hydrateVehicle) }));
  }, []);

  const loadWarrants = useCallback(async () => {
    const res = await fetch("/api/mdt/warrants", { cache: "no-store" });
    const data = await res.json();
    if (data.success) setState(prev => ({ ...prev, warrants: data.warrants.map(hydrateWarrant) }));
  }, []);

  const loadBolos = useCallback(async () => {
    const res = await fetch("/api/mdt/bolos", { cache: "no-store" });
    const data = await res.json();
    if (data.success) setState(prev => ({ ...prev, bolos: data.bolos.map(hydrateBolo) }));
  }, []);

  const loadArrests = useCallback(async () => {
    const res = await fetch("/api/mdt/arrests", { cache: "no-store" });
    const data = await res.json();
    if (data.success) setState(prev => ({ ...prev, arrests: data.arrests.map(hydrateArrest) }));
  }, []);

  const loadCitations = useCallback(async () => {
    const res = await fetch("/api/mdt/citations", { cache: "no-store" });
    const data = await res.json();
    if (data.success) setState(prev => ({ ...prev, citations: data.citations.map(hydrateCitation) }));
  }, []);

  const loadReports = useCallback(async () => {
    const res = await fetch("/api/mdt/reports", { cache: "no-store" });
    const data = await res.json();
    if (data.success) setState(prev => ({ ...prev, reports: data.reports.map(hydrateReport) }));
  }, []);

  const loadEvidence = useCallback(async () => {
    const res = await fetch("/api/mdt/evidence", { cache: "no-store" });
    const data = await res.json();
    if (data.success) setState(prev => ({ ...prev, evidence: data.evidence.map(hydrateEvidence) }));
  }, []);

  const loadMessages = useCallback(async () => {
    const res = await fetch("/api/mdt/messages", { cache: "no-store" });
    const data = await res.json();
    if (data.success) setState(prev => ({ ...prev, messages: data.messages.map(hydrateMessage) }));
  }, []);

  const loadAuditLogs = useCallback(async () => {
    const res = await fetch("/api/mdt/audit", { cache: "no-store" });
    const data = await res.json();
    if (data.success) setState(prev => ({ ...prev, auditLogs: data.logs.map(hydrateAuditLog) }));
  }, []);

  const loadCases = useCallback(async () => {
    const res = await fetch("/api/mdt/cases", { cache: "no-store" });
    const data = await res.json();
    if (data.success) setState(prev => ({ ...prev, cases: data.cases.map(hydrateCase) }));
  }, []);

  const login = useCallback(async (_username: string, _password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/mdt/officer", { cache: "no-store" });
      const data = await res.json();
      if (!data.success) return false;

      const officer = hydrateOfficer(data.officer);
      currentOfficerRef.current = officer; // sincrónico: logAction (más abajo) lo necesita antes de que el efecto corra.
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        currentOfficer: officer,
        activeScreen: "dashboard",
      }));

      // Marca al oficial como en servicio y arranca el sondeo de llamadas activas.
      fetch("/api/mdt/officer", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ onDuty: true }) });
      await Promise.all([loadCalls(), loadPersons(), loadVehicles(), loadWarrants(), loadBolos(), loadArrests(), loadCitations(), loadReports(), loadEvidence(), loadMessages(), loadAuditLogs(), loadCases()]);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(loadCalls, CALLS_POLL_MS);

      logAction("login", `Officer ${data.officer.badgeNumber} logged in`);
      return true;
    } catch {
      return false;
    }
  }, [loadCalls, loadPersons, loadVehicles, loadWarrants, loadBolos, loadArrests, loadCitations, loadReports, loadEvidence, loadMessages, loadAuditLogs, loadCases]);

  const loginDemo = useCallback(() => {
    const officer: Officer = {
      id: "demo-officer",
      badgeNumber: "00000",
      firstName: "Demo",
      lastName: "Oficial",
      rank: "Sergeant",
      division: "Patrol",
      status: "10-8",
      onDuty: true,
      hireDate: new Date(),
    };
    currentOfficerRef.current = officer;
    setState(prev => ({ ...prev, isAuthenticated: true, currentOfficer: officer, activeScreen: "dashboard" }));

    // Si la sesión/DB real están disponibles, se aprovechan para poblar la
    // terminal con datos reales; si no, el demo sigue funcionando con las
    // pantallas vacías (ya manejan ese estado en todos lados).
    Promise.all([loadCalls(), loadPersons(), loadVehicles(), loadWarrants(), loadBolos(), loadArrests(), loadCitations(), loadReports(), loadEvidence(), loadMessages(), loadAuditLogs(), loadCases()]).catch(() => {});
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(loadCalls, CALLS_POLL_MS);
  }, [loadCalls, loadPersons, loadVehicles, loadWarrants, loadBolos, loadArrests, loadCitations, loadReports, loadEvidence, loadMessages, loadAuditLogs, loadCases]);

  const logout = useCallback(() => {
    if (state.currentOfficer) {
      logAction("logout", `Officer ${state.currentOfficer.badgeNumber} logged out`);
    }
    fetch("/api/mdt/officer", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ onDuty: false }) });
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }

    setState(prev => ({
      ...prev,
      isAuthenticated: false,
      currentOfficer: null,
      activeScreen: "login",
    }));
  }, [state.currentOfficer]);

  const setScreen = useCallback((screen: MDTScreen) => {
    setState(prev => ({ ...prev, activeScreen: screen }));
  }, []);

  const addCall = useCallback((call: Omit<Call, "id" | "callNumber" | "createdAt" | "updatedAt">) => {
    fetch("/api/mdt/calls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(call) })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setState(prev => ({ ...prev, calls: [hydrateCall(data.call), ...prev.calls] }));
          logAction("modify_call", `Call ${data.call.callNumber} created`);
        }
      });
  }, []);

  const updateCall = useCallback((id: string, updates: Partial<Call>) => {
    setState(prev => ({
      ...prev,
      calls: prev.calls.map(call =>
        call.id === id ? { ...call, ...updates, updatedAt: new Date() } : call
      ),
    }));
    fetch("/api/mdt/calls", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
    logAction("modify_call", `Call updated`);
  }, []);

  const deleteCall = useCallback((id: string) => {
    setState(prev => ({ ...prev, calls: prev.calls.filter(call => call.id !== id) }));
    fetch("/api/mdt/calls", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    logAction("modify_call", `Call deleted`);
  }, []);

  const assignUnitToCall = useCallback((callId: string, unit: string) => {
    setState(prev => {
      const call = prev.calls.find((c) => c.id === callId);
      if (!call) return prev;
      const assignedUnits = [...call.assignedUnits, unit];
      fetch("/api/mdt/calls", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: callId, assignedUnits }) });
      return {
        ...prev,
        calls: prev.calls.map(c => c.id === callId ? { ...c, assignedUnits, updatedAt: new Date() } : c),
      };
    });
  }, []);

  const searchPerson = useCallback((query: string): Person[] => {
    const lowercaseQuery = query.toLowerCase();
    const results = state.persons.filter(
      person =>
        person.firstName.toLowerCase().includes(lowercaseQuery) ||
        person.lastName.toLowerCase().includes(lowercaseQuery)
    );

    if (query) {
      logAction("search_person", `Searched for person: "${query}"`, { results: results.length });
    }

    return results;
  }, [state.persons]);

  const addPerson = useCallback((person: Omit<Person, "id" | "createdAt" | "updatedAt">) => {
    fetch("/api/mdt/persons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(person) })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const newPerson = hydratePerson(data.person);
          setState(prev => ({ ...prev, persons: [newPerson, ...prev.persons] }));
          logAction("other", `Person added: ${newPerson.firstName} ${newPerson.lastName}`);
        }
      });
  }, []);

  const updatePerson = useCallback((id: string, updates: Partial<Person>) => {
    setState(prev => ({
      ...prev,
      persons: prev.persons.map(person =>
        person.id === id ? { ...person, ...updates, updatedAt: new Date() } : person
      ),
    }));
    fetch("/api/mdt/persons", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
  }, []);

  const searchVehicle = useCallback((query: string): Vehicle[] => {
    const lowercaseQuery = query.toLowerCase();
    const results = state.vehicles.filter(
      vehicle =>
        vehicle.plate.toLowerCase().includes(lowercaseQuery) ||
        vehicle.model.toLowerCase().includes(lowercaseQuery) ||
        vehicle.make.toLowerCase().includes(lowercaseQuery)
    );

    if (query) {
      logAction("search_vehicle", `Searched for vehicle: "${query}"`, { results: results.length });
    }

    return results;
  }, [state.vehicles]);

  const addVehicle = useCallback((vehicle: Omit<Vehicle, "id" | "createdAt" | "updatedAt">) => {
    fetch("/api/mdt/vehicles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(vehicle) })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const newVehicle = hydrateVehicle(data.vehicle);
          setState(prev => ({ ...prev, vehicles: [newVehicle, ...prev.vehicles] }));
          logAction("other", `Vehicle added: ${newVehicle.plate}`);
        }
      });
  }, []);

  const updateVehicle = useCallback((id: string, updates: Partial<Vehicle>) => {
    fetch("/api/mdt/vehicles", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
    setState(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(vehicle =>
        vehicle.id === id ? { ...vehicle, ...updates, updatedAt: new Date() } : vehicle
      ),
    }));
  }, []);

  const createWarrant = useCallback((warrant: Omit<Warrant, "id" | "warrantNumber" | "issuedDate">) => {
    fetch("/api/mdt/warrants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(warrant) })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const newWarrant = hydrateWarrant(data.warrant);
          setState(prev => ({ ...prev, warrants: [newWarrant, ...prev.warrants] }));
          logAction("other", `Warrant created: ${newWarrant.warrantNumber}`);
        }
      });
  }, []);

  const updateWarrant = useCallback((id: string, updates: Partial<Warrant>) => {
    fetch("/api/mdt/warrants", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
    setState(prev => ({
      ...prev,
      warrants: prev.warrants.map(w => (w.id === id ? { ...w, ...updates } : w)),
    }));
  }, []);

  const createBOLO = useCallback((bolo: Omit<BOLO, "id" | "boloNumber" | "createdAt">) => {
    fetch("/api/mdt/bolos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bolo) })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const newBOLO = hydrateBolo(data.bolo);
          setState(prev => ({ ...prev, bolos: [newBOLO, ...prev.bolos] }));
          logAction("create_bolo", `BOLO created: ${newBOLO.boloNumber}`);
        }
      });
  }, []);

  const updateBOLO = useCallback((id: string, updates: Partial<BOLO>) => {
    fetch("/api/mdt/bolos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
    setState(prev => ({
      ...prev,
      bolos: prev.bolos.map(bolo => (bolo.id === id ? { ...bolo, ...updates } : bolo)),
    }));
  }, []);

  const createReport = useCallback((report: Omit<Report, "id" | "reportNumber" | "createdAt" | "updatedAt">) => {
    fetch("/api/mdt/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(report) })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const newReport = hydrateReport(data.report);
          setState(prev => ({ ...prev, reports: [newReport, ...prev.reports] }));
          logAction("create_report", `Report created: ${newReport.reportNumber}`);
        }
      });
  }, []);

  const updateReport = useCallback((id: string, updates: Partial<Report>) => {
    fetch("/api/mdt/reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
    setState(prev => ({
      ...prev,
      reports: prev.reports.map(report =>
        report.id === id ? { ...report, ...updates, updatedAt: new Date() } : report
      ),
    }));
    logAction("edit_report", `Report updated`);
  }, []);

  const signReport = useCallback((id: string, signature: string) => {
    const signedAt = new Date();
    fetch("/api/mdt/reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, signature, signedAt, status: "Pending Review" }) });
    setState(prev => ({
      ...prev,
      reports: prev.reports.map(report =>
        report.id === id
          ? { ...report, signature, signedAt, status: "Pending Review" as const }
          : report
      ),
    }));
  }, []);

  const issueCitation = useCallback((citation: Omit<Citation, "id" | "citationNumber" | "issuedAt">) => {
    fetch("/api/mdt/citations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(citation) })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const newCitation = hydrateCitation(data.citation);
          setState(prev => ({ ...prev, citations: [newCitation, ...prev.citations] }));
          logAction("issue_citation", `Citation issued: ${newCitation.citationNumber}`);
        }
      });
  }, []);

  const updateCitation = useCallback((id: string, updates: Partial<Citation>) => {
    fetch("/api/mdt/citations", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
    setState(prev => ({
      ...prev,
      citations: prev.citations.map(c => (c.id === id ? { ...c, ...updates } : c)),
    }));
  }, []);

  const createArrest = useCallback((arrest: Omit<Arrest, "id" | "arrestNumber" | "caseNumber" | "arrestedAt">) => {
    fetch("/api/mdt/arrests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(arrest) })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const newArrest = hydrateArrest(data.arrest);
          setState(prev => ({ ...prev, arrests: [newArrest, ...prev.arrests] }));
          logAction("create_arrest", `Arrest created: ${newArrest.arrestNumber} for ${newArrest.personName}`);
        }
      });
  }, []);

  const addEvidence = useCallback((evidence: Omit<Evidence, "id" | "evidenceNumber" | "collectedAt" | "chainOfCustody">) => {
    const firstEntry = {
      officerId: state.currentOfficer?.id || "",
      officerName: state.currentOfficer ? `${state.currentOfficer.firstName} ${state.currentOfficer.lastName}` : "",
      action: "Collected",
      timestamp: new Date(),
    };
    fetch("/api/mdt/evidence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...evidence, chainOfCustody: [firstEntry] }) })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const newEvidence = hydrateEvidence(data.evidence);
          setState(prev => ({ ...prev, evidence: [newEvidence, ...prev.evidence] }));
          logAction("access_evidence", `Evidence collected: ${newEvidence.evidenceNumber}`);
        }
      });
  }, [state.currentOfficer]);

  const updateEvidenceCustody = useCallback((id: string, action: string, notes?: string) => {
    const entry = {
      officerId: state.currentOfficer?.id || "",
      officerName: state.currentOfficer ? `${state.currentOfficer.firstName} ${state.currentOfficer.lastName}` : "",
      action,
      timestamp: new Date(),
      notes,
    };
    fetch("/api/mdt/evidence", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, custodyEntry: entry }) });
    setState(prev => ({
      ...prev,
      evidence: prev.evidence.map(evd => (evd.id === id ? { ...evd, chainOfCustody: [...evd.chainOfCustody, entry] } : evd)),
    }));
    logAction("access_evidence", `Evidence custody updated`);
  }, [state.currentOfficer]);

  const sendMessage = useCallback((message: Omit<Message, "id" | "sentAt" | "isRead">) => {
    fetch("/api/mdt/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(message) })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const newMessage = hydrateMessage(data.message);
          setState(prev => ({ ...prev, messages: [newMessage, ...prev.messages] }));
          logAction("send_message", `Message sent to ${message.toName}`);
        }
      });
  }, []);

  const markMessageRead = useCallback((id: string) => {
    fetch("/api/mdt/messages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg =>
        msg.id === id ? { ...msg, isRead: true, readAt: new Date() } : msg
      ),
    }));
  }, []);

  const logAction = useCallback((action: AuditAction, description: string, metadata?: Record<string, any>) => {
    const officer = currentOfficerRef.current;
    const log: AuditLog = {
      id: generateId(),
      officerId: officer?.id || "system",
      officerName: officer ? `${officer.firstName} ${officer.lastName}` : "System",
      action,
      description,
      metadata,
      timestamp: new Date(),
    };

    setState(prev => ({ ...prev, auditLogs: [log, ...prev.auditLogs] }));
    fetch("/api/mdt/audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(log) });
  }, []);

  const createCase = useCallback(async (data: Pick<CaseFile, "title" | "type" | "priority" | "summary"> & Partial<CaseFile>): Promise<CaseFile | null> => {
    const officer = currentOfficerRef.current;
    const payload = {
      ...data,
      leadOfficerId: data.leadOfficerId || officer?.id || "",
      leadOfficerName: data.leadOfficerName || (officer ? `${officer.firstName} ${officer.lastName}` : ""),
    };
    const res = await fetch("/api/mdt/cases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const resData = await res.json();
    if (!resData.success) return null;
    const newCase = hydrateCase(resData.case);
    setState(prev => ({ ...prev, cases: [newCase, ...prev.cases] }));
    logAction("other", `Case opened: ${newCase.caseNumber} — ${newCase.title}`);
    return newCase;
  }, []);

  const updateCase = useCallback((id: string, updates: Partial<CaseFile>) => {
    fetch("/api/mdt/cases", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) })
      .then((r) => r.json())
      .then((data) => { if (data.success) setState(prev => ({ ...prev, cases: prev.cases.map(c => c.id === id ? hydrateCase(data.case) : c) })); });
  }, []);

  const addCaseNote = useCallback((id: string, text: string) => {
    const officer = currentOfficerRef.current;
    fetch("/api/mdt/cases", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, addNote: text, actorId: officer?.id || "", actorName: officer ? `${officer.firstName} ${officer.lastName}` : "" }),
    })
      .then((r) => r.json())
      .then((data) => { if (data.success) setState(prev => ({ ...prev, cases: prev.cases.map(c => c.id === id ? hydrateCase(data.case) : c) })); });
  }, []);

  const addCaseActivity = useCallback((id: string, action: string) => {
    const officer = currentOfficerRef.current;
    fetch("/api/mdt/cases", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, addActivity: action, actorId: officer?.id || "", actorName: officer ? `${officer.firstName} ${officer.lastName}` : "" }),
    })
      .then((r) => r.json())
      .then((data) => { if (data.success) setState(prev => ({ ...prev, cases: prev.cases.map(c => c.id === id ? hydrateCase(data.case) : c) })); });
  }, []);

  const linkToCase = useCallback((id: string, field: "relatedPersonIds" | "relatedVehicleIds" | "relatedEvidenceIds" | "relatedCallIds", refId: string) => {
    setState(prev => {
      const target = prev.cases.find(c => c.id === id);
      if (!target || (target[field] as string[]).includes(refId)) return prev;
      const nextIds = [...(target[field] as string[]), refId];
      fetch("/api/mdt/cases", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, [field]: nextIds }) });
      return { ...prev, cases: prev.cases.map(c => c.id === id ? { ...c, [field]: nextIds } : c) };
    });
  }, []);

  const openRecord = useCallback((entity: "person" | "vehicle" | "case", id: string, screen: MDTScreen) => {
    setState(prev => ({ ...prev, activeScreen: screen, focusRequest: { entity, id } }));
  }, []);

  const clearFocusRequest = useCallback(() => {
    setState(prev => ({ ...prev, focusRequest: null }));
  }, []);

  const hasPermission = useCallback((action: "view" | "create" | "edit" | "delete", resource: string): boolean => {
    if (!state.currentOfficer) return false;

    const rank = state.currentOfficer.rank;

    if (rank === "Chief" || rank === "Captain") return true;
    if (rank === "Lieutenant" && action !== "delete") return true;
    if (rank === "Sergeant" && (action === "view" || action === "create" || action === "edit")) return true;
    if (rank === "Officer" && (action === "view" || action === "create")) return true;

    return false;
  }, [state.currentOfficer]);

  const searchCharges = useCallback((query: string, severity?: string): Charge[] => {
    let results = state.charges;

    if (severity) {
      results = results.filter(charge => charge.severity === severity);
    }

    if (query) {
      const lowercaseQuery = query.toLowerCase();
      results = results.filter(
        charge =>
          charge.code.toLowerCase().includes(lowercaseQuery) ||
          charge.title.toLowerCase().includes(lowercaseQuery) ||
          charge.description.toLowerCase().includes(lowercaseQuery)
      );
    }

    return results;
  }, [state.charges]);

  const value: MDTContextType = {
    state,
    login,
    loginDemo,
    logout,
    setScreen,
    addCall,
    updateCall,
    deleteCall,
    assignUnitToCall,
    searchPerson,
    addPerson,
    updatePerson,
    searchVehicle,
    addVehicle,
    updateVehicle,
    createWarrant,
    updateWarrant,
    createBOLO,
    updateBOLO,
    createReport,
    updateReport,
    signReport,
    issueCitation,
    updateCitation,
    createArrest,
    addEvidence,
    updateEvidenceCustody,
    sendMessage,
    markMessageRead,
    logAction,
    hasPermission,
    searchCharges,
    createCase,
    updateCase,
    addCaseNote,
    addCaseActivity,
    linkToCase,
    openRecord,
    clearFocusRequest,
  };

  return <MDTContext.Provider value={value}>{children}</MDTContext.Provider>;
}
export function useMDT() {
  const context = useContext(MDTContext);
  if (!context) {
    throw new Error("useMDT must be used within MDTProvider");
  }
  return context;
}