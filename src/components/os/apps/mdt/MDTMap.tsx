"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMDT } from "@/contexts/MDTContext";
import MDTLayout from "./MDTLayout";
import { DISTRICTS, STREETS, POIS, MAP_VIEWBOX, MAP_IMAGE_URL, type MapStreet, type MapPOI } from "@/lib/mdtMapData";
import type { Call, CallPriority } from "@/lib/mdtTypes";
import {
  Search, Plus, Minus, Locate, Layers, X, MapPin,
  Building2, Flame, Fuel, Landmark, Trees, ShoppingBag, Radio,
  Info, Check, Trash2, ChevronDown, Siren,
} from "lucide-react";

const POI_ICON: Record<string, React.ElementType> = {
  hospital: Building2, police: MapPin, fire: Flame, gas: Fuel, bank: Landmark, park: Trees, shop: ShoppingBag,
};

const PRIORITY_COLOR: Record<CallPriority, string> = {
  Low: "#6f93d6", Medium: "#facc15", High: "#fb923c", Emergency: "#ef4444",
};

const PRIORITY_BADGE: Record<CallPriority, string> = {
  Low: "bg-[#1c2b4d] text-[#6f93d6]", Medium: "bg-[#7a5a12] text-[#facc15]", High: "bg-[#7a3d12] text-[#fb923c]", Emergency: "bg-[#7a1212] text-[#ef4444]",
};

const CALL_CODE: Record<string, string> = {
  "Traffic Stop": "10-38", "Suspicious Activity": "10-91", "Robbery": "10-90", "Assault": "10-71",
  "Shots Fired": "10-71", "Welfare Check": "10-53", "Disturbance": "10-66", "Traffic Accident": "10-50", "Cyber Crime": "10-C1", "Other": "10-99",
};

function fmtTime(d?: Date | string) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

type LayerKey = "pois" | "calls";

const LAYER_LABELS: Record<LayerKey, string> = {
  pois: "Puntos de interés",
  calls: "Llamadas activas",
};

export function MDTMapContent() {
  const { state, setScreen, updateCall, deleteCall } = useMDT();
  const svgRef = useRef<SVGSVGElement>(null);

  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({ pois: true, calls: true });
  const [showOfficers, setShowOfficers] = useState(true);
  const [showCalls, setShowCalls] = useState(true);
  const [showLayers, setShowLayers] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, viewX: 0, viewY: 0 });
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ kind: "street" | "poi" | "call"; data: MapStreet | MapPOI | Call } | null>(null);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);

  const dispatchCalls = useMemo(() => state.calls.filter((c) => c.status !== "Resolved" && c.status !== "Cancelled"), [state.calls]);
  const activeCalls = useMemo(() => showCalls ? dispatchCalls.filter((c) => c.coordinates) : [], [dispatchCalls, showCalls]);

  const [onDutyCount, setOnDutyCount] = useState(0);
  useEffect(() => {
    fetch("/api/mdt/officers", { cache: "no-store" }).then((r) => r.json()).then((d) => {
      if (d.success) setOnDutyCount(d.officers.filter((o: any) => o.onDuty).length);
    });
  }, []);

  const acceptCall = (call: Call) => {
    if (!state.currentOfficer) return;
    const unit = state.currentOfficer.currentUnit || `#${state.currentOfficer.badgeNumber}`;
    updateCall(call.id, { status: "En Route", assignedUnits: Array.from(new Set([...call.assignedUnits, unit])) });
  };

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const results: { kind: "street" | "poi"; label: string; sub: string; data: MapStreet | MapPOI }[] = [];
    for (const s of STREETS) if (s.name.toLowerCase().includes(q)) results.push({ kind: "street", label: s.name, sub: s.type === "highway" ? "Autopista" : s.type === "avenue" ? "Avenida" : "Calle", data: s });
    for (const p of POIS) if (p.name.toLowerCase().includes(q)) results.push({ kind: "poi", label: p.name, sub: p.type, data: p });
    return results.slice(0, 8);
  }, [search]);

  const centerOn = (x: number, y: number, zoom = 2.2) => {
    setView({ zoom, x: MAP_VIEWBOX.width / 2 - x, y: MAP_VIEWBOX.height / 2 - y });
  };

  const streetPoint = (s: MapStreet) => {
    const [x, y] = s.points.split(",").map(Number);
    return { cx: x, cy: y };
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setView((v) => ({ ...v, zoom: Math.min(6, Math.max(0.6, v.zoom - e.deltaY * 0.0015)) }));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, viewX: view.x, viewY: view.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scale = MAP_VIEWBOX.width / rect.width / view.zoom;
    setView((v) => ({
      ...v,
      x: dragStart.current.viewX + (e.clientX - dragStart.current.x) * scale,
      y: dragStart.current.viewY + (e.clientY - dragStart.current.y) * scale,
    }));
  };
  const onMouseUp = () => setDragging(false);

  const resetView = () => setView({ x: 0, y: 0, zoom: 1 });

  const priorityGlow: Record<CallPriority, string> = {
    Low: "animate-none", Medium: "animate-none", High: "animate-pulse", Emergency: "animate-pulse",
  };

  return (
    <>
      <div className="h-full w-full flex bg-[#05070d] text-slate-200">
        {/* Panel: Active Calls */}
        <div className="w-[340px] flex-shrink-0 border-r border-[#151d31] flex flex-col">
          <div className="px-4 py-3 border-b border-[#151d31] flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-bold">Llamadas Activas</p>
              <p className="text-slate-500 text-[11px]">Consulta todas las llamadas de emergencia activas</p>
            </div>
            <Info className="w-4 h-4 text-slate-600 flex-shrink-0" />
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {dispatchCalls.length === 0 && (
              <p className="text-slate-600 text-xs text-center py-8">Sin llamadas activas.</p>
            )}
            {dispatchCalls.map((c) => {
              const expanded = expandedCallId === c.id;
              return (
                <div key={c.id} className="bg-[#0d1424] border border-[#151d31] rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${PRIORITY_BADGE[c.priority]}`}>{c.priority}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#121a2e] text-[#6f93d6] border border-[#1e2a45]">{CALL_CODE[c.type] || "10-99"}</span>
                    <span className="ml-auto text-slate-600 text-[10px]">{fmtTime(c.createdAt)}</span>
                  </div>
                  <p className="text-white text-sm font-semibold mb-2">{c.title || c.type}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => acceptCall(c)}
                      disabled={c.status !== "Pending"}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> {c.status === "Pending" ? "Aceptar" : c.status}
                    </button>
                    <button
                      onClick={() => deleteCall(c.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-[#3c68c9] hover:bg-[#4d78d6] text-white text-xs font-semibold transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                    <button onClick={() => setExpandedCallId(expanded ? null : c.id)} className="p-1.5 rounded-md hover:bg-[#111a2c] text-slate-400">
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                  {expanded && (
                    <div className="mt-2.5 pt-2.5 border-t border-[#111a2c] text-[11px] text-slate-400 space-y-1">
                      <p><span className="text-slate-600">Ubicación:</span> {c.scene || c.location}</p>
                      <p><span className="text-slate-600">Unidades:</span> {c.assignedUnits.join(", ") || "Sin asignar"}</p>
                      <button onClick={() => setScreen("cad")} className="text-[#6f93d6] hover:underline mt-1">Ver en CAD →</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel: Live Map */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="px-4 py-3 border-b border-[#151d31] flex items-center justify-between flex-shrink-0">
            <div>
              <p className="text-white text-sm font-bold">Mapa en Vivo</p>
              <p className="text-slate-500 text-[11px]">Ubicaciones y unidades de despacho en tiempo real</p>
            </div>
            <button onClick={() => setShowSearch((v) => !v)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${showSearch ? "bg-[#3c68c9] text-white" : "text-slate-400 hover:bg-[#111a2c] hover:text-white"}`}>
              <Search className="w-4 h-4" />
            </button>
          </div>

          <div className="relative flex-1 min-h-0 overflow-hidden">
            {/* Buscador desplegable */}
            {showSearch && (
              <div className="absolute top-3 left-3 z-20 w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    autoFocus
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar calle, código postal, POI..."
                    className="w-full bg-[#0d1424]/95 border border-[#1e2a45] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#3c68c9] shadow-lg"
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-1 bg-[#0d1424]/95 border border-[#1e2a45] rounded-lg overflow-hidden shadow-xl">
                    {searchResults.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const c = r.kind === "street" ? streetPoint(r.data as MapStreet) : { cx: (r.data as MapPOI).x, cy: (r.data as MapPOI).y };
                          centerOn(c.cx, c.cy);
                          setSelected({ kind: r.kind, data: r.data });
                          setSearch("");
                          setShowSearch(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-[#1c2b4d] border-b border-[#111a2c] last:border-0"
                      >
                        <div className="font-medium">{r.label}</div>
                        <div className="text-slate-500 text-[10px]">{r.sub}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Toggles */}
            <div className="absolute top-3 right-3 z-20 bg-[#0d1424]/95 border border-[#1e2a45] rounded-xl shadow-lg p-2.5 space-y-2">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-slate-300 text-[11px]">Mostrar oficiales</span>
                <button
                  onClick={() => setShowOfficers((v) => !v)}
                  className={`w-8 h-4.5 rounded-full relative transition-colors ${showOfficers ? "bg-[#3c68c9]" : "bg-[#1e2a45]"}`}
                  style={{ height: 18 }}
                >
                  <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${showOfficers ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                </button>
              </label>
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-slate-300 text-[11px]">Mostrar llamadas</span>
                <button
                  onClick={() => setShowCalls((v) => !v)}
                  className={`w-8 rounded-full relative transition-colors ${showCalls ? "bg-[#3c68c9]" : "bg-[#1e2a45]"}`}
                  style={{ height: 18 }}
                >
                  <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${showCalls ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                </button>
              </label>
            </div>

            {/* Zoom */}
            <div className="absolute bottom-3 left-3 z-20 flex flex-col gap-1">
              <button onClick={() => setView((v) => ({ ...v, zoom: Math.min(6, v.zoom + 0.4) }))} className="w-8 h-8 rounded-lg bg-[#0d1424]/95 border border-[#1e2a45] text-slate-300 hover:text-white flex items-center justify-center shadow-lg">
                <Plus className="w-4 h-4" />
              </button>
              <button onClick={() => setView((v) => ({ ...v, zoom: Math.max(0.6, v.zoom - 0.4) }))} className="w-8 h-8 rounded-lg bg-[#0d1424]/95 border border-[#1e2a45] text-slate-300 hover:text-white flex items-center justify-center shadow-lg">
                <Minus className="w-4 h-4" />
              </button>
              <button onClick={() => setShowLayers((v) => !v)} className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transition-colors ${showLayers ? "bg-[#3c68c9] text-white" : "bg-[#0d1424]/95 border border-[#1e2a45] text-slate-300 hover:text-white"}`} title="Capas">
                <Layers className="w-4 h-4" />
              </button>
              <button onClick={resetView} className="w-8 h-8 rounded-lg bg-[#0d1424]/95 border border-[#1e2a45] text-slate-300 hover:text-white flex items-center justify-center shadow-lg" title="Vista general">
                <Locate className="w-4 h-4" />
              </button>
            </div>

            {/* Badge de unidad / oficiales en servicio */}
            <div className="absolute bottom-3 right-3 z-20 bg-[#0d1424]/95 border border-[#1e2a45] rounded-lg px-2.5 py-1.5 shadow-lg flex items-center gap-1.5">
              <Siren className="w-3.5 h-3.5 text-[#6f93d6]" />
              <span className="text-white text-xs font-bold">{String(onDutyCount).padStart(3, "0")}</span>
            </div>

            {showLayers && (
              <div className="absolute bottom-40 left-3 z-20 bg-[#0d1424]/95 border border-[#1e2a45] rounded-lg p-3 shadow-xl w-44">
                <p className="text-slate-500 text-[10px] font-bold tracking-wide mb-2">CAPAS</p>
                {(Object.keys(LAYER_LABELS) as LayerKey[]).map((k) => (
                  <label key={k} className="flex items-center gap-2 py-1 text-xs text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={layers[k]} onChange={() => setLayers((prev) => ({ ...prev, [k]: !prev[k] }))} className="accent-[#3c68c9]" />
                    {LAYER_LABELS[k]}
                  </label>
                ))}
              </div>
            )}

        {/* Mapa SVG */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
          preserveAspectRatio="xMidYMid slice"
          className={`w-full h-full ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <rect x="0" y="0" width={MAP_VIEWBOX.width} height={MAP_VIEWBOX.height} fill="#121a2e" />
          <g transform={`translate(${MAP_VIEWBOX.width / 2}, ${MAP_VIEWBOX.height / 2}) scale(${view.zoom}) translate(${-MAP_VIEWBOX.width / 2 + view.x}, ${-MAP_VIEWBOX.height / 2 + view.y})`}>
            <image href={MAP_IMAGE_URL} x="0" y="0" width={MAP_VIEWBOX.width} height={MAP_VIEWBOX.height} />

            {/* POIs */}
            {layers.pois && POIS.map((p) => (
              <g key={p.id} onClick={() => setSelected({ kind: "poi", data: p })} className="cursor-pointer">
                <circle cx={p.x} cy={p.y} r={6} fill="#1c2b4d" stroke="#6f93d6" strokeWidth={1.5} />
              </g>
            ))}

            {/* Llamadas activas */}
            {layers.calls && activeCalls.map((c) => (
              <g key={c.id} onClick={() => setSelected({ kind: "call", data: c })} className={`cursor-pointer ${priorityGlow[c.priority]}`}>
                <circle cx={c.coordinates!.x} cy={c.coordinates!.y} r={9} fill={PRIORITY_COLOR[c.priority]} fillOpacity={0.25} />
                <circle cx={c.coordinates!.x} cy={c.coordinates!.y} r={5} fill={PRIORITY_COLOR[c.priority]} stroke="#05070d" strokeWidth={1.5} />
              </g>
            ))}
          </g>
        </svg>

        {/* Panel de selección */}
        {selected && (
          <div className="absolute bottom-3 left-3 z-20 w-72 bg-[#0d1424]/95 border border-[#1e2a45] rounded-xl shadow-2xl p-4">
            <button onClick={() => setSelected(null)} className="absolute top-2 right-2 text-slate-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>

            {selected.kind === "street" && (() => { const s = selected.data as MapStreet; const district = DISTRICTS.find((d) => d.id === s.districtId); return (
              <>
                <p className="text-white font-bold text-sm mb-0.5">{s.name}</p>
                <p className="text-slate-500 text-xs mb-1">{s.type === "highway" ? "Autopista" : s.type === "avenue" ? "Avenida" : "Calle"}</p>
                {district && <p className="text-slate-400 text-[11px]">Zona: {district.name}</p>}
              </>
            ); })()}

            {selected.kind === "poi" && (() => { const p = selected.data as MapPOI; const Icon = POI_ICON[p.type] || MapPin; const district = DISTRICTS.find((d) => d.id === p.districtId); return (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-[#6f93d6]" />
                  <p className="text-white font-bold text-sm">{p.name}</p>
                </div>
                {district && <p className="text-slate-400 text-[11px]">Zona: {district.name}</p>}
              </>
            ); })()}

            {selected.kind === "call" && (() => { const c = selected.data as Call; return (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PRIORITY_COLOR[c.priority] }} />
                  <p className="text-white font-bold text-sm">{c.title || c.type} <span className="text-slate-500 font-normal">#{c.callNumber}</span></p>
                </div>
                <p className="text-slate-400 text-xs mb-1">{c.scene || c.location}</p>
                <p className="text-slate-500 text-[11px] mb-2">Prioridad {c.priority} · Estado {c.status}</p>
                <button onClick={() => setScreen("cad")} className="w-full py-1.5 rounded-lg bg-[#3c68c9] hover:bg-[#4d78d6] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
                  <Radio className="w-3.5 h-3.5" /> Ir a CAD
                </button>
              </>
            ); })()}
          </div>
        )}

          </div>
        </div>
      </div>
    </>
  );
}

export default function MDTMap() {
  return (
    <MDTLayout title="Mapa Táctico" subtitle="Consulta todas las llamadas de emergencia activas" fullBleed>
      <MDTMapContent />
    </MDTLayout>
  );
}
