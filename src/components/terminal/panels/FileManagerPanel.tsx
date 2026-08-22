"use client";

import { useMemo, useState } from "react";
import { Folder, FileText, ChevronRight } from "lucide-react";
import { useMDT } from "@/contexts/MDTContext";
import { useTerminalWindows } from "@/contexts/TerminalWindowContext";
import DocumentViewerModal from "@/components/os/apps/mdt/DocumentViewerModal";
import { reportToDocument, arrestToDocument, citationToDocument, warrantToDocument, boloToDocument } from "@/lib/documentMappers";
import type { DocumentPaperProps } from "@/components/os/apps/mdt/DocumentPaper";
import type { DocumentSourceType } from "@/lib/mdtServer";

type FolderId = "cases" | "reports" | "warrants" | "citations" | "arrests" | "bolos";

interface FileEntry {
  id: string;
  name: string;
  doc?: DocumentPaperProps;
  sourceType?: DocumentSourceType;
}

/**
 * Gestor de archivos — no inventa almacenamiento nuevo: organiza los
 * registros reales ya existentes (Reportes/Arrestos/Multas/Órdenes/BOLOs/
 * Casos) como si fueran carpetas de un servidor institucional. Cada
 * "archivo" abre el mismo DocumentPaper que ya usan esas pantallas.
 */
export default function FileManagerPanel() {
  const { state } = useMDT();
  const { openWindow } = useTerminalWindows();
  const [folder, setFolder] = useState<FolderId>("reports");
  const [viewFile, setViewFile] = useState<FileEntry | null>(null);

  const folders: { id: FolderId; label: string; count: number }[] = [
    { id: "cases", label: "CASE_FILES", count: state.cases.length },
    { id: "reports", label: "REPORTS", count: state.reports.length },
    { id: "warrants", label: "WARRANTS", count: state.warrants.length },
    { id: "citations", label: "CITATIONS", count: state.citations.length },
    { id: "arrests", label: "ARRESTS", count: state.arrests.length },
    { id: "bolos", label: "BOLOS", count: state.bolos.length },
  ];

  const files: FileEntry[] = useMemo(() => {
    switch (folder) {
      case "cases":
        return state.cases.map((c) => ({ id: c.id, name: `${c.caseNumber}.case` }));
      case "reports":
        return state.reports.map((r) => ({ id: r.id, name: `${r.reportNumber}.doc`, doc: reportToDocument(r), sourceType: "report" as const }));
      case "warrants":
        return state.warrants.map((w) => ({ id: w.id, name: `${w.warrantNumber}.doc`, doc: warrantToDocument(w), sourceType: "warrant" as const }));
      case "citations":
        return state.citations.map((c) => ({ id: c.id, name: `${c.citationNumber}.doc`, doc: citationToDocument(c), sourceType: "citation" as const }));
      case "arrests":
        return state.arrests.map((a) => ({ id: a.id, name: `${a.arrestNumber}.doc`, doc: arrestToDocument(a), sourceType: "arrest" as const }));
      case "bolos":
        return state.bolos.map((b) => ({ id: b.id, name: `${b.boloNumber}.doc`, doc: boloToDocument(b), sourceType: "bolo" as const }));
      default:
        return [];
    }
  }, [folder, state.cases, state.reports, state.warrants, state.citations, state.arrests, state.bolos]);

  const openFile = (file: FileEntry) => {
    if (file.doc) { setViewFile(file); return; }
    // Los casos no son un documento único (tienen pestañas/notas/actividad) — se abren como módulo.
    openWindow("cases", { title: "Casos", maximized: true, focusExisting: true });
  };

  return (
    <div className="h-full flex text-[11px]">
      <div className="w-32 flex-shrink-0 border-r border-[#151d31] overflow-y-auto py-1">
        {folders.map((f) => (
          <button
            key={f.id}
            onClick={() => setFolder(f.id)}
            className={`w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 text-left ${folder === f.id ? "bg-[#121a2e] text-[#dde3f2]" : "text-[#6d7999] hover:bg-[#0f1729]"}`}
          >
            <span className="flex items-center gap-1.5 min-w-0">
              <Folder className="w-3 h-3 flex-shrink-0 text-[#454f6b]" />
              <span className="truncate text-[10px] font-mono">{f.label}</span>
            </span>
            <span className="text-[9px] text-[#454f6b] flex-shrink-0">{f.count}</span>
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {files.length === 0 ? (
          <p className="text-[#454f6b] text-[10.5px] p-3">Carpeta vacía.</p>
        ) : (
          files.map((file) => (
            <button
              key={file.id}
              onClick={() => openFile(file)}
              className="w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 text-left text-[#6d7999] hover:bg-[#0f1729] hover:text-[#dde3f2]"
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <FileText className="w-3 h-3 flex-shrink-0 text-[#454f6b]" />
                <span className="truncate font-mono text-[10px]">{file.name}</span>
              </span>
              <ChevronRight className="w-3 h-3 flex-shrink-0 text-[#454f6b]" />
            </button>
          ))
        )}
      </div>

      {viewFile?.doc && (
        <DocumentViewerModal onClose={() => setViewFile(null)} sourceType={viewFile.sourceType} sourceId={viewFile.id} {...viewFile.doc} />
      )}
    </div>
  );
}
