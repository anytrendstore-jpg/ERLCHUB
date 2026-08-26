"use client";

import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import ParticlesBackground from "@/components/ParticlesBackground";

// Client id de producción ya registrado en el portal de Discord.
const DISCORD_LOGIN_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || "1433560156909863084";

export default function RegisterPage() {
  const handleDiscordLogin = () => {
    // El redirect_uri se calcula sobre el origen actual (no va grabado a
    // fuego a www.erlchub.pro) para que el login funcione también en local.
    const redirectUri =
      process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI ||
      `${window.location.origin}/api/auth/callback/discord`;
    window.location.href =
      `https://discord.com/oauth2/authorize?client_id=${DISCORD_LOGIN_CLIENT_ID}` +
      `&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=identify+guilds.members.read+guilds+email`;
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-12 relative overflow-hidden animate-modal-backdrop">
      
      <ParticlesBackground />

      <div className="relative z-10 w-full max-w-[400px] animate-modal-card">
        <div className="backdrop-blur-sm border border-[var(--card-border)] rounded-2xl shadow-2xl overflow-hidden" style={{ background: "color-mix(in srgb, var(--card-bg) 90%, transparent)" }}>
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="ERLC HUB"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <span className="font-bold text-[var(--foreground)] text-lg">ERLCᴴᵁᴮ</span>
            </div>
            <Link
              href="/"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="h-5 w-5 text-[var(--text-muted)]" />
            </Link>
          </div>

          <div className="px-6 pb-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Únete a ERLC HUB</h2>
              <p className="text-[var(--text-muted)] text-sm">Crea tu cuenta y accede a todos los beneficios</p>
            </div>
            
            <button
              onClick={handleDiscordLogin}
              className="w-full h-12 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#5865F2]/25 hover:shadow-[#5865F2]/40 transform hover:scale-[1.02] relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#5865F2]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0463-.319 13.5809.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.872-.902a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.074.074 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.9019.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5489-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
              </svg>
              
              <span>Inicia Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}