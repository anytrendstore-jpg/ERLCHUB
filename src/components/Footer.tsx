"use client";

import Link from "next/link";
import Image from "next/image";

const CatalogIcon = () => (
  <svg className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const RobuxIcon = () => (
  <svg className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12M6 12h12" />
  </svg>
);

const ReviewsIcon = () => (
  <svg className="w-4 h-4 transition-all duration-300 group-hover:scale-125 group-hover:fill-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const ProfileIcon = () => (
  <svg className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const OrdersIcon = () => (
  <svg className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const EmailIcon = () => (
  <svg className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const DiscordIcon = ({ className = "https://discord.gg/xKJqNX7uC3" }: { className?: string }) => (
  <svg className={`w-4 h-4 transition-all duration-300 ${className}`} fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const TermsIcon = () => (
  <svg className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const PrivacyIcon = () => (
  <svg className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:fill-current group-hover:fill-[#8e00f7]/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const TikTokIcon = () => (
  <svg className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-[var(--background)] border-t border-[var(--card-border-soft)]">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <Image
                src="/logo.png"
                alt="ERLC HUB Logo"
                width={32}
                height={32}
                className="h-8 w-auto transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
              />
              <span className="font-bold text-[var(--foreground)] text-lg tracking-wide transition-colors duration-300 group-hover:text-[#8e00f7]">ERLCᴴᵁᴮ</span>
            </Link>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-6 max-w-xs">
              ERLCᴴᵁᴮ es la comunidad de Roleplay más grande y activa de Latinoamérica, ofreciendo una experiencia única y envolvente para jugadores de todos los niveles. Únete a nosotros y descubre un mundo en ERLC.
            </p>

            {/* Social Buttons */}
            <div className="flex flex-wrap gap-2">
              <a
                href="https://discord.com/invite/xKJqNX7uC3"
                className="group flex items-center gap-2 bg-[var(--card-bg)] border border-[var(--card-border-soft)] hover:border-[#5865F2] hover:bg-[#5865F2]/10 px-4 py-2 rounded-lg text-[var(--text-muted)] hover:text-[#5865F2] transition-all duration-300 text-sm"
              >
                <DiscordIcon className="group-hover:scale-125 group-hover:animate-pulse" />
                <span className="transition-transform duration-300 group-hover:translate-x-0.5">Discord</span>
              </a>
              <a
                href="https://www.instagram.com/erlc_hub?igsh=MXZrMXV5dHVkeTRoeQ=="
                className="group flex items-center gap-2 bg-[var(--card-bg)] border border-[var(--card-border-soft)] hover:border-[#E4405F] hover:bg-[#E4405F]/10 px-4 py-2 rounded-lg text-[var(--text-muted)] hover:text-[#E4405F] transition-all duration-300 text-sm"
              >
                <InstagramIcon />
                <span className="transition-transform duration-300 group-hover:translate-x-0.5">Instagram</span>
              </a>
              <a
                href="https://www.tiktok.com/@erlchub?_r=1&_t=ZS-94pxHUo80kE"
                className="group flex items-center gap-2 bg-[var(--card-bg)] border border-[var(--card-border-soft)] hover:border-white hover:bg-white/5 px-4 py-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] transition-all duration-300 text-sm"
              >
                <TikTokIcon />
                <span className="transition-transform duration-300 group-hover:translate-x-0.5">TikTok</span>
              </a>
            </div>
          </div>

          {/* TIENDA */}
          <div>
            <h4 className="font-semibold text-[var(--text-faint)] mb-4 uppercase tracking-wider text-xs">Tienda</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/tienda" className="group flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--foreground)] text-sm transition-all duration-300 hover:translate-x-1">
                  <span className="text-[var(--text-faint)] group-hover:text-[#8e00f7] transition-colors duration-300"><CatalogIcon /></span>
                  Catálogo
                </Link>
              </li>
              <li>
                <Link href="/tienda/hub-coins" className="group flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--foreground)] text-sm transition-all duration-300 hover:translate-x-1">
                  <span className="text-[var(--text-faint)] group-hover:text-[#8e00f7] transition-colors duration-300"><RobuxIcon /></span>
                  Hub Coins
                </Link>
              </li>
              <li>
                <Link href="/resenas" className="group flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--foreground)] text-sm transition-all duration-300 hover:translate-x-1">
                  <span className="text-[var(--text-faint)] group-hover:text-[#fbbf24] transition-colors duration-300"><ReviewsIcon /></span>
                  Reseñas
                </Link>
              </li>
            </ul>
          </div>


          {/* CUENTA */}
          <div>
            <h4 className="font-semibold text-[var(--text-faint)] mb-4 uppercase tracking-wider text-xs">Cuenta</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/perfil" className="group flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--foreground)] text-sm transition-all duration-300 hover:translate-x-1">
                  <span className="text-[var(--text-faint)] group-hover:text-[#8e00f7] transition-colors duration-300"><ProfileIcon /></span>
                  Mi Perfil
                </Link>
              </li>
              <li>
                <Link href="/pedidos" className="group flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--foreground)] text-sm transition-all duration-300 hover:translate-x-1">
                  <span className="text-[var(--text-faint)] group-hover:text-[#22c55e] transition-colors duration-300"><OrdersIcon /></span>
                  Mis Pedidos
                </Link>
              </li>
            </ul>
          </div>

          {/* SOPORTE */}
          <div>
            <h4 className="font-semibold text-[var(--text-faint)] mb-4 uppercase tracking-wider text-xs">Soporte</h4>
            <ul className="space-y-3">
              <li>
                <Link href="mailto:support@erlchub.com" className="group flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--foreground)] text-sm transition-all duration-300 hover:translate-x-1">
                  <span className="text-[var(--text-faint)] group-hover:text-[#ef4444] transition-colors duration-300"><EmailIcon /></span>
                  Email
                </Link>
              </li>
              <li>
                <Link href="https://discord.gg/xKJqNX7uC3" className="group flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--foreground)] text-sm transition-all duration-300 hover:translate-x-1">
                  <span className="text-[var(--text-faint)] group-hover:text-[#5865F2] transition-colors duration-300"><DiscordIcon className="group-hover:scale-110" /></span>
                  Discord
                </Link>
              </li>
            </ul>
          </div>

          {/* LEGAL */}
          <div>
            <h4 className="font-semibold text-[var(--text-faint)] mb-4 uppercase tracking-wider text-xs">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/terminos" className="group flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--foreground)] text-sm transition-all duration-300 hover:translate-x-1">
                  <span className="text-[var(--text-faint)] group-hover:text-[#8e00f7] transition-colors duration-300"><TermsIcon /></span>
                  Términos
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="group flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--foreground)] text-sm transition-all duration-300 hover:translate-x-1">
                  <span className="text-[var(--text-faint)] group-hover:text-[#22c55e] transition-colors duration-300"><PrivacyIcon /></span>
                  Privacidad
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[var(--card-border-soft)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Copyright & Disclaimer */}
            <div className="text-[var(--text-faint)] text-xs space-y-1 max-w-2xl">
              <p>&copy; 2026 ERLCᴴᵁᴮ. Todos los derechos reservados.</p>
              <p>
               Servicio independiente. No estamos afiliados, asociados ni respaldados por Roblox Corporation o Police Roleplay Community. Todas las marcas pertenecen a sus respectivos propietarios.
              </p>
            </div>

            {/* Payment Methods */}
            <div className="flex items-center gap-3">
              <span className="text-[var(--text-faint)] text-xs uppercase tracking-wider">Pagos seguros</span>
              <div className="flex items-center gap-2">

                <div className="bg-white rounded px-3 py-1.5 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-yellow-500/20 hover: shadow-purple-500/20 cursor-pointer">
                <img src="https://revistaminacion.com/wp-content/uploads/2025/03/19022024-bancolombia.jpg" alt="Bancolombia" className="h-4 w-auto" />
                </div>

                {/* Visa */}
                <div className="bg-white rounded px-3 py-1.5 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-700/20 cursor-pointer">
                  <svg className="h-4 w-auto" viewBox="0 0 48 32" fill="none">
                    <path d="M17.958 10.283l-5.792 11.45h-3.79l-2.85-9.138c-.173-.679-.323-.928-.849-1.215-.86-.467-2.277-.905-3.523-1.177l.084-.42h6.099c.777 0 1.476.517 1.652 1.413l1.51 8.017 3.73-9.43h3.73zm14.722 7.71c.015-3.022-4.178-3.188-4.15-4.537.01-.41.4-.847 1.257-.958.424-.056 1.595-.098 2.923.514l.52-2.432a7.968 7.968 0 0 0-2.773-.507c-2.93 0-4.993 1.558-5.011 3.787-.02 1.65 1.473 2.57 2.6 3.118 1.159.562 1.548.922 1.543 1.424-.008.769-.925 1.108-1.78 1.12-1.495.024-2.364-.404-3.056-.726l-.54 2.52c.696.32 1.98.6 3.312.613 3.114 0 5.15-1.538 5.155-3.936zm7.727 3.74h3.27l-2.852-11.45h-3.02a1.463 1.463 0 0 0-1.37.914l-4.832 10.536h3.113l.618-1.712h3.805l.359 1.712h2.91zm-3.31-4.063l1.561-4.31.898 4.31h-2.46zM24.08 10.283l-2.452 11.45h-2.964l2.454-11.45h2.962z" fill="#1A1F71"/>
                  </svg>
                </div>
                {/* Mastercard */}
                <div className="bg-white rounded px-3 py-1.5 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-orange-500/20 cursor-pointer">
                  <svg className="h-4 w-auto" viewBox="0 0 48 32" fill="none">
                    <circle cx="18" cy="16" r="10" fill="#EB001B"/>
                    <circle cx="30" cy="16" r="10" fill="#F79E1B"/>
                    <path d="M24 8.02a9.965 9.965 0 0 0-6 7.98 9.965 9.965 0 0 0 6 7.98 9.965 9.965 0 0 0 6-7.98 9.965 9.965 0 0 0-6-7.98z" fill="#FF5F00"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
