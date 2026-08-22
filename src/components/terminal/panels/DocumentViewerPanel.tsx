"use client";

import { useMemo } from "react";
import { useMDT } from "@/contexts/MDTContext";
import DocumentPaper from "@/components/os/apps/mdt/DocumentPaper";
import { reportToDocument } from "@/lib/documentMappers";

/** Último documento real disponible — reusa el mismo mapper y DocumentPaper que Reportes. */
export default function DocumentViewerPanel() {
  const { state } = useMDT();

  const latest = useMemo(
    () => [...state.reports].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())[0] || null,
    [state.reports]
  );

  if (!latest) {
    return <div className="h-full flex items-center justify-center text-[#454f6b] text-[11px] p-4 text-center">Sin documentos recientes.</div>;
  }

  return <DocumentPaper {...reportToDocument(latest)} />;
}
