"use client";

import { useState, useMemo } from "react";
import { useMDT } from "@/contexts/MDTContext";
import MDTLayout from "./MDTLayout";
import DocumentViewerModal from "./DocumentViewerModal";
import type { Arrest, Charge, ChargeSeverity } from "@/lib/mdtTypes";
import { arrestToDocument } from "@/lib/documentMappers";
import {
  Plus,
  Search,
  ShieldAlert,
  User,
  FileText,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  Filter,
  Package,
  Edit3,
  ScrollText,
} from "lucide-react";

const SEVERITY_LABEL: Record<ChargeSeverity, string> = {
  Infraction: "Infracción",
  Misdemeanor: "Delito Menor",
  Felony: "Delito Grave",
};

export function MDTArrestsContent({
  showNewArrest,
  setShowNewArrest,
}: {
  showNewArrest: boolean;
  setShowNewArrest: (v: boolean) => void;
}) {
  const { state, setScreen } = useMDT();
  const { arrests, currentOfficer } = state;
  const [selectedArrest, setSelectedArrest] = useState<Arrest | null>(null);
  const [viewDoc, setViewDoc] = useState(false);

  return (
    <>
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Arrests List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Arrestos Recientes ({arrests.length})
          </h3>

          {arrests.length === 0 && (
            <div className="bg-[#0d1424] border border-[#151d31] rounded-lg p-6 text-center">
              <ShieldAlert className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-xs">Sin arrestos registrados</p>
            </div>
          )}

          <div className="space-y-3">
            {arrests.map(arrest => (
              <button
                key={arrest.id}
                onClick={() => { setSelectedArrest(arrest); setViewDoc(false); }}
                className={`w-full bg-[#0d1424] border rounded-lg p-4 text-left hover:border-purple-500/50 transition-colors ${
                  selectedArrest?.id === arrest.id ? "border-purple-500" : "border-[#151d31]"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-white font-bold">{arrest.personName}</div>
                  {arrest.processed && (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  )}
                </div>
                <div className="text-xs text-slate-400 mb-2">{arrest.arrestNumber}</div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-green-400">
                    <DollarSign className="w-3 h-3" />
                    <span className="font-bold">${arrest.totalFine.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-orange-400">
                    <Clock className="w-3 h-3" />
                    <span className="font-bold">{arrest.totalJailTime}m</span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  {arrest.charges.length} cargo{arrest.charges.length !== 1 ? "s" : ""}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Arrest Details */}
        <div className="lg:col-span-2">
          {!selectedArrest ? (
            <div className="bg-[#0d1424] border border-[#151d31] rounded-lg p-10 text-center">
              <ShieldAlert className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Selecciona un arresto para ver los detalles o crea uno nuevo</p>
            </div>
          ) : (
            <div className="bg-[#0d1424] border border-[#151d31] rounded-lg p-5 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-0.5">{selectedArrest.personName}</h2>
                  <p className="text-slate-500 text-sm">
                    {selectedArrest.arrestNumber} · {selectedArrest.caseNumber}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {selectedArrest.processed && (
                    <div className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-semibold">
                      PROCESADO
                    </div>
                  )}
                  <button onClick={() => setViewDoc(true)} title="Ver documento" className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#121a2e] border border-[#1e2a45] text-slate-400 hover:text-white transition-colors">
                    <ScrollText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Arrest Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Detenido por:</span>
                    <span className="text-white font-medium">{selectedArrest.arrestedBy}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Fecha/Hora:</span>
                    <span className="text-white font-medium">
                      {new Date(selectedArrest.arrestedAt).toLocaleString("es-ES")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Ubicación:</span>
                    <span className="text-white font-medium">{selectedArrest.location}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="bg-[#121a2e]/50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">Multa Total</div>
                    <div className="text-lg font-semibold text-green-400 tabular-nums">
                      ${selectedArrest.totalFine.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-[#121a2e]/50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">Tiempo Total</div>
                    <div className="text-lg font-semibold text-orange-400 tabular-nums">
                      {selectedArrest.totalJailTime} meses
                    </div>
                  </div>
                </div>
              </div>

              {/* Charges */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-[#151d31] pb-2">
                  Cargos ({selectedArrest.charges.length})
                </h3>
                {selectedArrest.charges.map((charge, idx) => (
                  <div
                    key={idx}
                    className="bg-[#121a2e]/60 border border-[#1e2a45] rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            charge.severity === "Felony" ? "bg-red-500 text-white" :
                            charge.severity === "Misdemeanor" ? "bg-orange-500 text-white" :
                            "bg-blue-500 text-white"
                          }`}>
                            {SEVERITY_LABEL[charge.severity]}
                          </span>
                          <span className="text-xs text-slate-400">{charge.chargeCode}</span>
                        </div>
                        <div className="text-white font-bold">{charge.chargeTitle}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm mt-2">
                      <div className="flex items-center gap-1 text-green-400">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-bold">${charge.fine.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-orange-400">
                        <Clock className="w-4 h-4" />
                        <span className="font-bold">{charge.jailTime} meses</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Narrative */}
              {selectedArrest.narrative && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-[#151d31] pb-2">
                    Narrativa del Arresto
                  </h3>
                  <div className="bg-[#121a2e]/50 rounded-lg p-4">
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {selectedArrest.narrative}
                    </p>
                  </div>
                </div>
              )}

              {/* Confiscated Items */}
              {selectedArrest.confiscatedItems.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-[#151d31] pb-2">
                    Objetos Confiscados
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedArrest.confiscatedItems.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-blue-500/20 text-[#6f93d6] rounded-lg text-sm font-medium"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Signature */}
              {selectedArrest.signature && (
                <div className="pt-4 border-t border-[#151d31]">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>
                      Firmado digitalmente el{" "}
                      {selectedArrest.signedAt &&
                        new Date(selectedArrest.signedAt).toLocaleString("es-ES")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Arrest Modal */}
      {showNewArrest && <NewArrestModal onClose={() => setShowNewArrest(false)} />}

      {viewDoc && selectedArrest && (
        <DocumentViewerModal onClose={() => setViewDoc(false)} sourceType="arrest" sourceId={selectedArrest.id} {...arrestToDocument(selectedArrest)} />
      )}
    </>
  );
}

export default function MDTArrests() {
  const [showNewArrest, setShowNewArrest] = useState(false);

  return (
    <MDTLayout
      title="Arrestos"
      subtitle="Procesamiento de Arrestos y Gestión de Registros"
      actions={
        <button
          onClick={() => setShowNewArrest(true)}
          className="flex items-center gap-2 bg-[#3c68c9] hover:bg-[#4d78d6] text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Arresto
        </button>
      }
    >
      <MDTArrestsContent showNewArrest={showNewArrest} setShowNewArrest={setShowNewArrest} />
    </MDTLayout>
  );
}

// New Arrest Modal Component
function NewArrestModal({ onClose }: { onClose: () => void }) {
  const { state, createArrest, searchCharges } = useMDT();
  const { currentOfficer, persons } = state;

  // Form state
  const [step, setStep] = useState<"person" | "charges" | "review">("person");
  const STEP_LABEL: Record<"person" | "charges" | "review", string> = {
    person: "Persona",
    charges: "Cargos",
    review: "Revisión",
  };
  const [personQuery, setPersonQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<{ id: string; name: string } | null>(null);

  // Búsqueda de personas: se filtra localmente (sin pasar por el `searchPerson` del contexto,
  // que registra auditoría vía setState — invocarlo durante el render causa un loop infinito).
  const personResults = useMemo(() => {
    const q = personQuery.trim().toLowerCase();
    if (!q) return [];
    return persons.filter((p) => p.firstName.toLowerCase().includes(q) || p.lastName.toLowerCase().includes(q));
  }, [persons, personQuery]);
  const [location, setLocation] = useState("");
  const [narrative, setNarrative] = useState("");
  const [confiscatedItems, setConfiscatedItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");

  // Charges state
  const [selectedCharges, setSelectedCharges] = useState<Charge[]>([]);
  const [chargeQuery, setChargeQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<ChargeSeverity | "">("");
  const [availableCharges, setAvailableCharges] = useState<Charge[]>([]);

  // Calculate totals
  const totalFine = selectedCharges.reduce((sum, charge) => sum + charge.fine, 0);
  const totalJailTime = selectedCharges.reduce((sum, charge) => sum + charge.jailTime, 0);

  // Search for charges
  const handleChargeSearch = () => {
    const results = searchCharges(chargeQuery, severityFilter);
    setAvailableCharges(results);
  };

  // Add charge
  const addCharge = (charge: Charge) => {
    if (!selectedCharges.find(c => c.id === charge.id)) {
      setSelectedCharges([...selectedCharges, charge]);
    }
  };

  // Remove charge
  const removeCharge = (chargeId: string) => {
    setSelectedCharges(selectedCharges.filter(c => c.id !== chargeId));
  };

  // Add confiscated item
  const addConfiscatedItem = () => {
    if (newItem.trim() && !confiscatedItems.includes(newItem.trim())) {
      setConfiscatedItems([...confiscatedItems, newItem.trim()]);
      setNewItem("");
    }
  };

  // Submit arrest
  const handleSubmit = () => {
    if (!selectedPerson || selectedCharges.length === 0 || !currentOfficer) return;

    createArrest({
      personId: selectedPerson.id,
      personName: selectedPerson.name,
      charges: selectedCharges.map(c => ({
        chargeId: c.id,
        chargeCode: c.code,
        chargeTitle: c.title,
        severity: c.severity,
        fine: c.fine,
        jailTime: c.jailTime,
      })),
      totalFine,
      totalJailTime,
      arrestedBy: `${currentOfficer.rank} ${currentOfficer.lastName}`,
      location,
      narrative,
      confiscatedItems,
      processed: true,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#0d1424] border border-[#151d31] rounded-xl w-full max-w-6xl my-8">
        {/* Header */}
        <div className="p-5 border-b border-[#151d31] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Procesar Nuevo Arresto</h2>
            <p className="text-slate-500 text-xs mt-0.5">Completa todas las secciones para procesar el arresto</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#121a2e] rounded-lg text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-5 py-3 border-b border-[#151d31]">
          <div className="flex items-center gap-2">
            {(["person", "charges", "review"] as const).map((s, idx) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => setStep(s)}
                  className={`flex items-center gap-2 flex-1 px-3 py-2 rounded-lg transition-colors text-sm ${
                    step === s
                      ? "bg-[#3c68c9] text-white"
                      : "bg-[#121a2e] text-slate-400 hover:bg-[#151d31]"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${
                    step === s ? "bg-white/20 text-white" : "bg-[#151d31] text-slate-500"
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="font-medium capitalize">{STEP_LABEL[s]}</span>
                </button>
                {idx < 2 && <div className="w-4 h-px bg-[#151d31]" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Step 1: Person & Basic Info */}
          {step === "person" && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left: Mugshot Area */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Información del Arrestado</h3>
                  <div className="bg-[#121a2e] border border-[#1e2a45] rounded-xl p-6 text-center">
                    <div className="w-48 h-48 bg-slate-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <User className="w-24 h-24 text-slate-600" />
                    </div>
                    <p className="text-slate-400 text-sm">Marcador de foto policial</p>
                  </div>
                </div>

                {/* Right: Person Selection */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Seleccionar Persona</h3>
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={personQuery}
                        onChange={e => setPersonQuery(e.target.value)}
                        placeholder="Buscar por nombre..."
                        className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#3c68c9]"
                      />
                    </div>

                    {selectedPerson && (
                      <div className="bg-blue-500/20 border border-[#3c68c9] rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-bold">{selectedPerson.name}</div>
                            <div className="text-sm text-[#6f93d6]">Seleccionado</div>
                          </div>
                          <button
                            onClick={() => setSelectedPerson(null)}
                            className="p-1 hover:bg-[#4d78d6]/20 rounded"
                          >
                            <X className="w-5 h-5 text-[#6f93d6]" />
                          </button>
                        </div>
                      </div>
                    )}

                    {!selectedPerson && personQuery.trim() && (
                      <div className="space-y-2 max-h-52 overflow-y-auto">
                        {personResults.length === 0 && (
                          <div className="text-center py-6 text-slate-500 text-sm">No se encontraron ciudadanos.</div>
                        )}
                        {personResults.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setSelectedPerson({ id: p.id, name: `${p.firstName} ${p.lastName}` })}
                            className="w-full bg-[#121a2e] hover:bg-[#151d31] border border-[#1e2a45] rounded-lg p-4 text-left transition-colors"
                          >
                            <div className="text-white font-medium">{p.firstName} {p.lastName}</div>
                            <div className="text-sm text-slate-400">{p.address}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Ubicación del Arresto</label>
                    <input
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="ej. Calle Principal y 5ta Avenida"
                      className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#3c68c9]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => selectedPerson && location && setStep("charges")}
                  disabled={!selectedPerson || !location}
                  className="bg-[#3c68c9] hover:bg-[#4d78d6] disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Continuar a Cargos
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Charges */}
          {step === "charges" && (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Left: Charge Search */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Buscar Cargos</h3>

                  {/* Search & Filters */}
                  <div className="space-y-2.5">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={chargeQuery}
                        onChange={e => setChargeQuery(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleChargeSearch()}
                        placeholder="Buscar por código o título..."
                        className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#3c68c9]"
                      />
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setSeverityFilter("");
                          handleChargeSearch();
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          severityFilter === ""
                            ? "bg-[#3c68c9] text-white"
                            : "bg-[#121a2e] text-slate-400 hover:bg-[#151d31]"
                        }`}
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => {
                          setSeverityFilter("Infraction");
                          handleChargeSearch();
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          severityFilter === "Infraction"
                            ? "bg-[#3c68c9] text-white"
                            : "bg-[#121a2e] text-slate-400 hover:bg-[#151d31]"
                        }`}
                      >
                        Infracciones
                      </button>
                      <button
                        onClick={() => {
                          setSeverityFilter("Misdemeanor");
                          handleChargeSearch();
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          severityFilter === "Misdemeanor"
                            ? "bg-orange-600 text-white"
                            : "bg-[#121a2e] text-slate-400 hover:bg-[#151d31]"
                        }`}
                      >
                        Delitos Menores
                      </button>
                      <button
                        onClick={() => {
                          setSeverityFilter("Felony");
                          handleChargeSearch();
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          severityFilter === "Felony"
                            ? "bg-red-600 text-white"
                            : "bg-[#121a2e] text-slate-400 hover:bg-[#151d31]"
                        }`}
                      >
                        Delitos Graves
                      </button>
                    </div>

                    <button
                      onClick={handleChargeSearch}
                      className="w-full bg-[#3c68c9] hover:bg-[#4d78d6] text-white py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Buscar Cargos
                    </button>
                  </div>

                  {/* Available Charges */}
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {availableCharges.length === 0 && (
                      <div className="text-center py-6 text-slate-500 text-sm">
                        Busca cargos para agregar
                      </div>
                    )}
                    {availableCharges.map(charge => (
                      <button
                        key={charge.id}
                        onClick={() => addCharge(charge)}
                        className="w-full bg-[#121a2e] hover:bg-[#151d31] border border-[#1e2a45] rounded-lg p-3 text-left transition-colors"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              charge.severity === "Felony" ? "bg-red-500 text-white" :
                              charge.severity === "Misdemeanor" ? "bg-orange-500 text-white" :
                              "bg-blue-500 text-white"
                            }`}>
                              {SEVERITY_LABEL[charge.severity]}
                            </span>
                            <span className="text-xs text-slate-400">{charge.code}</span>
                          </div>
                        </div>
                        <div className="text-white font-medium text-sm mb-1">{charge.title}</div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-green-400">${charge.fine}</span>
                          <span className="text-orange-400">{charge.jailTime}m</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: Selected Charges */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Cargos Seleccionados ({selectedCharges.length})
                  </h3>

                  <div className="bg-[#121a2e] rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Multa Total:</span>
                      <span className="text-lg font-semibold text-green-400 tabular-nums">
                        ${totalFine.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Tiempo Total:</span>
                      <span className="text-lg font-semibold text-orange-400 tabular-nums">
                        {totalJailTime} meses
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[350px] overflow-y-auto">
                    {selectedCharges.length === 0 && (
                      <div className="text-center py-6 text-slate-500 text-sm">
                        Sin cargos seleccionados
                      </div>
                    )}
                    {selectedCharges.map(charge => (
                      <div
                        key={charge.id}
                        className="bg-[#121a2e] border border-[#1e2a45] rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                charge.severity === "Felony" ? "bg-red-500 text-white" :
                                charge.severity === "Misdemeanor" ? "bg-orange-500 text-white" :
                                "bg-blue-500 text-white"
                              }`}>
                                {SEVERITY_LABEL[charge.severity]}
                              </span>
                              <span className="text-xs text-slate-400">{charge.code}</span>
                            </div>
                            <div className="text-white font-medium text-sm">{charge.title}</div>
                          </div>
                          <button
                            onClick={() => removeCharge(charge.id)}
                            className="p-1 hover:bg-red-500/20 rounded transition-colors"
                          >
                            <X className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                        <div className="flex items-center gap-4 text-xs mt-2">
                          <span className="text-green-400">${charge.fine}</span>
                          <span className="text-orange-400">{charge.jailTime}m</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep("person")}
                  className="bg-[#121a2e] hover:bg-[#151d31] text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={() => selectedCharges.length > 0 && setStep("review")}
                  disabled={selectedCharges.length === 0}
                  className="bg-[#3c68c9] hover:bg-[#4d78d6] disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Continuar a Revisión
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === "review" && (
            <div className="space-y-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Revisar y Enviar</h3>

              {/* Summary */}
              <div className="grid md:grid-cols-3 gap-3">
                <div className="bg-[#121a2e] rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">Arrestado</div>
                  <div className="text-white font-medium">{selectedPerson?.name}</div>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <div className="text-xs text-green-400/80 mb-1">Multa Total</div>
                  <div className="text-lg font-semibold text-green-400 tabular-nums">
                    ${totalFine.toLocaleString()}
                  </div>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                  <div className="text-xs text-orange-400/80 mb-1">Tiempo Total</div>
                  <div className="text-lg font-semibold text-orange-400 tabular-nums">{totalJailTime} meses</div>
                </div>
              </div>

              {/* Narrative */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Narrativa del Arresto</label>
                <textarea
                  value={narrative}
                  onChange={e => setNarrative(e.target.value)}
                  placeholder="Describe las circunstancias del arresto..."
                  rows={6}
                  className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#3c68c9] resize-none"
                  required
                />
              </div>

              {/* Confiscated Items */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Objetos Confiscados</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newItem}
                    onChange={e => setNewItem(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addConfiscatedItem())}
                    placeholder="Agrega un objeto y presiona Enter..."
                    className="flex-1 bg-[#121a2e] border border-[#1e2a45] rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#3c68c9]"
                  />
                  <button
                    onClick={addConfiscatedItem}
                    className="bg-[#3c68c9] hover:bg-[#4d78d6] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Agregar
                  </button>
                </div>
                {confiscatedItems.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {confiscatedItems.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-blue-500/20 text-[#6f93d6] rounded-lg text-sm font-medium flex items-center gap-2"
                      >
                        {item}
                        <button
                          onClick={() =>
                            setConfiscatedItems(confiscatedItems.filter((_, i) => i !== idx))
                          }
                          className="hover:text-[#6f93d6]"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep("charges")}
                  className="bg-[#121a2e] hover:bg-[#151d31] text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!narrative}
                  className="bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Procesar Arresto
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
