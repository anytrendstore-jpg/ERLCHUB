import type { DocumentPaperProps } from "@/components/os/apps/mdt/DocumentPaper";
import type { Report, ReportType, Arrest, Citation, ViolationType, Warrant, BOLO, BOLOType } from "@/lib/mdtTypes";

/**
 * Mapeo puro registro -> props de DocumentPaper, extraído de cada pantalla del MDT
 * (MDTReports, MDTArrests, MDTCitations, MDTWarrants, MDTBOLOs) para que otros
 * módulos (ej. File Manager) puedan abrir el mismo documento sin duplicar esta lógica.
 * No debe haber cambios visuales/de datos respecto al inline original de cada pantalla.
 */

// ---- Date formatters (copiados tal cual de cada pantalla origen) ----

/** Igual a fmtDateTime en MDTReports.tsx: "dd/mm/aaaa, hh:mm". */
export function fmtDateTime(d?: Date | string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    ", " + new Date(d).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

/** Igual a fmtDate en MDTCitations.tsx / MDTWarrants.tsx: "dd/mm/aaaa" (sin hora). */
export function fmtDate(d?: Date | string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Igual a fmtDate en MDTBOLOs.tsx: "dd/mm/aaaa hh:mm" (separador espacio, no coma). */
export function fmtDateBolo(d?: Date | string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " + new Date(d).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

// ---- Label maps (copiados tal cual de cada pantalla origen) ----

export const FORM_TITLE: Record<ReportType, string> = {
  Incident: "Incident Report",
  Arrest: "Arrest Report",
  Traffic: "Traffic Report",
  Investigation: "Investigation Report",
  "Use of Force": "Use of Force Report",
};

export const VIOLATION_LABEL: Record<ViolationType, string> = {
  Moving: "Tránsito",
  Parking: "Estacionamiento",
  Equipment: "Equipamiento",
  Administrative: "Administrativa",
};

export const WARRANT_TYPE_LABEL: Record<Warrant["type"], string> = {
  Arrest: "Arresto",
  Search: "Búsqueda",
  Bench: "Comparecencia",
};

export const WARRANT_FORM_TITLE: Record<Warrant["type"], string> = {
  Arrest: "Arrest Warrant",
  Search: "Search Warrant",
  Bench: "Bench Warrant",
};

export const BOLO_TYPE_LABEL: Record<BOLOType, string> = { Person: "Persona", Vehicle: "Vehículo", Other: "Otro" };

// ---- Mappers ----

/** Extraído de MDTReports.tsx (<DocumentViewerModal ... />). */
export function reportToDocument(report: Report): DocumentPaperProps {
  return {
    formTitle: FORM_TITLE[report.type],
    fileNo: report.reportNumber,
    date: fmtDateTime(report.dateTime),
    stamp: report.status !== "Draft" ? report.status.toUpperCase() : undefined,
    fields: [
      { label: "Título", value: report.title, full: true },
      { label: "Oficial", value: report.officerName },
      { label: "Ubicación", value: report.location },
    ],
    table:
      report.involvedPersons.length || report.involvedVehicles.length
        ? {
            headers: ["Tipo", "Detalle"],
            rows: [
              ...report.involvedPersons.map((p) => ["Persona", p]),
              ...report.involvedVehicles.map((v) => ["Vehículo", v]),
            ],
          }
        : undefined,
    sectionLabel: "Narrativa",
    sectionText: report.narrative,
    officerName: report.officerName,
    signed: !!report.signature,
  };
}

/** Extraído de MDTArrests.tsx (<DocumentViewerModal ... />). */
export function arrestToDocument(arrest: Arrest): DocumentPaperProps {
  return {
    formTitle: "Arrest Report",
    agencySub: "Bureau of Investigative Records",
    fileNo: arrest.arrestNumber,
    date: new Date(arrest.arrestedAt).toLocaleString("es-ES"),
    stamp: arrest.processed ? "PROCESSED" : undefined,
    photoLabel: "MUGSHOT",
    fields: [
      { label: "Arrestado", value: arrest.personName, full: true },
      { label: "Detenido por", value: arrest.arrestedBy },
      { label: "Ubicación", value: arrest.location },
      { label: "Multa total", value: `$${arrest.totalFine.toLocaleString()}` },
      { label: "Tiempo total", value: `${arrest.totalJailTime} meses` },
      { label: "Objetos confiscados", value: arrest.confiscatedItems.join(", ") || "—", full: true },
    ],
    table: {
      headers: ["Código", "Cargo", "Severidad", "Multa", "Meses"],
      rows: arrest.charges.map((c) => [c.chargeCode, c.chargeTitle, c.severity, `$${c.fine.toLocaleString()}`, `${c.jailTime}`]),
    },
    sectionLabel: "Narrativa del arresto",
    sectionText: arrest.narrative,
    officerName: arrest.arrestedBy,
    signed: !!arrest.signature,
  };
}

/** Extraído de MDTCitations.tsx (<DocumentViewerModal ... />). */
export function citationToDocument(citation: Citation): DocumentPaperProps {
  return {
    formTitle: "Traffic Citation",
    agencySub: "Traffic Enforcement Division",
    fileNo: citation.citationNumber,
    date: fmtDate(citation.issuedAt),
    stamp: citation.status !== "Issued" ? citation.status.toUpperCase() : undefined,
    fields: [
      { label: "Infractor", value: citation.personName, full: true },
      { label: "Infracción", value: `${VIOLATION_LABEL[citation.violationType]} — ${citation.violation}`, full: true },
      { label: "Vehículo", value: citation.vehiclePlate || "—" },
      { label: "Multa", value: `$${citation.fineAmount.toLocaleString()}` },
      { label: "Ubicación", value: citation.location, full: true },
      { label: "Vence", value: fmtDate(citation.dueDate) },
    ],
    sectionLabel: citation.notes ? "Notas" : undefined,
    sectionText: citation.notes,
    officerName: citation.issuedBy,
  };
}

/** Extraído de MDTWarrants.tsx (<DocumentViewerModal ... />). */
export function warrantToDocument(warrant: Warrant): DocumentPaperProps {
  return {
    formTitle: WARRANT_FORM_TITLE[warrant.type],
    agencySub: "Superior Court — Judicial Records",
    fileNo: warrant.warrantNumber,
    date: fmtDate(warrant.issuedDate),
    stamp: warrant.isActive ? "ACTIVE" : "CLOSED",
    fields: [
      { label: "Sujeto", value: warrant.personName, full: true },
      { label: "Tipo", value: WARRANT_TYPE_LABEL[warrant.type] },
      { label: "Emitida por", value: warrant.issuedBy },
      { label: "Vence", value: warrant.expiryDate ? fmtDate(warrant.expiryDate) : "Sin vencimiento" },
      { label: "Fianza", value: warrant.bailAmount ? `$${warrant.bailAmount.toLocaleString()}` : "—" },
    ],
    table:
      warrant.charges.length > 0
        ? { headers: ["Cargos"], rows: warrant.charges.map((c) => [c]) }
        : undefined,
    sectionLabel: warrant.notes ? "Notas" : undefined,
    sectionText: warrant.notes,
    officerName: warrant.issuedBy,
  };
}

/** Extraído de MDTBOLOs.tsx (<DocumentViewerModal ... />). */
export function boloToDocument(bolo: BOLO): DocumentPaperProps {
  return {
    formTitle: "Be On the Lookout Bulletin",
    agencySub: "Dispatch — Public Safety Bulletin",
    fileNo: bolo.boloNumber,
    date: fmtDateBolo(bolo.createdAt),
    stamp: bolo.status !== "Active" ? bolo.status.toUpperCase() : "ACTIVE",
    fields: [
      { label: "Título", value: bolo.title, full: true },
      { label: "Tipo", value: BOLO_TYPE_LABEL[bolo.type] },
      { label: "Prioridad", value: bolo.priority },
      { label: "Sujeto / vehículo", value: bolo.subject, full: true },
      { label: "Última ubicación", value: bolo.location || "—", full: true },
    ],
    sectionLabel: "Descripción",
    sectionText: bolo.description,
    officerName: bolo.issuedBy,
  };
}
