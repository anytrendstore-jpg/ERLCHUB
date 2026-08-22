"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Loader2, CreditCard,
  User, Calendar, MapPin, Users, Flag,
  Check, Download, Eye, Lock,
  Sparkles, AlertCircle, ChevronDown
} from "lucide-react";
import ParticlesBackground from "@/components/ParticlesBackground";
import WhitelistStepper from "@/components/WhitelistStepper";
import DocumentViewer3D from "@/components/documents/DocumentViewer3D";
import { useWhitelistApplication } from "@/hooks/useWhitelistApplication";
import WhitelistBetaPanel from "@/components/WhitelistBetaPanel";
import {
  CITIES, HEIGHT_OPTIONS, NATIONALITY_OPTIONS, BIRTHPLACE_OPTIONS, GROUP_OPTIONS,
  type City, type DocumentType
} from "@/lib/whitelistTypes";

const CURRENT_YEAR = new Date().getFullYear();
const MIN_AGE = 18;
const BIRTH_MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
const BIRTH_YEARS = Array.from({ length: 82 }, (_, i) => CURRENT_YEAR - MIN_AGE - i); // 18 a 99 años
const daysInMonth = (month: number, year: number) => new Date(year, month, 0).getDate();

const documentTypes: { id: DocumentType; name: string; description: string; available: boolean }[] = [
  {
    id: "license",
    name: "Licencia de Conducir",
    description: "Con el diseño oficial de tu ciudad",
    available: true
  },
  {
    id: "residence_card",
    name: "Tarjeta de Residencia Permanente",
    description: "Green Card - Residencia en USA (próximamente)",
    available: false
  },
  {
    id: "passport",
    name: "Pasaporte Oficial",
    description: "Con 2 páginas reales (próximamente)",
    available: false
  },
];

export default function DNIPage() {
  const router = useRouter();
  const { application, loading, run } = useWhitelistApplication(["dni", "completed"]);

  const [step, setStep] = useState<"city" | "form" | "document" | "preview" | "complete">("city");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentType>("license");
  const [showDocumentSelect, setShowDocumentSelect] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    birthPlace: "",
    gender: "" as "male" | "female" | "other" | "",
    height: "",
    nationality: "",
    group: "",
    robloxUsername: ""
  });

  // Fecha de nacimiento como 3 selects (día/mes/año) en vez de un <input type="date">:
  // así el formato de captura es siempre el mismo, sin depender del navegador/idioma.
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const documentData = application?.document ?? null;

  useEffect(() => {
    const day = Number(birthDay), month = Number(birthMonth), year = Number(birthYear);
    if (day && month && year) {
      const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      setFormData(prev => (prev.birthDate === iso ? prev : { ...prev, birthDate: iso }));
    }
  }, [birthDay, birthMonth, birthYear]);

  // El usuario de Roblox sale de la fase anterior; si ya había un documento
  // generado, se recuperan los datos del personaje guardados.
  useEffect(() => {
    if (!application) return;

    setFormData(prev => ({
      ...prev,
      robloxUsername: application.roblox?.username || "",
      ...(application.character
        ? {
            firstName: application.character.firstName || prev.firstName,
            lastName: application.character.lastName || prev.lastName,
            birthDate: application.character.birthDate || prev.birthDate,
            birthPlace: application.character.birthPlace || prev.birthPlace,
            gender: (application.character.gender || prev.gender) as typeof prev.gender,
            height: application.character.height || prev.height,
            nationality: application.character.nationality || prev.nationality,
            group: application.character.group || prev.group
          }
        : {})
    }));

    if (application.character?.birthDate) {
      const [y, m, d] = application.character.birthDate.split("-");
      if (y && m && d) { setBirthYear(y); setBirthMonth(String(Number(m))); setBirthDay(String(Number(d))); }
    }
    if (application.character?.city) {
      setSelectedCity(application.character.city as City);
    }
    if (application.character?.photoUrl) {
      setPhotoUrl(application.character.photoUrl);
    }
    if (application.document) {
      setSelectedDocument(application.document.type as DocumentType);
      setStep("complete");
    }
  }, [application]);

  const handleCitySelect = (city: City) => {
    if (CITIES.find(c => c.id === city)?.available) {
      setSelectedCity(city);
      setStep("form");
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const isFormValid = () => {
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.birthDate &&
      formData.birthPlace.trim() &&
      formData.gender &&
      formData.height &&
      formData.nationality &&
      formData.group
    );
  };

  const handleGenerateDocument = async () => {
    if (!isFormValid() || !selectedCity) return;

    setIsLoading(true);
    setError(null);
    try {
      await run("character_submit", {
        documentType: selectedDocument,
        character: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          birthDate: formData.birthDate,
          birthPlace: formData.birthPlace.trim(),
          gender: formData.gender,
          height: formData.height,
          nationality: formData.nationality,
          group: formData.group,
          city: selectedCity,
          photoUrl: photoUrl || undefined
        }
      });
      setStep("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar el documento");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDocument = () => setStep("complete");

  const handleFinish = () => {
    router.push("/whitelist/completado");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#8e00f7] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a12] relative overflow-hidden">
      <ParticlesBackground />
      <WhitelistBetaPanel currentPhase="dni" />

      <header className="relative z-20 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="ERLC HUB" width={40} height={40} className="h-10 w-auto" />
            <span className="font-bold text-white text-lg">ERLCᴴᵁᴮ</span>
          </Link>
          <Link
            href="/whitelist/espera"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <WhitelistStepper currentPhase="dni" />
          </div>

          <div className="bg-[#12121c]/90 backdrop-blur-sm border border-[#1e1e2e] rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-[#1e1e2e]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#8e00f7]/20 flex items-center justify-center">
                  <CreditCard className="h-7 w-7 text-[#8e00f7]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Documento de Identidad</h1>
                  <p className="text-gray-400">Crea tu DNI oficial del servidor</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {step === "city" && (
                <div className="space-y-6">
                  <div className="text-center py-4">
                    <h2 className="text-xl font-bold text-white mb-2">Selecciona tu Ciudad</h2>
                    <p className="text-gray-400">
                      Elige la ciudad donde residirá tu personaje
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {CITIES.map((city) => (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => handleCitySelect(city.id)}
                        disabled={!city.available}
                        className={`group relative overflow-hidden rounded-xl text-left transition-all ${
                          city.available
                            ? "ring-2 ring-transparent hover:ring-[#8e00f7] cursor-pointer"
                            : "opacity-60 cursor-not-allowed"
                        }`}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${city.accent} opacity-90`} />
                        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors" />

                        {!city.available && (
                          <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 text-white text-xs font-medium rounded z-10">
                            Próximamente
                          </div>
                        )}

                        <div className="relative p-6">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-3xl drop-shadow">{city.flag}</span>
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/90 shadow">
                              <Image src="/logo.png" alt="ERLC HUB" width={22} height={22} className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-lg font-bold text-white drop-shadow">{city.name}</div>
                              <div className="text-sm text-white/80">{city.state}</div>
                            </div>
                          </div>
                          <div className="text-sm text-white/70">{city.country}</div>
                          {city.available && (
                            <div className="mt-3 flex items-center gap-1 text-white text-sm font-medium">
                              <Check className="w-4 h-4" />
                              Disponible
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === "form" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-[#0a0a12] rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {CITIES.find(c => c.id === selectedCity)?.flag}
                      </span>
                      <div>
                        <div className="font-medium text-white">
                          {CITIES.find(c => c.id === selectedCity)?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {CITIES.find(c => c.id === selectedCity)?.state}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep("city")}
                      className="text-sm text-[#8e00f7] hover:underline"
                    >
                      Cambiar
                    </button>
                  </div>

                  <div className="relative">
                    <label className="block text-sm text-gray-400 mb-2">Tipo de Documento</label>
                    <button
                      type="button"
                      onClick={() => setShowDocumentSelect(!showDocumentSelect)}
                      className="w-full flex items-center justify-between p-4 bg-[#0a0a12] border border-[#1e1e2e] rounded-xl text-left"
                    >
                      <div>
                        <div className="font-medium text-white">
                          {documentTypes.find(d => d.id === selectedDocument)?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {documentTypes.find(d => d.id === selectedDocument)?.description}
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showDocumentSelect ? 'rotate-180' : ''}`} />
                    </button>

                    {showDocumentSelect && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a12] border border-[#1e1e2e] rounded-xl overflow-hidden z-10">
                        {documentTypes.map((doc) => (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() => {
                              setSelectedDocument(doc.id);
                              setShowDocumentSelect(false);
                            }}
                            disabled={!doc.available}
                            className={`w-full p-4 text-left transition-colors ${
                              doc.available
                                ? "hover:bg-[#1a1a28]"
                                : "opacity-50 cursor-not-allowed"
                            } ${selectedDocument === doc.id ? "bg-[#8e00f7]/20" : ""}`}
                          >
                            <div className="font-medium text-white">{doc.name}</div>
                            <div className="text-sm text-gray-500">{doc.description}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Nombres <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleFormChange("firstName", e.target.value)}
                          placeholder="Juan Carlos"
                          className="w-full h-12 pl-12 pr-4 bg-[#0a0a12] border border-[#1e1e2e] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#8e00f7] transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Apellidos <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleFormChange("lastName", e.target.value)}
                          placeholder="Pérez García"
                          className="w-full h-12 pl-12 pr-4 bg-[#0a0a12] border border-[#1e1e2e] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#8e00f7] transition-colors"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm text-gray-400 mb-2">
                        Fecha de Nacimiento <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                          <select
                            value={birthDay}
                            onChange={(e) => setBirthDay(e.target.value)}
                            className="w-full h-12 pl-9 pr-2 bg-[#0a0a12] border border-[#1e1e2e] rounded-xl text-white focus:outline-none focus:border-[#8e00f7] transition-colors appearance-none cursor-pointer"
                          >
                            <option value="">Día</option>
                            {Array.from(
                              { length: birthMonth && birthYear ? daysInMonth(Number(birthMonth), Number(birthYear)) : 31 },
                              (_, i) => i + 1
                            ).map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                        <select
                          value={birthMonth}
                          onChange={(e) => setBirthMonth(e.target.value)}
                          className="w-full h-12 px-2 bg-[#0a0a12] border border-[#1e1e2e] rounded-xl text-white focus:outline-none focus:border-[#8e00f7] transition-colors appearance-none cursor-pointer"
                        >
                          <option value="">Mes</option>
                          {BIRTH_MONTHS.map((m, i) => (
                            <option key={m} value={i + 1}>{m}</option>
                          ))}
                        </select>
                        <select
                          value={birthYear}
                          onChange={(e) => setBirthYear(e.target.value)}
                          className="w-full h-12 px-2 bg-[#0a0a12] border border-[#1e1e2e] rounded-xl text-white focus:outline-none focus:border-[#8e00f7] transition-colors appearance-none cursor-pointer"
                        >
                          <option value="">Año</option>
                          {BIRTH_YEARS.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                      <p className="text-xs text-gray-600 mt-1.5">Debes tener al menos {MIN_AGE} años (edad de tu personaje)</p>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Lugar de Nacimiento <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <select
                          value={formData.birthPlace}
                          onChange={(e) => handleFormChange("birthPlace", e.target.value)}
                          className="w-full h-12 pl-12 pr-4 bg-[#0a0a12] border border-[#1e1e2e] rounded-xl text-white focus:outline-none focus:border-[#8e00f7] transition-colors appearance-none cursor-pointer"
                        >
                          <option value="">Seleccionar...</option>
                          {BIRTHPLACE_OPTIONS.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Sexo <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => handleFormChange("gender", e.target.value)}
                        className="w-full h-12 px-4 bg-[#0a0a12] border border-[#1e1e2e] rounded-xl text-white focus:outline-none focus:border-[#8e00f7] transition-colors appearance-none cursor-pointer"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="male">Masculino</option>
                        <option value="female">Femenino</option>
                        <option value="other">Otro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Altura <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={formData.height}
                        onChange={(e) => handleFormChange("height", e.target.value)}
                        className="w-full h-12 px-4 bg-[#0a0a12] border border-[#1e1e2e] rounded-xl text-white focus:outline-none focus:border-[#8e00f7] transition-colors appearance-none cursor-pointer"
                      >
                        <option value="">Seleccionar...</option>
                        {HEIGHT_OPTIONS.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Nacionalidad <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Flag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <select
                          value={formData.nationality}
                          onChange={(e) => handleFormChange("nationality", e.target.value)}
                          className="w-full h-12 pl-12 pr-4 bg-[#0a0a12] border border-[#1e1e2e] rounded-xl text-white focus:outline-none focus:border-[#8e00f7] transition-colors appearance-none cursor-pointer"
                        >
                          <option value="">Seleccionar...</option>
                          {NATIONALITY_OPTIONS.map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Grupo/Facción <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <select
                          value={formData.group}
                          onChange={(e) => handleFormChange("group", e.target.value)}
                          className="w-full h-12 pl-12 pr-4 bg-[#0a0a12] border border-[#1e1e2e] rounded-xl text-white focus:outline-none focus:border-[#8e00f7] transition-colors appearance-none cursor-pointer"
                        >
                          <option value="">Seleccionar...</option>
                          {GROUP_OPTIONS.map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#0a0a12] rounded-xl border border-[#1e1e2e]">
                    <label className="block text-sm text-gray-400 mb-3">
                      Foto de Perfil <span className="text-gray-500">(opcional)</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-24 rounded-lg bg-[#1a1a28] border-2 border-dashed border-[#2a2a3a] overflow-hidden flex items-center justify-center">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center text-gray-500">
                            <svg className="w-8 h-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          id="photo-upload"
                        />
                        <label
                          htmlFor="photo-upload"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1a28] hover:bg-[#2a2a3a] text-white rounded-lg cursor-pointer transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          {photoUrl ? "Cambiar foto" : "Subir foto"}
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                          JPG, PNG o GIF. Máx 5MB.
                        </p>
                        {photoUrl && (
                          <button
                            type="button"
                            onClick={() => setPhotoUrl(null)}
                            className="text-xs text-red-400 hover:text-red-300 mt-1"
                          >
                            Eliminar foto
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#0a0a12] rounded-xl border border-[#1e1e2e]">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-400">Usuario de Roblox</div>
                        <div className="text-white font-medium">{formData.robloxUsername}</div>
                      </div>
                      <Lock className="w-5 h-5 text-gray-500" />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleGenerateDocument}
                    disabled={isLoading || !isFormValid()}
                    className="w-full h-14 bg-[#8e00f7] hover:bg-[#7a00d4] disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Generando documento...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Generar Documento
                      </>
                    )}
                  </button>
                </div>
              )}

              {step === "preview" && documentData && (
                <div className="space-y-6">
                  <div className="text-center py-4">
                    <h2 className="text-xl font-bold text-white mb-2">Tu Documento</h2>
                    <p className="text-gray-400">
                      Documento generado y guardado en tu solicitud
                    </p>
                  </div>

                  <div className="bg-[#0a0a12] p-6 rounded-2xl">
                    <DocumentViewer3D
                      documentType={selectedDocument}
                      city={selectedCity || "los_santos"}
                      firstName={formData.firstName}
                      lastName={formData.lastName}
                      birthDate={formData.birthDate}
                      birthPlace={formData.birthPlace}
                      gender={formData.gender}
                      height={formData.height}
                      nationality={formData.nationality}
                      group={formData.group}
                      robloxUsername={formData.robloxUsername}
                      documentNumber={documentData.number}
                      issueDate={documentData.issueDate}
                      expiryDate={documentData.expiryDate}
                      photoUrl={photoUrl || application?.roblox?.avatar || undefined}
                    />
                  </div>
                  <p className="text-center text-xs text-gray-500 -mt-3">
                    Arrastra para rotar el documento y verlo desde otro ángulo
                  </p>

                  <div className="bg-[#0a0a12] rounded-xl p-4 border border-[#1e1e2e]">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-[#8e00f7] flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-gray-400">
                        <strong className="text-white">Importante:</strong> Este documento será tu identificación
                        oficial dentro del servidor. Asegúrate de que los datos sean correctos antes de confirmar.
                        Una vez generado, no podrás modificarlo.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmDocument}
                    className="w-full h-12 bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="h-5 w-5" />
                    Continuar
                  </button>
                </div>
              )}

              {step === "complete" && documentData && (
                <div className="text-center py-8 space-y-6">
                  <div className="w-20 h-20 rounded-full bg-[#22c55e]/20 flex items-center justify-center mx-auto animate-prize-reveal">
                    <Check className="h-10 w-10 text-[#22c55e]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Documento Generado</h2>
                    <p className="text-gray-400">
                      Tu documento de identidad ha sido creado exitosamente
                    </p>
                  </div>

                  <div className="w-full bg-[#0a0a12] p-6 rounded-2xl text-left">
                    <DocumentViewer3D
                      documentType={selectedDocument}
                      city={selectedCity || "los_santos"}
                      firstName={formData.firstName}
                      lastName={formData.lastName}
                      birthDate={formData.birthDate}
                      birthPlace={formData.birthPlace}
                      gender={formData.gender}
                      height={formData.height}
                      nationality={formData.nationality}
                      group={formData.group}
                      robloxUsername={formData.robloxUsername}
                      documentNumber={documentData.number}
                      issueDate={documentData.issueDate}
                      expiryDate={documentData.expiryDate}
                      photoUrl={photoUrl || application?.roblox?.avatar || undefined}
                    />
                  </div>

                  <div className="inline-flex items-center gap-3 px-6 py-4 bg-[#0a0a12] border border-[#1e1e2e] rounded-xl">
                    <CreditCard className="w-6 h-6 text-[#8e00f7]" />
                    <div className="text-left">
                      <div className="text-sm text-gray-400">Número de documento</div>
                      <div className="text-xl font-mono font-bold text-white">{documentData.number}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      className="flex items-center gap-2 px-6 py-3 bg-[#1a1a28] hover:bg-[#2a2a3a] text-white rounded-xl transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                      Ver Documento
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-2 px-6 py-3 bg-[#8e00f7] hover:bg-[#7a00d4] text-white rounded-xl transition-colors"
                    >
                      <Download className="w-5 h-5" />
                      Descargar
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleFinish}
                    className="inline-flex items-center justify-center gap-2 h-14 px-8 bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold rounded-xl transition-all"
                  >
                    Finalizar Whitelist
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Los datos de tu personaje son ficticios y para uso exclusivo del servidor.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}