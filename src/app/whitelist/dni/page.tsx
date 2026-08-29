"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight, ArrowLeft, Loader2, CreditCard,
  User, Calendar,
  Check, Download, Eye, Lock, X,
  Sparkles, AlertCircle, ChevronDown
} from "lucide-react";
import ParticlesBackground from "@/components/ParticlesBackground";
import WhitelistStepper from "@/components/WhitelistStepper";
import DocumentViewer3D from "@/components/documents/DocumentViewer3D";
import { useWhitelistApplication } from "@/hooks/useWhitelistApplication";
import WhitelistBetaPanel from "@/components/WhitelistBetaPanel";
import WhitelistHeader from "@/components/whitelist/WhitelistHeader";
import WhitelistLoadingState from "@/components/whitelist/WhitelistLoadingState";
import WhitelistCard from "@/components/whitelist/WhitelistCard";
import { useCardTilt } from "@/hooks/useCardTilt";
import {
  CITIES, HEIGHT_OPTIONS,
  type City, type CityInfo, type DocumentType
} from "@/lib/whitelistTypes";

/** Tarjeta de ciudad con inclinación 3D que sigue el mouse — se aleja/desatura cuando otra ciudad está siendo elegida. */
function CityCard({ city, traveling, receded, onClick }: { city: CityInfo; traveling: boolean; receded: boolean; onClick: () => void }) {
  const tilt = useCardTilt<HTMLButtonElement>();

  return (
    <button
      ref={tilt.ref}
      type="button"
      onClick={onClick}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      disabled={!city.available}
      style={{
        transform: traveling
          ? undefined
          : "perspective(1200px) rotateX(var(--tilt-x,0deg)) rotateY(var(--tilt-y,0deg))",
        boxShadow: traveling ? `0 24px 60px -12px ${city.glow}80, 0 0 44px -6px #8e00f766` : undefined,
      }}
      className={`group relative overflow-hidden rounded-2xl text-left transition-all duration-700 [transform-style:preserve-3d] ${
        city.available ? "ring-2 ring-transparent hover:ring-white/25 cursor-pointer" : "opacity-75 cursor-not-allowed"
      } ${traveling ? "city-card-traveling z-10" : ""} ${receded ? "city-card-recede" : ""}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${city.accent}`} />
      <div className="absolute inset-0 bg-black/45 group-hover:bg-black/30 transition-colors" />
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: "radial-gradient(320px circle at var(--glow-x,50%) var(--glow-y,50%), rgba(255,255,255,0.15), transparent 60%)" }}
      />

      {!city.available && (
        <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 text-white text-xs font-medium rounded z-10">
          Próximamente
        </div>
      )}

      <div className="relative p-5 flex flex-col h-full" style={{ transform: "translateZ(24px)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-black/30 backdrop-blur-sm p-1.5 flex-shrink-0">
            <Image src={city.logo} alt={`Logo de ${city.name}`} width={56} height={56} className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-white drop-shadow">{city.name}</div>
            <div className="text-sm text-white/80">{city.state} · {city.country}</div>
          </div>
        </div>

        <p className="text-sm text-white/85 leading-relaxed flex-1">{city.description}</p>

        {city.available ? (
          <div className="mt-3 flex items-center gap-1 text-white text-sm font-medium">
            <Check className="w-4 h-4" />
            Disponible
          </div>
        ) : (
          <div className="mt-3 text-white/60 text-xs">Todavía no se puede elegir</div>
        )}
      </div>
    </button>
  );
}

/** Panel cinemático que aparece al elegir una ciudad: ambientación propia + ventajas, antes de pasar al formulario. */
function CityConfirmPanel({ city, onConfirm, onBack }: { city: CityInfo; onConfirm: () => void; onBack: () => void }) {
  const ambientRef = useRef<HTMLDivElement>(null);

  const handleAmbientMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ambientRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--parallax-x", `${px * -14}px`);
    el.style.setProperty("--parallax-y", `${py * -14}px`);
  };

  const handleAmbientLeave = () => {
    ambientRef.current?.style.setProperty("--parallax-x", "0px");
    ambientRef.current?.style.setProperty("--parallax-y", "0px");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5" style={{ perspective: "1200px" }}>
      {/* Ambiente — logo y look de la ciudad elegida, con el glow púrpura de ERLCHUB de fondo constante */}
      <div
        ref={ambientRef}
        onMouseMove={handleAmbientMove}
        onMouseLeave={handleAmbientLeave}
        className="relative lg:w-[62%] rounded-2xl overflow-hidden animate-city-ambient-in min-h-[280px]"
        style={{
          background: `radial-gradient(ellipse 500px 350px at 30% 20%, ${city.glow}33, transparent 60%), radial-gradient(ellipse 500px 400px at 80% 100%, #8e00f74d, transparent 65%), linear-gradient(160deg, #0b0b14, #15121f)`,
        }}
      >
        <div
          className={`absolute inset-0 city-ambient-${city.ambient}`}
          style={{
            transform: "translate(var(--parallax-x, 0px), var(--parallax-y, 0px))",
            background:
              city.ambient !== "rain"
                ? `radial-gradient(220px circle at 25% 30%, ${city.glow}55, transparent 70%), radial-gradient(260px circle at 75% 70%, #8e00f755, transparent 70%)`
                : undefined,
          }}
        />
        <div
          className="relative h-full flex flex-col items-center justify-center text-center p-8 sm:p-10"
          style={{ transform: "translate(calc(var(--parallax-x, 0px) * 0.4), calc(var(--parallax-y, 0px) * 0.4))" }}
        >
          <div className="w-24 h-24 sm:w-28 sm:h-28 mb-5 drop-shadow-2xl">
            <Image src={city.logo} alt={`Logo de ${city.name}`} width={112} height={112} className="w-full h-full object-contain" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg">{city.name}</div>
          <div className="text-white/70 text-sm mt-1">{city.state}, {city.country}</div>
        </div>
      </div>

      {/* Panel de información — entra desde la derecha una vez que el ambiente ya empezó a cambiar */}
      <div className="lg:w-[38%] animate-city-panel-in" style={{ animationDelay: "150ms", animationFillMode: "backwards" }}>
        <div className="h-full rounded-2xl border border-[var(--card-border)] bg-[var(--background)] p-5 sm:p-6 flex flex-col">
          <p className="text-white/80 text-sm italic leading-relaxed mb-4">"{city.tagline}"</p>

          <div className="text-xs font-semibold text-[var(--text-faint)] uppercase tracking-wide mb-2">
            Ventajas de esta ciudad
          </div>
          <div className="space-y-2 mb-5">
            {city.advantages.map((adv, i) => (
              <div
                key={adv}
                className="flex items-center gap-2 text-sm text-[var(--foreground)] animate-city-advantage-in"
                style={{ animationDelay: `${300 + i * 70}ms`, animationFillMode: "backwards" }}
              >
                <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: city.glow }} />
                {adv}
              </div>
            ))}
          </div>

          <div className="mt-auto space-y-2">
            <button
              type="button"
              onClick={onConfirm}
              className="w-full h-12 bg-[#8e00f7] hover:bg-[#7a00d4] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
              style={{ boxShadow: `0 8px 28px -8px ${city.glow}88` }}
            >
              Continuar con {city.name}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full h-10 text-[var(--text-muted)] hover:text-[var(--foreground)] text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Cambiar ciudad
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const CURRENT_YEAR = new Date().getFullYear();
const MIN_AGE = 18;
const BIRTH_MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
const BIRTH_YEARS = Array.from({ length: 82 }, (_, i) => CURRENT_YEAR - MIN_AGE - i); // 18 a 99 años
const daysInMonth = (month: number, year: number) => new Date(year, month, 0).getDate();

/** Misma cuenta que hace el servidor al confirmar (edad exacta, no solo el año elegido). */
function calculateAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const parsed = new Date(birthDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return (Date.now() - parsed.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
}

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
  const { application, loading, error: loadError, reload, run } = useWhitelistApplication(["dni", "completed"]);

  const [step, setStep] = useState<"city" | "cityConfirm" | "form" | "document" | "preview" | "complete">("city");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [travelingCity, setTravelingCity] = useState<City | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentType>("license");
  const [showDocumentSelect, setShowDocumentSelect] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrated = useRef(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    gender: "" as "male" | "female" | "other" | "",
    height: "",
    // La licencia es de un servidor estadounidense — no tiene sentido preguntarle
    // al jugador su nacionalidad para este documento, así que va fija.
    nationality: "Estadounidense",
    robloxUsername: ""
  });

  // Fecha de nacimiento como 3 selects (día/mes/año) en vez de un <input type="date">:
  // así el formato de captura es siempre el mismo, sin depender del navegador/idioma.
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");

  // El documento usa el personaje de Roblox del jugador (ya conectado en una fase anterior)
  // como foto — no tiene sentido pedirle que suba otra imagen aparte.
  const photoUrl = application?.roblox?.avatar || null;
  const documentData = application?.document ?? null;

  useEffect(() => {
    const day = Number(birthDay), month = Number(birthMonth), year = Number(birthYear);
    if (day && month && year) {
      const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      setFormData(prev => {
        if (prev.birthDate === iso) return prev;
        const next = { ...prev, birthDate: iso };
        scheduleSave(next, selectedCity, photoUrl);
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birthDay, birthMonth, birthYear]);

  const hydrateBirthDate = (iso?: string) => {
    if (!iso) return;
    const [y, m, d] = iso.split("-");
    if (y && m && d) { setBirthYear(y); setBirthMonth(String(Number(m))); setBirthDay(String(Number(d))); }
  };

  // El usuario de Roblox sale de la fase anterior. Si ya hay un documento
  // generado (final, ya no editable) se recupera ese; si no, se recupera el
  // borrador autoguardado — antes un refresh a mitad de llenar el formulario
  // borraba todo lo escrito, incluida la foto.
  useEffect(() => {
    if (!application || hydrated.current) return;
    hydrated.current = true;

    const draft = application.character || application.characterDraft;

    setFormData(prev => ({
      ...prev,
      robloxUsername: application.roblox?.username || "",
      ...(draft
        ? {
            firstName: draft.firstName || prev.firstName,
            lastName: draft.lastName || prev.lastName,
            birthDate: draft.birthDate || prev.birthDate,
            gender: (draft.gender || prev.gender) as typeof prev.gender,
            height: draft.height || prev.height,
          }
        : {})
    }));

    hydrateBirthDate(draft?.birthDate);
    if (draft?.city && CITIES.find(c => c.id === draft.city)) {
      setSelectedCity(draft.city as City);
      if (!application.document) setStep("form");
    }
    if (application.document) {
      setSelectedDocument(application.document.type as DocumentType);
      setStep("complete");
    }
  }, [application]);

  // Autoguardado del borrador (igual patrón que el cuestionario): 1.5s tras
  // dejar de escribir, incluida la foto para no perderla en un refresh.
  const scheduleSave = useCallback((next: typeof formData, city: City | null, photo: string | null) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        await run("character_draft", { answers: { ...next, city: city || "", photoUrl: photo || "" } });
        setSaveState("saved");
      } catch {
        setSaveState("idle");
      }
    }, 1500);
  }, [run]);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  // Click en una tarjeta: no se pasa directo al formulario — primero "viaja" la cámara hacia
  // esa ciudad (~900ms) y recién ahí aparece el panel de confirmación con su ambientación.
  const handleCityClick = (city: City) => {
    if (!CITIES.find(c => c.id === city)?.available || travelingCity) return;
    setTravelingCity(city);
    window.setTimeout(() => {
      setSelectedCity(city);
      setStep("cityConfirm");
      setTravelingCity(null);
    }, 900);
  };

  const handleCityConfirm = () => {
    if (!selectedCity) return;
    setStep("form");
    scheduleSave(formData, selectedCity, photoUrl);
  };

  const handleCityBack = () => {
    setStep("city");
    setSelectedCity(null);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      scheduleSave(next, selectedCity, photoUrl);
      return next;
    });
  };

  const age = calculateAge(formData.birthDate);
  const isUnderage = age !== null && age < MIN_AGE;

  const isFormValid = () => {
    return Boolean(
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.birthDate &&
      !isUnderage &&
      formData.gender &&
      formData.height
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
          gender: formData.gender,
          height: formData.height,
          nationality: formData.nationality,
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

  if (loading || loadError) {
    return <WhitelistLoadingState error={loadError} onRetry={() => reload(true)} />;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] relative overflow-hidden">
      <ParticlesBackground />
      {/* Tinte ambiental de fondo, a juego con la ciudad elegida — el glow púrpura de ERLCHUB (ParticlesBackground) nunca se tapa, solo se le suma. */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-[1400ms]"
        style={{
          opacity: step === "cityConfirm" || travelingCity ? 1 : 0,
          background: selectedCity || travelingCity
            ? `radial-gradient(ellipse 900px 600px at 15% 20%, ${(CITIES.find(c => c.id === (selectedCity || travelingCity))?.glow) || "#8e00f7"}22, transparent 65%)`
            : undefined,
        }}
      />
      <WhitelistBetaPanel currentPhase="dni" />
      <WhitelistHeader applicationId={application?.applicationId} />

      <main className="relative z-10 px-4 sm:px-6 lg:px-8 pb-16">
        <div className={`mx-auto transition-[max-width] duration-500 ${step === "form" ? "max-w-6xl" : step === "cityConfirm" ? "max-w-5xl" : "max-w-4xl"}`}>
          <div className="mb-8">
            <WhitelistStepper currentPhase="dni" />
          </div>

          {saveState !== "idle" && step === "form" && (
            <p className="text-xs text-[var(--text-faint)] text-right mb-2">
              {saveState === "saving" ? "Guardando borrador..." : "Borrador guardado."}
            </p>
          )}

          <WhitelistCard>
            <div className="p-6 border-b border-[var(--card-border)]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#8e00f7]/20 flex items-center justify-center">
                  <CreditCard className="h-7 w-7 text-[#8e00f7]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[var(--foreground)]">Documento de Identidad</h1>
                  <p className="text-[var(--text-muted)]">Crea tu DNI oficial del servidor</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {step === "city" && (
                <div className={`space-y-6 transition-all duration-700 ${travelingCity ? "city-grid-traveling" : ""}`}>
                  <div className="text-center py-4">
                    <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Selecciona tu Ciudad</h2>
                    <p className="text-[var(--text-muted)]">
                      Elige la ciudad donde residirá tu personaje
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4" style={{ perspective: "1200px" }}>
                    {CITIES.map((city) => (
                      <CityCard
                        key={city.id}
                        city={city}
                        traveling={travelingCity === city.id}
                        receded={travelingCity !== null && travelingCity !== city.id}
                        onClick={() => handleCityClick(city.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {step === "cityConfirm" && selectedCity && (
                <CityConfirmPanel
                  city={CITIES.find(c => c.id === selectedCity)!}
                  onConfirm={handleCityConfirm}
                  onBack={handleCityBack}
                />
              )}

              {step === "form" && (
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="flex-1 min-w-0 space-y-6">
                  <div className="flex items-center justify-between p-4 bg-[var(--background)] rounded-xl">
                    <div className="flex items-center gap-3">
                      {CITIES.find(c => c.id === selectedCity)?.logo && (
                        <div className="w-9 h-9 rounded-lg bg-black/20 p-1 flex-shrink-0">
                          <Image
                            src={CITIES.find(c => c.id === selectedCity)!.logo}
                            alt=""
                            width={36}
                            height={36}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-[var(--foreground)]">
                          {CITIES.find(c => c.id === selectedCity)?.name}
                        </div>
                        <div className="text-sm text-[var(--text-faint)]">
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
                    <label className="block text-sm text-[var(--text-muted)] mb-2">Tipo de Documento</label>
                    <button
                      type="button"
                      onClick={() => setShowDocumentSelect(!showDocumentSelect)}
                      className="w-full flex items-center justify-between p-4 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-left"
                    >
                      <div>
                        <div className="font-medium text-[var(--foreground)]">
                          {documentTypes.find(d => d.id === selectedDocument)?.name}
                        </div>
                        <div className="text-sm text-[var(--text-faint)]">
                          {documentTypes.find(d => d.id === selectedDocument)?.description}
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-[var(--text-muted)] transition-transform ${showDocumentSelect ? 'rotate-180' : ''}`} />
                    </button>

                    {showDocumentSelect && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl overflow-hidden z-10">
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
                                ? "hover:bg-[var(--card-bg-2)]"
                                : "opacity-50 cursor-not-allowed"
                            } ${selectedDocument === doc.id ? "bg-[#8e00f7]/20" : ""}`}
                          >
                            <div className="font-medium text-[var(--foreground)]">{doc.name}</div>
                            <div className="text-sm text-[var(--text-faint)]">{doc.description}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[var(--text-muted)] mb-2">
                        Nombres <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-faint)]" />
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleFormChange("firstName", e.target.value)}
                          placeholder="Juan Carlos"
                          className="w-full h-12 pl-12 pr-4 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-[var(--foreground)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[#8e00f7] transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-[var(--text-muted)] mb-2">
                        Apellidos <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-faint)]" />
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleFormChange("lastName", e.target.value)}
                          placeholder="Pérez García"
                          className="w-full h-12 pl-12 pr-4 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-[var(--foreground)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[#8e00f7] transition-colors"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm text-[var(--text-muted)] mb-2">
                        Fecha de Nacimiento <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-faint)] pointer-events-none" />
                          <select
                            value={birthDay}
                            onChange={(e) => setBirthDay(e.target.value)}
                            className="w-full h-12 pl-9 pr-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[#8e00f7] transition-colors appearance-none cursor-pointer"
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
                          className="w-full h-12 px-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[#8e00f7] transition-colors appearance-none cursor-pointer"
                        >
                          <option value="">Mes</option>
                          {BIRTH_MONTHS.map((m, i) => (
                            <option key={m} value={i + 1}>{m}</option>
                          ))}
                        </select>
                        <select
                          value={birthYear}
                          onChange={(e) => setBirthYear(e.target.value)}
                          className="w-full h-12 px-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[#8e00f7] transition-colors appearance-none cursor-pointer"
                        >
                          <option value="">Año</option>
                          {BIRTH_YEARS.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                      {isUnderage ? (
                        <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1.5">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          Tu personaje tendría {Math.floor(age!)} años — debe tener al menos {MIN_AGE}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-600 mt-1.5">Debes tener al menos {MIN_AGE} años (edad de tu personaje)</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-[var(--text-muted)] mb-2">
                        Sexo <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => handleFormChange("gender", e.target.value)}
                        className="w-full h-12 px-4 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[#8e00f7] transition-colors appearance-none cursor-pointer"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="male">Masculino</option>
                        <option value="female">Femenino</option>
                        <option value="other">Otro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-[var(--text-muted)] mb-2">
                        Altura <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={formData.height}
                        onChange={(e) => handleFormChange("height", e.target.value)}
                        className="w-full h-12 px-4 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[#8e00f7] transition-colors appearance-none cursor-pointer"
                      >
                        <option value="">Seleccionar...</option>
                        {HEIGHT_OPTIONS.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                  </div>

                  <div className="p-4 bg-[var(--background)] rounded-xl border border-[var(--card-border)] flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[var(--card-bg-2)] border border-[var(--card-border)] overflow-hidden flex-shrink-0">
                      {photoUrl ? (
                        <img src={photoUrl} alt={formData.robloxUsername} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-6 h-6 text-[var(--text-faint)]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[var(--text-muted)]">Foto y usuario de Roblox</div>
                      <div className="text-[var(--foreground)] font-medium truncate">{formData.robloxUsername}</div>
                      <p className="text-xs text-[var(--text-faint)] mt-0.5">Se toman automáticamente de tu cuenta conectada.</p>
                    </div>
                    <Lock className="w-5 h-5 text-[var(--text-faint)] flex-shrink-0" />
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
                    className="w-full h-14 bg-[#8e00f7] hover:bg-[#7a00d4] disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 hover:-translate-y-0.5"
                    style={{ boxShadow: isFormValid() ? "0 10px 30px -10px rgba(142,0,247,0.55)" : undefined }}
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

                {/* Vista previa en vivo — se actualiza en tiempo real a medida que se llena el formulario. La tarjeta flota directo sobre el fondo, sin caja alrededor. */}
                <div className="lg:w-[520px] lg:sticky lg:top-24 w-full animate-city-panel-in" style={{ animationDelay: "100ms", animationFillMode: "backwards" }}>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                    </span>
                    <span className="text-xs font-semibold text-[var(--text-faint)] uppercase tracking-wide">Vista previa en tiempo real</span>
                  </div>
                  <DocumentViewer3D
                    documentType={selectedDocument}
                    city={selectedCity || "los_santos"}
                    firstName={formData.firstName}
                    lastName={formData.lastName}
                    birthDate={formData.birthDate}
                    gender={formData.gender}
                    height={formData.height}
                    nationality={formData.nationality}
                    robloxUsername={formData.robloxUsername}
                    documentNumber=""
                    issueDate=""
                    expiryDate=""
                    photoUrl={photoUrl || undefined}
                  />
                  <p className="text-xs text-[var(--text-faint)] text-center mt-3">
                    El número de documento se genera al confirmar
                  </p>
                </div>
                </div>
              )}

              {step === "preview" && documentData && (
                <div className="space-y-6">
                  <div className="text-center py-4">
                    <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Tu Documento</h2>
                    <p className="text-[var(--text-muted)]">
                      Documento generado y guardado en tu solicitud
                    </p>
                  </div>

                  <div className="max-w-md mx-auto">
                    <DocumentViewer3D
                      documentType={selectedDocument}
                      city={selectedCity || "los_santos"}
                      firstName={formData.firstName}
                      lastName={formData.lastName}
                      birthDate={formData.birthDate}
                      gender={formData.gender}
                      height={formData.height}
                      nationality={formData.nationality}
                      robloxUsername={formData.robloxUsername}
                      documentNumber={documentData.number}
                      issueDate={documentData.issueDate}
                      expiryDate={documentData.expiryDate}
                      photoUrl={photoUrl || undefined}
                    />
                  </div>
                  <p className="text-center text-xs text-[var(--text-faint)] -mt-3">
                    Arrastra para rotar el documento y verlo desde otro ángulo
                  </p>

                  <div className="bg-[var(--background)] rounded-xl p-4 border border-[var(--card-border)]">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-[#8e00f7] flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-[var(--text-muted)]">
                        <strong className="text-[var(--foreground)]">Importante:</strong> Este documento será tu identificación
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
                    <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Documento Generado</h2>
                    <p className="text-[var(--text-muted)]">
                      Tu documento de identidad ha sido creado exitosamente
                    </p>
                  </div>

                  <div id="dni-print-area" className="w-full max-w-md mx-auto text-left">
                    <DocumentViewer3D
                      documentType={selectedDocument}
                      city={selectedCity || "los_santos"}
                      firstName={formData.firstName}
                      lastName={formData.lastName}
                      birthDate={formData.birthDate}
                      gender={formData.gender}
                      height={formData.height}
                      nationality={formData.nationality}
                      robloxUsername={formData.robloxUsername}
                      documentNumber={documentData.number}
                      issueDate={documentData.issueDate}
                      expiryDate={documentData.expiryDate}
                      photoUrl={photoUrl || undefined}
                    />
                  </div>

                  <div className="inline-flex items-center gap-3 px-6 py-4 bg-[var(--background)] border border-[var(--card-border)] rounded-xl">
                    <CreditCard className="w-6 h-6 text-[#8e00f7]" />
                    <div className="text-left">
                      <div className="text-sm text-[var(--text-muted)]">Número de documento</div>
                      <div className="text-xl font-mono font-bold text-[var(--foreground)]">{documentData.number}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => setShowDocumentModal(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-[var(--card-bg-2)] hover:bg-[#2a2a3a] text-[var(--foreground)] rounded-xl transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                      Ver Documento
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
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
          </WhitelistCard>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--text-faint)]">
              Los datos de tu personaje son ficticios y para uso exclusivo del servidor.
            </p>
          </div>
        </div>
      </main>

      {/* Al imprimir (o "Guardar como PDF"), solo se muestra el documento. */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #dni-print-area, #dni-print-area * { visibility: visible; }
          #dni-print-area { position: fixed; inset: 0; padding: 24px; background: white; }
        }
      `}</style>

      {showDocumentModal && documentData && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 print:hidden"
          onClick={() => setShowDocumentModal(false)}
        >
          <div className="relative w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowDocumentModal(false)}
              className="absolute -top-12 right-0 w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--card-border-soft)] hover:bg-[var(--card-bg-2)] transition-colors"
              style={{ background: "color-mix(in srgb, var(--card-bg) 80%, transparent)" }}
              aria-label="Cerrar"
            >
              <X className="h-5 w-5 text-[var(--text-muted)]" />
            </button>
            <div>
              <DocumentViewer3D
                documentType={selectedDocument}
                city={selectedCity || "los_santos"}
                firstName={formData.firstName}
                lastName={formData.lastName}
                birthDate={formData.birthDate}
                gender={formData.gender}
                height={formData.height}
                nationality={formData.nationality}
                robloxUsername={formData.robloxUsername}
                documentNumber={documentData.number}
                issueDate={documentData.issueDate}
                expiryDate={documentData.expiryDate}
                photoUrl={photoUrl || undefined}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}