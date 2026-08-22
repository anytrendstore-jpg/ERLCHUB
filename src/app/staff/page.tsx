"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Lock, ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";
import StaffDashboard from "@/components/staff/StaffDashboard";

export default function StaffPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const checkSession = useCallback(async () => {
    try {
      const data = await (await fetch("/api/whitelist/staff/login", { cache: "no-store" })).json();
      setAuthenticated(Boolean(data.authenticated));
    } catch {
      setAuthenticated(false);
    }
  }, []);

  useEffect(() => { checkSession(); }, [checkSession]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setSubmitting(true);
    try {
      const data = await (await fetch("/api/whitelist/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })).json();

      if (data.success) { setPassword(""); await checkSession(); }
      else setLoginError(data.error || "No se pudo iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/whitelist/staff/login", { method: "DELETE" });
    await checkSession();
  };

  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <form
            onSubmit={handleLogin}
            className="bg-[#111827] border border-[#1F2937] rounded-2xl p-8 space-y-6 shadow-2xl shadow-black/40"
          >
            <div className="text-center">
              <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Ops Center</h1>
              <p className="text-sm text-slate-400 mt-1">ERLC HUB · Acceso restringido al staff</p>
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña de staff"
                className="w-full h-12 pl-11 pr-4 bg-[#0B0F17] border border-[#1F2937] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                required
              />
            </div>

            {loginError && (
              <p className="text-sm text-rose-400 text-center flex items-center justify-center gap-2">
                <AlertTriangle className="h-4 w-4" /> {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-600/25"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Entrar al panel"}
            </button>

            <p className="text-xs text-slate-500 text-center">
              Si tu cuenta de Discord está en la lista de staff, entras sin contraseña.
            </p>
          </form>

          <Link href="/" className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-white transition">
            <ArrowLeft className="h-4 w-4" /> Volver al sitio
          </Link>
        </div>
      </div>
    );
  }

  return <StaffDashboard onLogout={handleLogout} />;
}
