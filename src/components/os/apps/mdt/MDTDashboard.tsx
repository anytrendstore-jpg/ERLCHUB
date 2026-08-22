"use client";

import { useMDT } from "@/contexts/MDTContext";
import MDTLayout from "./MDTLayout";
import {
  Shield,
  Radio,
  AlertTriangle,
  FileText,
  ShieldAlert,
  MapPin,
  Calendar,
  Search,
  Plus,
  Briefcase,
} from "lucide-react";

export default function MDTDashboard() {
  const { state, setScreen } = useMDT();
  const { currentOfficer, calls, warrants, bolos, reports, arrests, cases } = state;

  if (!currentOfficer) return null;

  const activeCalls = calls.filter(c => c.status === "Pending" || c.status === "En Route");
  const activeWarrants = warrants.filter(w => w.isActive);
  const activeBolos = bolos.filter(b => b.status === "Active");
  const openCases = cases.filter(c => c.status === "Open" || c.status === "Active");
  const recentReports = reports.slice(0, 5);
  const recentArrests = arrests.slice(0, 3);

  const yearsOfService = new Date().getFullYear() - currentOfficer.hireDate.getFullYear();

  return (
    <MDTLayout title="Panel principal" subtitle="Resumen operativo y estado del oficial">
      <div className="space-y-6">
        {/* Información del oficial */}
        <div className="bg-[#0d1424] border border-[#151d31] rounded-lg px-5 py-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-lg bg-[#121a2e] border border-[#3c68c9]/50 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-[#6f93d6]" strokeWidth={1.5} />
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-semibold text-white">
                  {currentOfficer.rank} {currentOfficer.firstName} {currentOfficer.lastName}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-500/15 text-green-400 text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> EN SERVICIO
                </span>
              </div>
              <p className="text-[#6f93d6] text-xs">
                Placa #{currentOfficer.badgeNumber} · {currentOfficer.division}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1.5 text-xs pt-1">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Radio className="w-3.5 h-3.5" />
                  <span>Unidad <span className="text-white font-medium">{currentOfficer.currentUnit || "Sin asignar"}</span></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Estado <span className="text-green-400 font-medium">{currentOfficer.status}</span></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Radio className="w-3.5 h-3.5" />
                  <span>Canal <span className="text-white font-medium">{currentOfficer.radioChannel || "N/D"}</span></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Antigüedad <span className="text-white font-medium">{yearsOfService} {yearsOfService === 1 ? "año" : "años"}</span></span>
                </div>
              </div>
            </div>

            {/* Accesos rápidos */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setScreen("cad")}
                className="flex items-center gap-1.5 bg-[#3c68c9] hover:bg-[#4d78d6] text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Nuevo incidente
              </button>
              <button
                onClick={() => setScreen("persons")}
                className="flex items-center gap-1.5 bg-[#121a2e] border border-[#1e2a45] hover:border-[#3c68c9]/50 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
              >
                <Search className="w-3.5 h-3.5" /> Buscar
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <button
            onClick={() => setScreen("cad")}
            className="bg-[#0d1424] border border-[#151d31] hover:border-[#3c68c9] rounded-lg p-4 transition-colors text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <Radio className="w-4 h-4 text-[#6f93d6]" />
              {activeCalls.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
            </div>
            <div className="text-2xl font-semibold text-white mb-0.5 tabular-nums">{activeCalls.length}</div>
            <div className="text-xs text-slate-500">Incidentes activos</div>
          </button>

          <button
            onClick={() => setScreen("cases")}
            className="bg-[#0d1424] border border-[#151d31] hover:border-[#3c68c9] rounded-lg p-4 transition-colors text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <Briefcase className="w-4 h-4 text-[#6f93d6]" />
            </div>
            <div className="text-2xl font-semibold text-white mb-0.5 tabular-nums">{openCases.length}</div>
            <div className="text-xs text-slate-500">Casos abiertos</div>
          </button>

          <button
            onClick={() => setScreen("warrants")}
            className="bg-[#0d1424] border border-[#151d31] hover:border-yellow-500/60 rounded-lg p-4 transition-colors text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-4 h-4 text-yellow-400" />
              {activeWarrants.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />}
            </div>
            <div className="text-2xl font-semibold text-white mb-0.5 tabular-nums">{activeWarrants.length}</div>
            <div className="text-xs text-slate-500">Órdenes activas</div>
          </button>

          <button
            onClick={() => setScreen("bolos")}
            className="bg-[#0d1424] border border-[#151d31] hover:border-red-500/60 rounded-lg p-4 transition-colors text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              {activeBolos.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
            </div>
            <div className="text-2xl font-semibold text-white mb-0.5 tabular-nums">{activeBolos.length}</div>
            <div className="text-xs text-slate-500">BOLOs activos</div>
          </button>

          <button
            onClick={() => setScreen("arrests")}
            className="bg-[#0d1424] border border-[#151d31] hover:border-purple-500/60 rounded-lg p-4 transition-colors text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-semibold text-white mb-0.5 tabular-nums">{arrests.length}</div>
            <div className="text-xs text-slate-500">Arrestos totales</div>
          </button>
        </div>

        {/* Actividad reciente */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-[#0d1424] border border-[#151d31] rounded-lg">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 border-b border-[#151d31] flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              Alertas activas
            </h3>
            <div className="divide-y divide-[#111a2c]">
              {activeBolos.length === 0 && (
                <div className="text-center py-6 text-slate-600 text-sm">
                  Sin BOLOs activos
                </div>
              )}
              {activeBolos.slice(0, 3).map(bolo => (
                <div
                  key={bolo.id}
                  className="px-4 py-3 hover:bg-[#0f1729] transition-colors cursor-pointer"
                  onClick={() => setScreen("bolos")}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        bolo.priority === "Emergency" ? "bg-red-500/20 text-red-400" :
                        bolo.priority === "High" ? "bg-orange-500/20 text-orange-400" :
                        bolo.priority === "Medium" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-blue-500/20 text-blue-400"
                      }`}>
                        {bolo.priority}
                      </span>
                      <span className="text-[11px] text-slate-500">{bolo.type}</span>
                    </div>
                    <span className="text-[11px] text-slate-600">{bolo.boloNumber}</span>
                  </div>
                  <div className="text-white text-sm font-medium mb-0.5">{bolo.title}</div>
                  <div className="text-xs text-slate-500 line-clamp-1">{bolo.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0d1424] border border-[#151d31] rounded-lg">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 border-b border-[#151d31] flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-[#6f93d6]" />
              Reportes recientes
            </h3>
            <div className="divide-y divide-[#111a2c]">
              {recentReports.length === 0 && (
                <div className="text-center py-6 text-slate-600 text-sm">
                  Sin reportes registrados
                </div>
              )}
              {recentReports.map(report => (
                <div
                  key={report.id}
                  className="px-4 py-3 hover:bg-[#0f1729] transition-colors cursor-pointer"
                  onClick={() => setScreen("reports")}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        report.status === "Approved" ? "bg-green-500/20 text-green-400" :
                        report.status === "Pending Review" ? "bg-yellow-500/20 text-yellow-400" :
                        report.status === "Rejected" ? "bg-red-500/20 text-red-400" :
                        "bg-slate-500/20 text-slate-400"
                      }`}>
                        {report.status}
                      </span>
                      <span className="text-[11px] text-slate-500">{report.type}</span>
                    </div>
                    <span className="text-[11px] text-slate-600">{report.reportNumber}</span>
                  </div>
                  <div className="text-white text-sm font-medium mb-0.5">{report.title}</div>
                  <div className="text-xs text-slate-500">
                    por {report.officerName} · {report.location}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Arrestos recientes */}
        {recentArrests.length > 0 && (
          <div className="bg-[#0d1424] border border-[#151d31] rounded-lg">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 border-b border-[#151d31] flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
              Arrestos recientes
            </h3>
            <div className="grid md:grid-cols-3 divide-x divide-[#111a2c]">
              {recentArrests.map(arrest => (
                <div
                  key={arrest.id}
                  className="px-4 py-3 hover:bg-[#0f1729] transition-colors cursor-pointer"
                  onClick={() => setScreen("arrests")}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-[11px] text-slate-500">{arrest.arrestNumber}</div>
                    <div className="text-[11px] text-slate-600">
                      {new Date(arrest.arrestedAt).toLocaleDateString("es-ES")}
                    </div>
                  </div>
                  <div className="text-white text-sm font-semibold mb-1.5">{arrest.personName}</div>
                  <div className="text-xs text-slate-500 mb-2">
                    {arrest.charges.length} cargo{arrest.charges.length !== 1 ? "s" : ""}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Multa</span>
                    <span className="text-green-400 font-medium tabular-nums">${arrest.totalFine.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Prisión</span>
                    <span className="text-orange-400 font-medium tabular-nums">{arrest.totalJailTime} meses</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MDTLayout>
  );
}
