"use client";

import { useCallback, useEffect, useState } from "react";
import { ScrollText, RefreshCw, Search } from "lucide-react";
import { PanelHeader, Card, TextInput, LoadingBlock, EmptyState, AccessDenied, formatDate, Pagination, SortToggle } from "@/components/staff/ui";

interface AuditEntry { id: string; category: string; actor: string; target?: string; description: string; createdAt: string; }

const CATEGORIES = ["all", "WL", "SANCION", "TICKET", "STAFF", "SYSTEM", "TIENDA", "ECONOMIA"];
const CATEGORY_TONE: Record<string, string> = {
  STAFF: "bg-purple-500/15 text-purple-300", WL: "bg-blue-500/15 text-blue-300", TICKET: "bg-sky-500/15 text-sky-300",
  SANCION: "bg-rose-500/15 text-rose-300", SYSTEM: "bg-slate-500/15 text-slate-300", TIENDA: "bg-emerald-500/15 text-emerald-300",
  ECONOMIA: "bg-amber-500/15 text-amber-300",
};

interface Props {
  /** Si se fija, el panel se queda anclado a esa categoría (usado por "Logs Económicos"). */
  fixedCategory?: string;
  /** Solo se exige para el punto de entrada de Economía; el Logs general sigue abierto a todo el staff. */
  isDirector?: boolean;
}

export default function LogsPanel({ fixedCategory, isDirector = true }: Props) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [category, setCategory] = useState(fixedCategory || "all");
  const [actor, setActor] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), sort });
      const effectiveCategory = fixedCategory || category;
      if (effectiveCategory !== "all") params.set("category", effectiveCategory);
      if (actor.trim()) params.set("actor", actor.trim());
      if (from) params.set("from", new Date(from).toISOString());
      if (to) params.set("to", new Date(to + "T23:59:59").toISOString());
      const res = await fetch(`/api/staff/audit?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) { setEntries(data.entries); setTotalPages(data.totalPages || 1); }
    } finally {
      setLoading(false);
    }
  }, [category, fixedCategory, actor, from, to, page, sort]);

  useEffect(() => { setPage(1); }, [category, fixedCategory, actor, from, to, sort]);

  useEffect(() => {
    if (!isDirector) { setLoading(false); return; }
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load, isDirector]);

  if (!isDirector) return <AccessDenied title="Logs Económicos" />;

  return (
    <div>
      <PanelHeader
        title={fixedCategory === "ECONOMIA" ? "Logs Económicos" : "Logs"}
        subtitle={
          fixedCategory === "ECONOMIA"
            ? "Todas las acciones tomadas dentro del Menú de Economía"
            : "Registro de todas las acciones tomadas desde este panel"
        }
        action={
          <button type="button" onClick={load} className="h-9 w-9 flex items-center justify-center rounded-lg border border-[#1F2937] text-slate-400 hover:text-white hover:border-blue-500/50 transition">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        }
      />

      {!fixedCategory && (
        <div className="flex gap-2 overflow-x-auto pb-4">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${category === c ? "bg-blue-600 text-white" : "bg-[#111827] text-slate-400 border border-[#1F2937] hover:text-white"}`}>
              {c === "all" ? "Todos" : c}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <TextInput value={actor} onChange={(e) => setActor(e.target.value)} placeholder="Staff responsable..." className="pl-9 w-48 h-9 text-xs" />
        </div>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 px-3 bg-[#0B0F17] border border-[#1F2937] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500" />
        <span className="text-slate-600 text-xs">a</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 px-3 bg-[#0B0F17] border border-[#1F2937] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500" />
        {(actor || from || to) && (
          <button type="button" onClick={() => { setActor(""); setFrom(""); setTo(""); }} className="text-xs text-slate-500 hover:text-white">Limpiar</button>
        )}
        <SortToggle value={sort} onChange={setSort} />
      </div>

      {loading ? <LoadingBlock /> : entries.length === 0 ? (
        <EmptyState icon={ScrollText} text="Sin actividad registrada" />
      ) : (
        <Card>
          <div className="divide-y divide-[#1F2937]">
            {entries.map((e) => (
              <div key={e.id} className="flex items-start gap-3 px-4 py-3">
                <span className={`mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${CATEGORY_TONE[e.category] || "bg-slate-500/15 text-slate-300"}`}>
                  {e.category}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-200">{e.description}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">{formatDate(e.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      {!loading && entries.length > 0 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
    </div>
  );
}
