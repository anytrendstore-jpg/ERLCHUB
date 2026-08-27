"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import type { Call } from "@/lib/mdtTypes";
import type { FDState, FDScreen, Firefighter, FireIncidentReport, FDMessage } from "@/lib/fdTypes";

const CALLS_POLL_MS = 6000;
const COMMAND_LEVEL = 4;

interface FDContextType {
  state: FDState;

  login: () => Promise<boolean>;
  /** Solo desarrollo — entra con un bombero simulado, sin pasar por Discord/DB. */
  loginDemo: () => void;
  logout: () => void;

  setScreen: (screen: FDScreen) => void;

  updateCall: (id: string, updates: Partial<Call>) => void;
  assignUnitToCall: (callId: string, unit: string) => void;

  createReport: (report: Omit<FireIncidentReport, "id" | "reportNumber" | "createdAt" | "updatedAt">) => void;
  updateReport: (id: string, updates: Partial<FireIncidentReport>) => void;
  signReport: (id: string, signature: string) => void;

  sendMessage: (message: Omit<FDMessage, "id" | "sentAt" | "isRead">) => void;
  markMessageRead: (id: string) => void;

  hasPermission: (action: "view" | "create" | "edit" | "delete") => boolean;
  /** Mismo umbral que ya usa Administración (AdminFactionPanel) — rango real de facción, no un rango de terminal. */
  isCommand: boolean;
}

const FDContext = createContext<FDContextType | undefined>(undefined);

export function FDProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FDState>({
    isAuthenticated: false,
    currentFirefighter: null,
    activeScreen: "splash",
    calls: [],
    reports: [],
    personnel: [],
    messages: [],
  });

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hydrateCall = (c: any): Call => ({
    ...c,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
    resolvedAt: c.resolvedAt ? new Date(c.resolvedAt) : undefined,
  });
  const hydrateFirefighter = (f: any): Firefighter => ({ ...f, hireDate: new Date(f.hireDate) });
  const hydrateReport = (r: any): FireIncidentReport => ({
    ...r,
    dateTime: new Date(r.dateTime),
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
    signedAt: r.signedAt ? new Date(r.signedAt) : undefined,
    reviewedAt: r.reviewedAt ? new Date(r.reviewedAt) : undefined,
  });
  const hydrateMessage = (m: any): FDMessage => ({ ...m, sentAt: new Date(m.sentAt), readAt: m.readAt ? new Date(m.readAt) : undefined });

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const loadCalls = useCallback(async () => {
    const res = await fetch("/api/fd/calls", { cache: "no-store" });
    const data = await res.json();
    if (data.success) setState((prev) => ({ ...prev, calls: data.calls.map(hydrateCall) }));
  }, []);

  const loadPersonnel = useCallback(async () => {
    const res = await fetch("/api/fd/personnel", { cache: "no-store" });
    const data = await res.json();
    if (data.success) setState((prev) => ({ ...prev, personnel: data.personnel.map(hydrateFirefighter) }));
  }, []);

  const loadReports = useCallback(async () => {
    const res = await fetch("/api/fd/reports", { cache: "no-store" });
    const data = await res.json();
    if (data.success) setState((prev) => ({ ...prev, reports: data.reports.map(hydrateReport) }));
  }, []);

  const loadMessages = useCallback(async () => {
    const res = await fetch("/api/fd/messages", { cache: "no-store" });
    const data = await res.json();
    if (data.success) setState((prev) => ({ ...prev, messages: data.messages.map(hydrateMessage) }));
  }, []);

  const login = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/fd/firefighter", { cache: "no-store" });
      const data = await res.json();
      if (!data.success) return false;

      const firefighter = { ...hydrateFirefighter(data.firefighter), rankName: data.firefighter.rankName, rankLevel: data.firefighter.rankLevel };
      setState((prev) => ({ ...prev, isAuthenticated: true, currentFirefighter: firefighter, activeScreen: "dashboard" }));

      fetch("/api/fd/firefighter", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ onDuty: true }) });
      await Promise.all([loadCalls(), loadPersonnel(), loadReports(), loadMessages()]);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(loadCalls, CALLS_POLL_MS);
      return true;
    } catch {
      return false;
    }
  }, [loadCalls, loadPersonnel, loadReports, loadMessages]);

  const loginDemo = useCallback(() => {
    const firefighter = {
      id: "demo-firefighter",
      badgeNumber: "00000",
      firstName: "Demo",
      lastName: "Bombero",
      unit: "Engine" as const,
      callsign: "E12",
      status: "Available" as const,
      onDuty: true,
      hireDate: new Date(),
      rankName: "Capitán",
      rankLevel: 3,
    };
    setState((prev) => ({ ...prev, isAuthenticated: true, currentFirefighter: firefighter, activeScreen: "dashboard" }));

    Promise.all([loadCalls(), loadPersonnel(), loadReports(), loadMessages()]).catch(() => {});
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(loadCalls, CALLS_POLL_MS);
  }, [loadCalls, loadPersonnel, loadReports, loadMessages]);

  const logout = useCallback(() => {
    fetch("/api/fd/firefighter", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ onDuty: false }) });
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setState((prev) => ({ ...prev, isAuthenticated: false, currentFirefighter: null, activeScreen: "login" }));
  }, []);

  const setScreen = useCallback((screen: FDScreen) => {
    setState((prev) => ({ ...prev, activeScreen: screen }));
  }, []);

  const updateCall = useCallback((id: string, updates: Partial<Call>) => {
    setState((prev) => ({ ...prev, calls: prev.calls.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c)) }));
    fetch("/api/fd/calls", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
  }, []);

  const assignUnitToCall = useCallback((callId: string, unit: string) => {
    setState((prev) => {
      const call = prev.calls.find((c) => c.id === callId);
      if (!call) return prev;
      const assignedUnits = [...call.assignedUnits, unit];
      fetch("/api/fd/calls", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: callId, assignedUnits }) });
      return { ...prev, calls: prev.calls.map((c) => (c.id === callId ? { ...c, assignedUnits, updatedAt: new Date() } : c)) };
    });
  }, []);

  const createReport = useCallback((report: Omit<FireIncidentReport, "id" | "reportNumber" | "createdAt" | "updatedAt">) => {
    fetch("/api/fd/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(report) })
      .then((r) => r.json())
      .then((data) => { if (data.success) setState((prev) => ({ ...prev, reports: [hydrateReport(data.report), ...prev.reports] })); });
  }, []);

  const updateReport = useCallback((id: string, updates: Partial<FireIncidentReport>) => {
    fetch("/api/fd/reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
    setState((prev) => ({ ...prev, reports: prev.reports.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r)) }));
  }, []);

  const signReport = useCallback((id: string, signature: string) => {
    const signedAt = new Date();
    fetch("/api/fd/reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, signature, signedAt, status: "Pending Review" }) });
    setState((prev) => ({
      ...prev,
      reports: prev.reports.map((r) => (r.id === id ? { ...r, signature, signedAt, status: "Pending Review" as const } : r)),
    }));
  }, []);

  const sendMessage = useCallback((message: Omit<FDMessage, "id" | "sentAt" | "isRead">) => {
    fetch("/api/fd/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(message) })
      .then((r) => r.json())
      .then((data) => { if (data.success) setState((prev) => ({ ...prev, messages: [hydrateMessage(data.message), ...prev.messages] })); });
  }, []);

  const markMessageRead = useCallback((id: string) => {
    fetch("/api/fd/messages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setState((prev) => ({ ...prev, messages: prev.messages.map((m) => (m.id === id ? { ...m, isRead: true, readAt: new Date() } : m)) }));
  }, []);

  const hasPermission = useCallback((action: "view" | "create" | "edit" | "delete"): boolean => {
    if (!state.currentFirefighter) return false;
    if (action === "delete") return state.currentFirefighter.rankLevel >= COMMAND_LEVEL;
    return state.currentFirefighter.rankLevel >= 1;
  }, [state.currentFirefighter]);

  const isCommand = (state.currentFirefighter?.rankLevel ?? 0) >= COMMAND_LEVEL;

  const value: FDContextType = {
    state, login, loginDemo, logout, setScreen,
    updateCall, assignUnitToCall,
    createReport, updateReport, signReport,
    sendMessage, markMessageRead,
    hasPermission,
    isCommand,
  };

  return <FDContext.Provider value={value}>{children}</FDContext.Provider>;
}

export function useFD() {
  const context = useContext(FDContext);
  if (!context) throw new Error("useFD must be used within FDProvider");
  return context;
}
