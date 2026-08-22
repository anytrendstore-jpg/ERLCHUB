"use client";

import { useEffect, useState } from "react";
import { useMDT } from "@/contexts/MDTContext";
import MDTLayout from "./MDTLayout";
import type { Vehicle } from "@/lib/mdtTypes";
import {
  Search,
  Plus,
  Car,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Hash,
  Calendar,
  MapPin,
  Eye,
  ShieldCheck,
  Loader2,
} from "lucide-react";

const REGISTRATION_LABEL: Record<"Valid" | "Expired", string> = {
  Valid: "Vigente",
  Expired: "Vencido",
};

const INSURANCE_LABEL: Record<"Valid" | "Expired" | "None", string> = {
  Valid: "Vigente",
  Expired: "Vencido",
  None: "Sin seguro",
};

interface RegistryResult {
  found: boolean;
  vehicle?: { name: string; brand: string; plate: string; color: string; financed: boolean; purchasedAt: string; ownerName: string };
}

export function MDTVehiclesContent({
  showAddVehicle,
  setShowAddVehicle,
}: {
  showAddVehicle: boolean;
  setShowAddVehicle: (v: boolean) => void;
}) {
  const { state, searchVehicle, addVehicle, clearFocusRequest } = useMDT();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [registry, setRegistry] = useState<RegistryResult | null>(null);
  const [checkingRegistry, setCheckingRegistry] = useState(false);

  // Llegó desde la búsqueda global pidiendo abrir un vehículo puntual.
  useEffect(() => {
    if (state.focusRequest?.entity !== "vehicle") return;
    const vehicle = state.vehicles.find((v) => v.id === state.focusRequest!.id);
    if (vehicle) selectVehicle(vehicle);
    clearFocusRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.focusRequest, state.vehicles]);

  const handleSearch = () => {
    const results = searchVehicle(searchQuery);
    setSearchResults(results);
    setSelectedVehicle(null);
    setRegistry(null);
  };

  const selectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setRegistry(null);
    setCheckingRegistry(true);
    fetch(`/api/mdt/verify/vehicle?plate=${encodeURIComponent(vehicle.plate)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => { if (data.success) setRegistry(data); })
      .finally(() => setCheckingRegistry(false));
  };

  return (
    <>
      {/* Search Bar */}
      <div className="mb-5">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Buscar por placa, marca o modelo..."
              className="w-full bg-[#0d1424] border border-[#151d31] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#3c68c9] focus:ring-2 focus:ring-[#3c68c9]/20"
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-[#3c68c9] hover:bg-[#4d78d6] text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Buscar
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Search Results */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Resultados {searchResults.length > 0 && `(${searchResults.length})`}
          </h3>

          {searchResults.length === 0 && (
            <div className="bg-[#0d1424] border border-[#151d31] rounded-lg p-6 text-center">
              <Car className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-xs">
                {searchQuery ? "No se encontraron vehículos" : "Ingresa un término de búsqueda"}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {searchResults.map(vehicle => (
              <button
                key={vehicle.id}
                onClick={() => selectVehicle(vehicle)}
                className={`w-full bg-[#0d1424] border rounded-lg p-4 text-left hover:border-[#3c68c9]/50 transition-colors ${
                  selectedVehicle?.id === vehicle.id ? "border-[#3c68c9]" : "border-[#151d31]"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-white font-bold text-lg">{vehicle.plate}</div>
                    <div className="text-sm text-slate-400">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </div>
                  </div>
                  {vehicle.isStolen && (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  )}
                </div>
                {vehicle.flags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {vehicle.flags.slice(0, 2).map((flag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded"
                      >
                        {flag}
                      </span>
                    ))}
                    {vehicle.flags.length > 2 && (
                      <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs rounded">
                        +{vehicle.flags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="lg:col-span-2">
          {!selectedVehicle ? (
            <div className="bg-[#0d1424] border border-[#151d31] rounded-lg p-10 text-center">
              <Eye className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Selecciona un vehículo para ver los detalles</p>
            </div>
          ) : (
            <div className="bg-[#0d1424] border border-[#151d31] rounded-lg p-5 space-y-5">
              {/* Header */}
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-[#121a2e] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Car className="w-9 h-9 text-slate-600" />
                </div>

                <div className="flex-1 space-y-2">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{selectedVehicle.plate}</h2>
                    <p className="text-sm text-slate-500">
                      {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      selectedVehicle.isStolen
                        ? "bg-red-500/20 text-red-400"
                        : "bg-green-500/20 text-green-400"
                    }`}>
                      {selectedVehicle.isStolen ? "ROBADO" : "NO ROBADO"}
                    </div>
                    <div className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      selectedVehicle.registration === "Valid"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}>
                      Registro: {REGISTRATION_LABEL[selectedVehicle.registration]}
                    </div>
                    <div className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      selectedVehicle.insurance === "Valid"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}>
                      Seguro: {INSURANCE_LABEL[selectedVehicle.insurance]}
                    </div>
                  </div>

                  {selectedVehicle.flags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedVehicle.flags.map((flag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[11px] rounded font-medium"
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* DGT Registry Check — cruce con el registro real del Concesionario */}
              <div className="rounded-lg p-4 border bg-[#121a2e]/50 border-[#151d31]">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-400 text-sm font-medium">Verificación de Registro (Concesionario)</span>
                </div>
                {checkingRegistry ? (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Consultando registro oficial...
                  </div>
                ) : registry?.found ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-green-400 font-bold text-sm">
                      <CheckCircle className="w-4 h-4" /> Registro verificado
                    </div>
                    <div className="text-sm text-white">
                      {registry.vehicle!.brand} {registry.vehicle!.name} · Propietario real: <span className="font-semibold">{registry.vehicle!.ownerName}</span>
                    </div>
                    {registry.vehicle!.financed && (
                      <div className="text-xs text-yellow-400">Vehículo con crédito activo en el Concesionario</div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                    <XCircle className="w-4 h-4" /> Sin registro en el Concesionario — posible placa falsificada o adulterada
                  </div>
                )}
              </div>

              {/* Vehicle Information */}
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-[#151d31] pb-2">
                    Información del Vehículo
                  </h3>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400">Marca:</span>
                      <span className="text-white font-medium">{selectedVehicle.make}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400">Modelo:</span>
                      <span className="text-white font-medium">{selectedVehicle.model}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400">Año:</span>
                      <span className="text-white font-medium">{selectedVehicle.year}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400">Color:</span>
                      <span className="text-white font-medium">{selectedVehicle.color}</span>
                    </div>
                    {selectedVehicle.vin && (
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-400">VIN:</span>
                        <span className="text-white font-medium font-mono text-xs">
                          {selectedVehicle.vin}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-[#151d31] pb-2">
                    Información de Registro
                  </h3>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-start gap-2">
                      <Hash className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-slate-400 block">Propietario Registrado:</span>
                        <span className="text-white font-medium">{selectedVehicle.registeredOwner}</span>
                      </div>
                    </div>
                    {selectedVehicle.lastSeenLocation && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-slate-400 block">Última Ubicación:</span>
                          <span className="text-white font-medium">{selectedVehicle.lastSeenLocation}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="grid md:grid-cols-3 gap-3">
                <div className="bg-[#121a2e]/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-500 text-xs">Estado de Robo</span>
                    {selectedVehicle.isStolen ? (
                      <XCircle className="w-4 h-4 text-red-400" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                  <div className={`text-sm font-medium ${
                    selectedVehicle.isStolen ? "text-red-400" : "text-green-400"
                  }`}>
                    {selectedVehicle.isStolen ? "ROBADO" : "No Robado"}
                  </div>
                </div>

                <div className="bg-[#121a2e]/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-500 text-xs">Registro</span>
                    {selectedVehicle.registration === "Valid" ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className={`text-sm font-medium ${
                    selectedVehicle.registration === "Valid" ? "text-green-400" : "text-red-400"
                  }`}>
                    {REGISTRATION_LABEL[selectedVehicle.registration]}
                  </div>
                </div>

                <div className="bg-[#121a2e]/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-500 text-xs">Seguro</span>
                    {selectedVehicle.insurance === "Valid" ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className={`text-sm font-medium ${
                    selectedVehicle.insurance === "Valid" ? "text-green-400" : "text-red-400"
                  }`}>
                    {INSURANCE_LABEL[selectedVehicle.insurance]}
                  </div>
                </div>
              </div>

              {/* Record Info */}
              <div className="pt-4 border-t border-[#151d31] text-xs text-slate-500 space-y-1">
                <div>Creado: {new Date(selectedVehicle.createdAt).toLocaleString("es-ES")}</div>
                <div>Actualizado: {new Date(selectedVehicle.updatedAt).toLocaleString("es-ES")}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {showAddVehicle && <AddVehicleModal onClose={() => setShowAddVehicle(false)} />}
    </>
  );
}

export default function MDTVehicles() {
  const [showAddVehicle, setShowAddVehicle] = useState(false);

  return (
    <MDTLayout
      title="Base de Datos de Vehículos"
      subtitle="Busca y gestiona registros de vehículos"
      actions={
        <button
          onClick={() => setShowAddVehicle(true)}
          className="flex items-center gap-2 bg-[#3c68c9] hover:bg-[#4d78d6] text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar Vehículo
        </button>
      }
    >
      <MDTVehiclesContent showAddVehicle={showAddVehicle} setShowAddVehicle={setShowAddVehicle} />
    </MDTLayout>
  );
}

function AddVehicleModal({ onClose }: { onClose: () => void }) {
  const { addVehicle } = useMDT();
  const [formData, setFormData] = useState({
    plate: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    vin: "",
    registeredOwner: "",
    isStolen: false,
    flags: [] as string[],
    insurance: "Valid" as const,
    registration: "Valid" as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addVehicle(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#0d1424] border border-[#151d31] rounded-xl p-6 w-full max-w-3xl my-8">
        <h2 className="text-lg font-semibold text-white mb-5">Agregar Nuevo Vehículo</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Placa</label>
              <input
                type="text"
                value={formData.plate}
                onChange={e => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                placeholder="ABC123"
                className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3c68c9] uppercase"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">VIN (Opcional)</label>
              <input
                type="text"
                value={formData.vin}
                onChange={e => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                placeholder="1HGBH41JXMN109186"
                className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3c68c9] uppercase font-mono text-sm"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Marca</label>
              <input
                type="text"
                value={formData.make}
                onChange={e => setFormData({ ...formData, make: e.target.value })}
                placeholder="Toyota"
                className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3c68c9]"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Modelo</label>
              <input
                type="text"
                value={formData.model}
                onChange={e => setFormData({ ...formData, model: e.target.value })}
                placeholder="Camry"
                className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3c68c9]"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Año</label>
              <input
                type="number"
                value={formData.year}
                onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
                min={1900}
                max={new Date().getFullYear() + 1}
                className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3c68c9]"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Color</label>
              <input
                type="text"
                value={formData.color}
                onChange={e => setFormData({ ...formData, color: e.target.value })}
                placeholder="Negro"
                className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3c68c9]"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Propietario Registrado</label>
              <input
                type="text"
                value={formData.registeredOwner}
                onChange={e => setFormData({ ...formData, registeredOwner: e.target.value })}
                placeholder="Juan Pérez"
                className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3c68c9]"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Estado del Seguro</label>
              <select
                value={formData.insurance}
                onChange={e => setFormData({ ...formData, insurance: e.target.value as any })}
                className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3c68c9]"
              >
                <option value="Valid">Vigente</option>
                <option value="Expired">Vencido</option>
                <option value="None">Sin seguro</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Estado del Registro</label>
              <select
                value={formData.registration}
                onChange={e => setFormData({ ...formData, registration: e.target.value as any })}
                className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3c68c9]"
              >
                <option value="Valid">Vigente</option>
                <option value="Expired">Vencido</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Robado</label>
              <div className="flex items-center h-[42px]">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isStolen}
                    onChange={e => setFormData({ ...formData, isStolen: e.target.checked })}
                    className="w-5 h-5 bg-[#121a2e] border border-[#1e2a45] rounded accent-blue-600"
                  />
                  <span className="text-white">Marcar como robado</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-[#3c68c9] hover:bg-[#4d78d6] text-white py-2.5 rounded-lg font-bold transition-colors"
            >
              Agregar Vehículo
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#121a2e] hover:bg-[#151d31] text-white py-2.5 rounded-lg font-bold transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
