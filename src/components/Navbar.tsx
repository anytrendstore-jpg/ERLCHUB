"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronRight, Menu, X, ShoppingCart, LogOut, Coins, ShoppingBag, History, LayoutDashboard, ShieldCheck, ClipboardCheck } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useDiscordAuth } from "@/hooks/useDiscordAuth";
import { useHubCoins } from "@/hooks/useHubCoins";
import { useWhitelistStatus } from "@/hooks/useWhitelistStatus";
import UserProfile from "@/components/UserProfile";

const navLinks = [
  { label: "Inicio", href: "/" },
  { label: "Tienda", href: "/tienda" },
  { label: "Soporte", href: "/soporte" },
  { label: "Reseñas", href: "/resenas" },
];

// Client id de producción ya registrado en el portal de Discord — se mantiene
// como valor por defecto para no romper el sitio en vivo.
const DISCORD_LOGIN_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || "1433560156909863084";

/**
 * URL de "Iniciar con Discord" del sitio. El redirect_uri se calcula sobre el
 * origen actual (localhost en desarrollo, el dominio real en producción) en
 * vez de ir grabado a fuego a www.erlchub.pro — así el login funciona también
 * en local. Se puede fijar con NEXT_PUBLIC_DISCORD_REDIRECT_URI si hace falta
 * apuntar a otro dominio distinto del que sirve la página.
 */
function discordLoginUrl() {
  const redirectUri =
    process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI ||
    `${window.location.origin}/api/auth/callback/discord`;
  return (
    `https://discord.com/oauth2/authorize?client_id=${DISCORD_LOGIN_CLIENT_ID}` +
    `&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=identify+guilds.members.read+guilds+email`
  );
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [clickedLink, setClickedLink] = useState<string | null>(null);
  const pathname = usePathname();
  const { totalItems, openCart } = useCart();
  const { isAuthenticated, user, clearSession } = useDiscordAuth();
  const { balance: userHubCoins, fetchBalance } = useHubCoins();
  const [hubCoinsDropdownOpen, setHubCoinsDropdownOpen] = useState(false);
  const whitelist = useWhitelistStatus();

  // Acción principal según en qué punto esté el usuario:
  // sin solicitud -> hacerla · a medias -> continuar · terminada -> su dashboard.
  // Se muestra siempre (sustituye al enlace fijo de Whitelist del menú).
  const showWhitelistCta = !whitelist.loading;
  const primaryAction = whitelist.completed
    ? { href: "/dashboard", label: "Mi Dashboard", icon: LayoutDashboard }
    : whitelist.hasApplication
      ? { href: whitelist.nextRoute, label: "Continuar whitelist", icon: ClipboardCheck }
      : { href: "/whitelist", label: "Hacer whitelist", icon: ClipboardCheck };

  // En modo beta el acceso a staff está visible para poder revisarlo en local.
  const showStaffButton = whitelist.isStaff || process.env.NEXT_PUBLIC_WHITELIST_BETA === "1";

  // Handle scroll to add background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  const handleLinkClick = (href: string) => {
    setClickedLink(href);
    setTimeout(() => setClickedLink(null), 200);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      clearSession();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      clearSession(); 
      window.location.href = '/';
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "py-2" : "py-0"
      }`}
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8">
        <nav
          className={`flex items-center justify-between py-3 sm:py-4 transition-all duration-300 ${
            isScrolled 
              ? "bg-[#0c0c14]/95 nav-blur rounded-2xl sm:rounded-2xl px-3 sm:px-4 border-0 shadow-xl shadow-black/20" 
              : ""
          }`}
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 z-50 transition-transform duration-200 hover:scale-105 active:scale-95"
            onClick={() => handleLinkClick("/")}
          >
            <Image
              src="/logo.png"
              alt="ERLC HUB Logo"
              width={48}
              height={48}
              className="h-9 sm:h-12 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 bg-[#12121c]/80 nav-blur rounded-full px-2 py-1.5 border border-[#1a1a28]">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              const isClicked = clickedLink === link.href;

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => handleLinkClick(link.href)}
                  className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform ${
                    isActive
                      ? "bg-[#8e00f7] text-white shadow-lg shadow-[#8e00f7]/25"
                      : "text-gray-400 hover:text-white hover:bg-[#1a1a28]"
                  } ${isClicked ? "scale-90" : "scale-100"} active:scale-90`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Auth Buttons + Cart */}
          <div className="hidden md:flex items-center gap-2 sm:gap-3">
            {/* Panel de staff: solo para cuentas de staff */}
            {showStaffButton && (
              <Link
                href="/staff"
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#2563eb] hover:bg-[#3b82f6] text-white text-sm font-semibold transition-all shadow-lg shadow-blue-600/25 hover:scale-[1.02]"
                title="Panel de Staff"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Staff</span>
              </Link>
            )}

            {/* Whitelist / dashboard del usuario */}
            {showWhitelistCta && (
              <Link
                href={primaryAction.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold transition-all hover:scale-[1.02] ${
                  whitelist.completed
                    ? "bg-[#12121c] border border-[#8e00f7]/40 text-[#c084fc] hover:border-[#8e00f7]"
                    : "bg-[#12121c] border border-[#1a1a28] text-gray-300 hover:text-white hover:border-[#8e00f7]"
                }`}
              >
                <primaryAction.icon className="h-4 w-4" />
                {/* En pantallas medianas se acorta para que quepa todo */}
                <span className="lg:hidden">{whitelist.completed ? "Dashboard" : "Whitelist"}</span>
                <span className="hidden lg:inline">{primaryAction.label}</span>
              </Link>
            )}

            {/* Hub Coins Button */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setHubCoinsDropdownOpen(!hubCoinsDropdownOpen)}
                  className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#12121c] border border-[#1a1a28] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#8e00f7] transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Image
                    src="/hub-coins.png"
                    alt="Hub Coins"
                    width={36}
                    height={36}
                    className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-[#8e00f7] text-white text-xs font-bold rounded px-1 py-0.5 min-w-[16px] text-center">
                    {userHubCoins}
                  </span>
                </button>

                {/* Hub Coins Dropdown */}
                {hubCoinsDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#1a1a28] border border-[#2a2a38] rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-[#2a2a38]">
                      <div className="flex items-center gap-2 text-white">
                        <Image
                          src="/hub-coins.png"
                          alt="Hub Coins"
                          width={24}
                          height={24}
                          className="h-6 w-6 object-contain"
                        />
                        <span className="font-semibold">Hub Coins</span>
                      </div>
                      <div className="text-2xl font-bold text-[#8e00f7] mt-1">{userHubCoins}</div>
                    </div>
                    <div className="p-1">
                      <Link
                        href="/tienda/hub-coins"
                        onClick={() => setHubCoinsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-[#2a2a38] hover:text-white rounded-md transition-colors"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        <span>Comprar Hub Coins</span>
                      </Link>
                      <Link
                        href="/pedidos"
                        onClick={() => setHubCoinsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-[#2a2a38] hover:text-white rounded-md transition-colors"
                      >
                        <History className="h-4 w-4" />
                        <span>Mis Compras</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cart Button */}
            <Link
              href="/tienda/carrito"
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#12121c] border border-[#1a1a28] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#8e00f7] transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[#8e00f7] text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <UserProfile />
            ) : (
              <button
                onClick={() => {
                  window.location.href = discordLoginUrl();
                }}
                className="flex items-center gap-1 sm:gap-2 bg-[#8e00f7] hover:bg-[#7a00d4] text-white font-semibold px-3 sm:px-4 py-2 rounded-full transition-all shadow-lg shadow-[#8e00f7]/25 hover:shadow-[#8e00f7]/40 transform hover:scale-[1.02] relative overflow-hidden group text-sm sm:text-base"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#8e00f7]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Discord Logo */}
                <svg className="h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0463-.319 13.5809.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.872-.902a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.074.074 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.9019.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5489-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
                </svg>
                
                <span className="hidden sm:inline">Inicia Sesión</span>
                <span className="sm:hidden">Login</span>
              </button>
            )}
          </div>

          {/* Mobile - Cart + Menu Button */}
          <div className="md:hidden flex items-center gap-1 z-50">
            {/* Mobile Cart Button */}
            <button
              type="button"
              onClick={openCart}
              className="relative w-9 h-9 rounded-full bg-[#12121c] border border-[#1a1a28] flex items-center justify-center text-gray-400 hover:text-white transition-all"
            >
              <ShoppingCart className="h-4 w-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#8e00f7] text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </button>

            <button
              type="button"
              className="p-1.5 transition-transform duration-200 active:scale-90"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <div className={`transition-transform duration-300 ${mobileMenuOpen ? "rotate-90" : "rotate-0"}`}>
                {mobileMenuOpen ? (
                  <X className="h-5 w-5 text-white" />
                ) : (
                  <Menu className="h-5 w-5 text-white" />
                )}
              </div>
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden fixed inset-0 bg-[#0c0c14]/98 nav-blur pt-16 px-4 sm:px-6 transition-all duration-300 ${
          mobileMenuOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="flex flex-col gap-2">
          {navLinks.map((link, index) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.label}
                href={link.href}
                className={`px-4 py-4 rounded-xl text-lg font-medium transition-all duration-300 transform ${
                  isActive
                    ? "bg-[#8e00f7] text-white"
                    : "text-gray-400 hover:bg-[#1a1a28] hover:text-white"
                } active:scale-95`}
                style={{
                  transitionDelay: mobileMenuOpen ? `${index * 50}ms` : "0ms",
                  transform: mobileMenuOpen ? "translateX(0)" : "translateX(-20px)",
                  opacity: mobileMenuOpen ? 1 : 0,
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
          {/* Accesos rápidos: whitelist / dashboards */}
          {(showWhitelistCta || showStaffButton) && (
            <div className="flex flex-col gap-2 pt-2">
              {showStaffButton && (
                <Link
                  href="/staff"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-4 rounded-xl bg-[#2563eb] text-white text-lg font-semibold transition-all active:scale-95"
                >
                  <ShieldCheck className="h-5 w-5" />
                  Panel de Staff
                </Link>
              )}
              {showWhitelistCta && (
                <Link
                  href={primaryAction.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-4 rounded-xl text-lg font-medium transition-all active:scale-95 ${
                    whitelist.completed
                      ? "bg-[#8e00f7]/15 border border-[#8e00f7]/40 text-[#c084fc]"
                      : "bg-[#1a1a28] text-gray-300"
                  }`}
                >
                  <primaryAction.icon className="h-5 w-5" />
                  {primaryAction.label}
                </Link>
              )}
            </div>
          )}

          <div
            className="border-t border-[#1a1a28] pt-4 mt-4 flex flex-col gap-3"
            style={{
              transitionDelay: mobileMenuOpen ? `${navLinks.length * 50}ms` : "0ms",
              transform: mobileMenuOpen ? "translateY(0)" : "translateY(20px)",
              opacity: mobileMenuOpen ? 1 : 0,
              transition: "all 0.3s ease",
            }}
          >
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1a1a28]">
                  {user?.avatar && (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`}
                      alt={user.username}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div className="flex-1">
                    <div className="text-white font-medium">{user?.global_name || user?.username}</div>
                    <div className="text-gray-400 text-sm">Discord</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 text-gray-400 text-lg font-medium px-4 py-3 rounded-xl hover:bg-[#1a1a28] hover:text-white transition-all active:scale-95"
                >
                  <LogOut className="h-5 w-5" />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  window.location.href = discordLoginUrl();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 bg-[#8e00f7] hover:bg-[#7a00d4] text-white font-semibold px-4 py-4 rounded-xl transition-all shadow-lg shadow-[#8e00f7]/25 hover:shadow-[#8e00f7]/40 transform hover:scale-[1.02] relative overflow-hidden group"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#8e00f7]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0463-.319 13.5809.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.872-.902a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.074.074 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.9019.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5489-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
                </svg>
                
                <span>Inicia Sesión</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
