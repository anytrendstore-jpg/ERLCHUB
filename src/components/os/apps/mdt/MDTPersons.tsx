"use client";

import { useEffect, useState } from "react";
import { useMDT } from "@/contexts/MDTContext";
import MDTLayout from "./MDTLayout";
import type { Person, Gender, RiskLevel, LicenseStatus } from "@/lib/mdtTypes";
import {
  Search,
  Plus,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Calendar,
  Hash,
  Eye,
  ShieldCheck,
  Loader2,
} from "lucide-react";

const RISK_LABEL: Record<RiskLevel, string> = {
  None: "Ninguno",
  Caution: "Precaución",
  Dangerous: "Peligroso",
  "Armed & Dangerous": "Armado y Peligroso",
};

const GENDER_LABEL: Record<Gender, string> = {
  Male: "Masculino",
  Female: "Femenino",
  Other: "Otro",
};

const LICENSE_LABEL: Record<LicenseStatus, string> = {
  Valid: "Válida",
  Suspended: "Suspendida",
  Revoked: "Revocada",
  Expired: "Vencida",
};

interface LicenseCheck {
  found: boolean;
  person?: { documentNumber: string; hasWeaponLicense: boolean; weaponLicenseIssuedAt: string | null };
}

export function MDTPersonsContent({
  showAddPerson,
  setShowAddPerson,
}: {
  showAddPerson: boolean;
  setShowAddPerson: (v: boolean) => void;
}) {
  const { state, searchPerson, addPerson, clearFocusRequest } = useMDT();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [licenseCheck, setLicenseCheck] = useState<LicenseCheck | null>(null);
  const [checkingLicense, setCheckingLicense] = useState(false);

  // Llegó desde la búsqueda global (o desde otro registro) pidiendo abrir un ciudadano puntual.
  useEffect(() => {
    if (state.focusRequest?.entity !== "person") return;
    const person = state.persons.find((p) => p.id === state.focusRequest!.id);
    if (person) selectPerson(person);
    clearFocusRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.focusRequest, state.persons]);

  const handleSearch = () => {
    const results = searchPerson(searchQuery);
    setSearchResults(results);
    setSelectedPerson(null);
    setLicenseCheck(null);
  };

  const selectPerson = (person: Person) => {
    setSelectedPerson(person);
    setLicenseCheck(null);
    setCheckingLicense(true);
    fetch(`/api/mdt/verify/license?firstName=${encodeURIComponent(person.firstName)}&lastName=${encodeURIComponent(person.lastName)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => { if (data.success) setLicenseCheck(data); })
      .finally(() => setCheckingLicense(false));
  };

  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
      case "None":
        return "text-green-400";
      case "Caution":
        return "text-yellow-400";
      case "Dangerous":
        return "text-orange-400";
      case "Armed & Dangerous":
        return "text-red-400";
    }
  };

  const getLicenseIcon = (status: LicenseStatus) => {
    switch (status) {
      case "Valid":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "Suspended":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case "Revoked":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "Expired":
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
    }
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
              placeholder="Buscar por nombre o apellido..."
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
              <User className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-xs">
                {searchQuery ? "No se encontraron ciudadanos" : "Ingresa un término de búsqueda"}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {searchResults.map(person => (
              <button
                key={person.id}
                onClick={() => selectPerson(person)}
                className={`w-full bg-[#0d1424] border rounded-lg p-4 text-left hover:border-[#3c68c9]/50 transition-colors ${
                  selectedPerson?.id === person.id ? "border-[#3c68c9]" : "border-[#151d31]"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-white font-bold">
                      {person.firstName} {person.lastName}
                    </div>
                    <div className="text-xs text-slate-400">
                      Nacimiento: {new Date(person.dateOfBirth).toLocaleDateString("es-ES")}
                    </div>
                  </div>
                  {person.riskLevel !== "None" && (
                    <AlertTriangle className={`w-5 h-5 ${getRiskColor(person.riskLevel)}`} />
                  )}
                </div>
                {person.flags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {person.flags.slice(0, 2).map((flag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded"
                      >
                        {flag}
                      </span>
                    ))}
                    {person.flags.length > 2 && (
                      <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs rounded">
                        +{person.flags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Person Details */}
        <div className="lg:col-span-2">
          {!selectedPerson ? (
            <div className="bg-[#0d1424] border border-[#151d31] rounded-lg p-10 text-center">
              <Eye className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Selecciona un ciudadano para ver los detalles</p>
            </div>
          ) : (
            <div className="bg-[#0d1424] border border-[#151d31] rounded-lg p-5 space-y-5">
              {/* Header with Mugshot */}
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-[#121a2e] rounded-lg flex items-center justify-center flex-shrink-0">
                  {selectedPerson.mugshot ? (
                    <img
                      src={selectedPerson.mugshot}
                      alt="Mugshot"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <User className="w-9 h-9 text-slate-600" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {selectedPerson.firstName} {selectedPerson.lastName}
                    </h2>
                    <p className="text-slate-500 text-xs">Registro de Ciudadano</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      selectedPerson.riskLevel === "None" ? "bg-green-500/20 text-green-400" :
                      selectedPerson.riskLevel === "Caution" ? "bg-yellow-500/20 text-yellow-400" :
                      selectedPerson.riskLevel === "Dangerous" ? "bg-orange-500/20 text-orange-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {RISK_LABEL[selectedPerson.riskLevel]}
                    </div>
                  </div>

                  {selectedPerson.flags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPerson.flags.map((flag, idx) => (
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

              {/* Personal Information */}
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-[#151d31] pb-2">
                    Información Personal
                  </h3>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400">Nacimiento:</span>
                      <span className="text-white font-medium">
                        {new Date(selectedPerson.dateOfBirth).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400">Sexo:</span>
                      <span className="text-white font-medium">{GENDER_LABEL[selectedPerson.gender]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400">Estatura:</span>
                      <span className="text-white font-medium">{selectedPerson.height}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400">Peso:</span>
                      <span className="text-white font-medium">{selectedPerson.weight}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400">Ojos:</span>
                      <span className="text-white font-medium">{selectedPerson.eyeColor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400">Cabello:</span>
                      <span className="text-white font-medium">{selectedPerson.hairColor}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-[#151d31] pb-2">
                    Información de Contacto
                  </h3>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <span className="text-slate-400 block">Dirección:</span>
                        <span className="text-white font-medium">{selectedPerson.address}</span>
                      </div>
                    </div>
                    {selectedPerson.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-400">Teléfono:</span>
                        <span className="text-white font-medium">{selectedPerson.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Licenses */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-[#151d31] pb-2">
                  Licencias
                </h3>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="bg-[#121a2e]/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-slate-500 text-xs">Licencia de Conducir</span>
                      {getLicenseIcon(selectedPerson.licenses.driver)}
                    </div>
                    <div className="text-white text-sm font-medium">{LICENSE_LABEL[selectedPerson.licenses.driver]}</div>
                  </div>
                  <div className="bg-[#121a2e]/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-slate-500 text-xs">Permiso de Armas</span>
                      {getLicenseIcon(selectedPerson.licenses.weapon)}
                    </div>
                    <div className="text-white text-sm font-medium">{LICENSE_LABEL[selectedPerson.licenses.weapon]}</div>
                  </div>
                  <div className="bg-[#121a2e]/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-slate-500 text-xs">Licencia de Piloto</span>
                      {getLicenseIcon(selectedPerson.licenses.pilot)}
                    </div>
                    <div className="text-white text-sm font-medium">{LICENSE_LABEL[selectedPerson.licenses.pilot]}</div>
                  </div>
                </div>
              </div>

              {/* Verificación real — cruce con el DNI y la licencia de armas de Ammu-Nation */}
              <div className="rounded-lg p-4 border bg-[#121a2e]/50 border-[#151d31]">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-400 text-sm font-medium">Verificación de Porte de Armas (Ammu-Nation)</span>
                </div>
                {checkingLicense ? (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Consultando registro oficial...
                  </div>
                ) : !licenseCheck?.found ? (
                  <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                    <XCircle className="w-4 h-4" /> Sin DNI real asociado — identidad no verificable
                  </div>
                ) : licenseCheck.person!.hasWeaponLicense ? (
                  <div className="flex items-center gap-2 text-green-400 font-bold text-sm">
                    <CheckCircle className="w-4 h-4" /> Porte de armas verificado — DNI N.º {licenseCheck.person!.documentNumber}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                    <XCircle className="w-4 h-4" /> Sin licencia de armas registrada — DNI N.º {licenseCheck.person!.documentNumber}
                  </div>
                )}
              </div>

              {/* Record Info */}
              <div className="pt-4 border-t border-[#151d31] text-xs text-slate-500 space-y-1">
                <div>Creado: {new Date(selectedPerson.createdAt).toLocaleString("es-ES")}</div>
                <div>Actualizado: {new Date(selectedPerson.updatedAt).toLocaleString("es-ES")}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Person Modal */}
      {showAddPerson && <AddPersonModal onClose={() => setShowAddPerson(false)} />}
    </>
  );
}

export default function MDTPersons() {
  const [showAddPerson, setShowAddPerson] = useState(false);

  return (
    <MDTLayout
      title="Base de Datos de Ciudadanos"
      subtitle="Busca y gestiona registros de ciudadanos"
      actions={
        <button
          onClick={() => setShowAddPerson(true)}
          className="flex items-center gap-2 bg-[#3c68c9] hover:bg-[#4d78d6] text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar Ciudadano
        </button>
      }
    >
      <MDTPersonsContent showAddPerson={showAddPerson} setShowAddPerson={setShowAddPerson} />
    </MDTLayout>
  );
}

function AddPersonModal({ onClose }: { onClose: () => void }) {
  const { addPerson } = useMDT();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "Male" as Gender,
    height: "",
    weight: "",
    eyeColor: "",
    hairColor: "",
    address: "",
    phoneNumber: "",
    riskLevel: "None" as RiskLevel,
    flags: [] as string[],
    licenses: {
      driver: "Valid" as LicenseStatus,
      weapon: "Valid" as LicenseStatus,
      pilot: "Valid" as LicenseStatus,
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPerson({
      ...formData,
      dateOfBirth: new Date(formData.dateOfBirth),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#0d1424] border border-[#151d31] rounded-xl p-6 w-full max-w-4xl my-8">
        <h2 className="text-lg font-semibold text-white mb-5">Agregar Nuevo Ciudadano</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Nombre</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3c68c9]"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Apellido</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3c68c9]"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Fecha de Nacimiento</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3c68c9]"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Sexo</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value as Gender })}
                className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3c68c9]"
              >
                <option value="Male">Masculino</option>
                <option value="Female">Femenino</option>
                <option value="Other">Otro</option>
              </select>
            </div>
          </div>

          {/* Physical Description */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Estatura</label>
              <input
                type="text"
                value={formData.height}
                onChange={e => setFormData({ ...formData, height: e.target.value })}
                placeholder="6'0&quot;"
                className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3c68c9]"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Peso</label>
              <input
                type="text"
                value={formData.weight}
                onChange={e => setFormData({ ...formData, weight: e.target.value })}
                placeholder="180 lbs"
                className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3c68c9]"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Color de Ojos</label>
              <input
                type="text"
                value={formData.eyeColor}
                onChange={e => setFormData({ ...formData, eyeColor: e.target.value })}
                placeholder="Marrón"
                className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3c68c9]"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Color de Cabello</label>
              <input
                type="text"
                value={formData.hairColor}
                onChange={e => setFormData({ ...formData, hairColor: e.target.value })}
                placeholder="Negro"
                className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3c68c9]"
                required
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Dirección</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Calle Principal 123, Los Santos"
                className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3c68c9]"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Número de Teléfono (Opcional)</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="(555) 123-4567"
                className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3c68c9]"
              />
            </div>
          </div>

          {/* Risk Level */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Nivel de Riesgo</label>
            <select
              value={formData.riskLevel}
              onChange={e => setFormData({ ...formData, riskLevel: e.target.value as RiskLevel })}
              className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3c68c9]"
            >
              <option value="None">Ninguno</option>
              <option value="Caution">Precaución</option>
              <option value="Dangerous">Peligroso</option>
              <option value="Armed & Dangerous">Armado y Peligroso</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-[#3c68c9] hover:bg-[#4d78d6] text-white py-2.5 rounded-lg font-bold transition-colors"
            >
              Agregar Ciudadano
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
