"use client";

import { useState, useEffect } from "react";
import { useMDT } from "@/contexts/MDTContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import {
  Lock,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from "lucide-react";

// Import all MDT screens (we'll create these next)
import MDTDashboard from "./mdt/MDTDashboard";
import MDTCAD from "./mdt/MDTCAD";
import MDTPersons from "./mdt/MDTPersons";
import MDTVehicles from "./mdt/MDTVehicles";
import MDTWarrants from "./mdt/MDTWarrants";
import MDTBOLOs from "./mdt/MDTBOLOs";
import MDTReports from "./mdt/MDTReports";
import MDTArrests from "./mdt/MDTArrests";
import MDTCitations from "./mdt/MDTCitations";
import MDTEvidence from "./mdt/MDTEvidence";
import MDTMessages from "./mdt/MDTMessages";
import MDTMap from "./mdt/MDTMap";
import MDTStats from "./mdt/MDTStats";
import MDTAudit from "./mdt/MDTAudit";
import MDTRadio from "./mdt/MDTRadio";
import MDTCases from "./mdt/MDTCases";

// ============================================
// SPLASH SCREEN
// ============================================

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const department = useDepartment();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Iniciando sistema...");

  useEffect(() => {
    const statuses = [
      "Iniciando sistema...",
      "Conectando a la red...",
      "Cargando bases de datos...",
      "Verificando credenciales...",
      "Sistema listo",
    ];

    let currentStatus = 0;
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 20;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }

        currentStatus = Math.floor(next / 20);
        setStatus(statuses[currentStatus] || statuses[statuses.length - 1]);

        return next;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [onComplete]);

  const currentTime = new Date().toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const currentDate = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="h-full bg-[#05070d] flex items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(159, 192, 255, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(159, 192, 255, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-8 px-8">
        {/* Badge */}
        <div className="flex justify-center">
          <img src={department.badge} alt={department.factionAbbreviation} className="h-20 w-auto" />
        </div>

        {/* System Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-white tracking-tight uppercase">
            {department.name}
          </h1>
          <p className="text-[#6f93d6] text-sm">
            {department.subtitle} · Terminal de Datos Móvil v2.5
          </p>
        </div>

        {/* Date & Time */}
        <div className="text-slate-500 space-y-0.5">
          <div className="text-xs capitalize">{currentDate}</div>
          <div className="text-lg font-semibold text-[#6f93d6]">{currentTime}</div>
        </div>

        {/* Network Status */}
        <div className="flex items-center justify-center gap-2 text-green-400">
          <Wifi className="w-5 h-5" />
          <span className="text-sm font-medium">Red conectada</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md mx-auto space-y-3">
          <div className="h-2 bg-[#121a2e] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#3c68c9] to-[#6f93d6] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-center gap-2 text-[#6f93d6] text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{status}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-600 space-y-1">
          <div>{department.name}</div>
          <div>Solo personal autorizado</div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// LOGIN SCREEN
// ============================================

function LoginScreen() {
  const { login, setScreen } = useMDT();
  const department = useDepartment();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const success = await login(username, password);
      if (!success) {
        setError("Credenciales inválidas. Acceso denegado.");
      }
    } catch (err) {
      setError("Error del sistema. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const currentTime = new Date().toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="h-full bg-[#05070d] flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(159, 192, 255, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(159, 192, 255, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: "30px 30px",
          }}
        />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md px-8">
        <div className="bg-[#0d1424]/90 backdrop-blur-xl border border-[#151d31] rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src={department.badge} alt={department.factionAbbreviation} className="h-16 w-auto" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1 tracking-tight uppercase">{department.name}</h2>
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">{department.subtitle}</p>
            <p className="text-slate-400 text-sm">Ingresá tus credenciales para acceder al sistema</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#3c68c9] focus:ring-2 focus:ring-[#3c68c9]/20 transition-all"
                placeholder="oficial"
                required
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#121a2e] border border-[#1e2a45] rounded-lg px-4 py-3 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-[#3c68c9] focus:ring-2 focus:ring-[#3c68c9]/20 transition-all"
                  placeholder="contraseña"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#3c68c9] hover:bg-[#4d78d6] disabled:bg-[#111a2c] disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Iniciar sesión</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setError("");
                  setLoading(true);
                  try {
                    await login("officer", "password");
                  } catch (err) {
                    setError("Falló el acceso de demostración");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="px-8 bg-[#121a2e] hover:bg-[#16223a] border border-[#1e2a45] disabled:bg-[#111a2c] disabled:cursor-not-allowed text-[#6f93d6] font-bold py-3 rounded-lg transition-colors whitespace-nowrap"
              >
                Demo
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#151d31] text-center space-y-2">
            <div className="text-xs text-slate-600">
              {department.name}
            </div>
            <div className="text-xs text-slate-500 font-mono">{currentTime}</div>
            <div className="flex items-center justify-center gap-2 text-xs text-green-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Sistema en línea</span>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Haz clic en <span className="text-[#6f93d6] font-semibold">Demo</span> para acceso rápido
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN MDT APP
// ============================================

export default function MDTApp() {
  const { state } = useMDT();
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!state.isAuthenticated) {
    return <LoginScreen />;
  }

  // Router based on active screen
  const renderScreen = () => {
    switch (state.activeScreen) {
      case "dashboard":
        return <MDTDashboard />;
      case "cad":
        return <MDTCAD />;
      case "radio":
        return <MDTRadio />;
      case "persons":
        return <MDTPersons />;
      case "vehicles":
        return <MDTVehicles />;
      case "warrants":
        return <MDTWarrants />;
      case "bolos":
        return <MDTBOLOs />;
      case "reports":
        return <MDTReports />;
      case "arrests":
        return <MDTArrests />;
      case "citations":
        return <MDTCitations />;
      case "evidence":
        return <MDTEvidence />;
      case "cases":
        return <MDTCases />;
      case "messages":
        return <MDTMessages />;
      case "map":
        return <MDTMap />;
      case "stats":
        return <MDTStats />;
      case "audit":
        return <MDTAudit />;
      default:
        return <MDTDashboard />;
    }
  };

  return (
    <div className="h-full bg-[#05070d]">
      {renderScreen()}
    </div>
  );
}
