"use client";

import { useEffect, useState } from "react";
import { X, Printer, Pencil, Save, Lock, Loader2 } from "lucide-react";
import DocumentPaper, { type DocumentPaperProps, type DocumentField } from "./DocumentPaper";
import type { DocumentSourceType } from "@/lib/mdtServer";

interface DocumentViewerModalProps extends DocumentPaperProps {
  onClose: () => void;
  /** Si se pasan, el documento admite edición inline y bloqueo como PDF, persistido en /api/mdt/documents. */
  sourceType?: DocumentSourceType;
  sourceId?: string;
}

/** Ventana flotante que muestra un DocumentPaper sobre la pantalla actual del terminal. */
export default function DocumentViewerModal({ onClose, sourceType, sourceId, ...paper }: DocumentViewerModalProps) {
  const canPersist = Boolean(sourceType && sourceId);

  const [loadingOverride, setLoadingOverride] = useState(canPersist);
  const [locked, setLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState<string | undefined>();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<DocumentField[]>(paper.fields);
  const [sectionText, setSectionText] = useState(paper.sectionText);

  useEffect(() => {
    if (!canPersist) return;
    let cancelled = false;
    fetch(`/api/mdt/documents?sourceType=${sourceType}&sourceId=${sourceId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.success) return;
        const override = data.override;
        if (override) {
          setLocked(Boolean(override.locked));
          setLockedBy(override.lockedBy);
          if (override.fieldOverrides) {
            setFields((prev) => prev.map((f) => (override.fieldOverrides[f.label] !== undefined ? { ...f, value: override.fieldOverrides[f.label] } : f)));
          }
          if (typeof override.sectionTextOverride === "string") setSectionText(override.sectionTextOverride);
        }
      })
      .finally(() => { if (!cancelled) setLoadingOverride(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceType, sourceId]);

  const handleFieldChange = (label: string, value: string) => {
    setFields((prev) => prev.map((f) => (f.label === label ? { ...f, value } : f)));
  };

  const persist = async (extra: Record<string, unknown> = {}) => {
    if (!canPersist) return;
    setSaving(true);
    try {
      const fieldOverrides = Object.fromEntries(fields.map((f) => [f.label, f.value]));
      const res = await fetch("/api/mdt/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType, sourceId, fieldOverrides, sectionTextOverride: sectionText, ...extra }),
      });
      const data = await res.json();
      if (data.success && data.override) {
        setLocked(Boolean(data.override.locked));
        setLockedBy(data.override.lockedBy);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => { await persist(); setEditing(false); };
  const handleLock = async () => {
    if (!window.confirm("¿Finalizar este documento como PDF? Una vez bloqueado ya no se puede volver a editar.")) return;
    await persist({ lock: true });
    setEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div
        className="bg-[#0d1424] border border-[#1e2a45] rounded-lg w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-9 bg-[#151d31] border-b border-[#1e2a45] px-3 flex items-center justify-between flex-shrink-0">
          <span className="font-mono text-[10px] text-[#6d7999]">
            DOC://<b className="text-[#6f93d6] font-medium">{paper.fileNo}</b>
            {locked && <span className="ml-2 text-[#c1975a]">🔒 {lockedBy ? `bloqueado por ${lockedBy}` : "bloqueado"}</span>}
          </span>
          <div className="flex items-center gap-1">
            {saving && <Loader2 className="w-3.5 h-3.5 text-[#6d7999] animate-spin mr-1" />}
            {canPersist && !locked && (
              editing ? (
                <button onClick={handleSave} title="Guardar" className="w-6 h-6 rounded flex items-center justify-center text-emerald-400 hover:bg-[#111a2c]">
                  <Save className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button onClick={() => setEditing(true)} title="Editar" className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:bg-[#111a2c] hover:text-slate-200">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )
            )}
            {canPersist && !locked && (
              <button onClick={handleLock} title="Finalizar como PDF" className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:bg-[#111a2c] hover:text-[#c1975a]">
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={() => window.print()} title="Imprimir" className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:bg-[#111a2c] hover:text-slate-200">
              <Printer className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} title="Cerrar" className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:bg-[#111a2c] hover:text-slate-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          {loadingOverride ? (
            <div className="h-full flex items-center justify-center bg-[#f2ecda]"><Loader2 className="w-4 h-4 text-[#6b6448] animate-spin" /></div>
          ) : (
            <DocumentPaper
              {...paper}
              fields={fields}
              sectionText={sectionText}
              editable={editing}
              locked={locked}
              onFieldChange={handleFieldChange}
              onSectionTextChange={setSectionText}
            />
          )}
        </div>
      </div>
    </div>
  );
}
